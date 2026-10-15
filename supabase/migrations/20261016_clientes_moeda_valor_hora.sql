-- =====================================================================
-- Gestão Comercial — moeda e valor/hora por cliente.
-- Cole no Supabase > SQL Editor > New query e clique em Run.
-- Idempotente: pode ser executado mais de uma vez.
-- =====================================================================

-- Cada cliente tem sua própria moeda (BRL/EUR/USD) e valor por hora. No
-- orçamento, ao selecionar o cliente o documento passa a usar essa moeda;
-- ao digitar as horas de um tópico, o valor é preenchido automaticamente
-- (horas × valor/hora do cliente), mas continua editável manualmente.
alter table public.clients
  add column if not exists currency text not null default 'BRL',
  add column if not exists hourly_rate numeric(12,2) not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_currency_check') then
    alter table public.clients
      add constraint clients_currency_check check (currency in ('BRL', 'EUR', 'USD'));
  end if;
end
$$;
