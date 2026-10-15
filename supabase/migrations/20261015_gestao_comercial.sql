-- =====================================================================
-- Gestão Comercial — clientes, orçamentos/propostas e perfil do timbre.
-- Idempotente: pode ser executado mais de uma vez.
-- =====================================================================

-- ---------- 0. Verificação de conflito ----------------------------------
do $guard$
declare
  t text;
  col text;
begin
  foreach t in array array['company_profiles:company_name', 'clients:trade_name', 'quotes:introduction', 'quote_items:quote_id'] loop
    col := split_part(t, ':', 2);
    t := split_part(t, ':', 1);
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = t)
       and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = col) then
      raise exception 'A tabela public.% já existe e pertence a outro sistema. Nada foi alterado.', t;
    end if;
  end loop;
end
$guard$;

-- ---------- 1. Perfil da empresa (1 linha por usuário) ----------------
-- Nome "company_profiles" (em vez de "profiles") para não colidir com uma
-- futura tabela de perfis de usuário do site.
create table if not exists public.company_profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  company_name   text not null default '',
  legal_name     text not null default '',
  document       text not null default '',
  email          text not null default '',
  phone          text not null default '',
  website        text not null default '',
  address        text not null default '',
  city           text not null default '',
  state          text not null default '',
  zip            text not null default '',
  logo_url       text,
  brand_color    text not null default '#6c3de8',
  currency       text not null default 'BRL',
  default_validity_days int not null default 15,
  default_terms  text not null default '',
  bank_info      text not null default '',
  updated_at     timestamptz not null default now()
);

-- ---------- 2. Clientes ------------------------------------------------
create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name          text not null,
  trade_name    text not null default '',
  document      text not null default '',
  contact_name  text not null default '',
  email         text not null default '',
  phone         text not null default '',
  address       text not null default '',
  city          text not null default '',
  state         text not null default '',
  zip           text not null default '',
  notes         text not null default '',
  created_at    timestamptz not null default now()
);
create index if not exists clients_user_idx on public.clients(user_id, name);

-- ---------- 3. Orçamentos / propostas ----------------------------------
create table if not exists public.quotes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  number        int  not null default 0,
  kind          text not null default 'orcamento' check (kind in ('orcamento','proposta')),
  status        text not null default 'rascunho'  check (status in ('rascunho','enviado','aprovado','recusado')),
  client_id     uuid references public.clients(id) on delete set null,
  title         text not null default '',
  introduction  text not null default '',
  terms         text not null default '',
  discount      numeric(12,2) not null default 0,
  issue_date    date not null default current_date,
  valid_until   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, number)
);
create index if not exists quotes_user_idx on public.quotes(user_id, number desc);

-- ---------- 4. Itens (tópicos) do orçamento ----------------------------
create table if not exists public.quote_items (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position     int  not null default 0,
  title        text not null default '',
  description  text not null default '',
  hours        numeric(10,2) not null default 0,
  amount       numeric(12,2) not null default 0
);
create index if not exists quote_items_quote_idx on public.quote_items(quote_id, position);

-- ---------- 5. Numeração sequencial por usuário ------------------------
create or replace function public.set_quote_number()
returns trigger language plpgsql as $fn$
begin
  if new.number is null or new.number = 0 then
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select coalesce(max(q.number), 0) + 1 into new.number
      from public.quotes q where q.user_id = new.user_id;
  end if;
  return new;
end
$fn$;

drop trigger if exists quotes_set_number on public.quotes;
create trigger quotes_set_number before insert on public.quotes
  for each row execute function public.set_quote_number();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end
$fn$;

drop trigger if exists quotes_touch on public.quotes;
create trigger quotes_touch before update on public.quotes
  for each row execute function public.touch_updated_at();

drop trigger if exists company_profiles_touch on public.company_profiles;
create trigger company_profiles_touch before update on public.company_profiles
  for each row execute function public.touch_updated_at();

-- ---------- 6. Segurança (RLS): cada usuário só vê os próprios dados ---
alter table public.company_profiles enable row level security;
alter table public.clients          enable row level security;
alter table public.quotes           enable row level security;
alter table public.quote_items      enable row level security;

drop policy if exists "own company profile" on public.company_profiles;
create policy "own company profile" on public.company_profiles for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own clients" on public.clients;
create policy "own clients" on public.clients for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own quotes" on public.quotes;
create policy "own quotes" on public.quotes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own items" on public.quote_items;
create policy "own items" on public.quote_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- 7. Storage para o logotipo ---------------------------------
-- Bucket público: o gerador de PDF precisa ler a imagem do logo.
-- Cada usuário só grava dentro da pasta com o próprio id.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

drop policy if exists "logos read" on storage.objects;
create policy "logos read" on storage.objects for select
  using (bucket_id = 'logos');

drop policy if exists "logos write" on storage.objects;
create policy "logos write" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos update" on storage.objects;
create policy "logos update" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos delete" on storage.objects;
create policy "logos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
