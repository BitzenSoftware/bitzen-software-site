-- Two changes in one migration:
--   1. Agents become rows (one per app, created automatically) and each agent
--      owns MANY named skills instead of a single prompt.
--   2. RLS on the pre-existing tables is tightened. They were created with
--      `CREATE POLICY ... USING (true)` and no TO clause, which Postgres applies
--      to PUBLIC — anyone holding the public anon key could write to them.

-- ── 1. Agents ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id text NOT NULL UNIQUE,             -- slug used by the frontend
  name text NOT NULL,
  description text DEFAULT '',
  base_prompt text DEFAULT '',               -- persona + product facts
  app_id text REFERENCES apps(id) ON DELETE CASCADE,  -- apps.id is text, not uuid
  kind text NOT NULL DEFAULT 'produto',      -- 'produto' | 'funcional'
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agents_app_id_idx ON agents (app_id);

-- ── 2. Skills: many per agent ───────────────────────────────────────────────
-- agent_skills previously held one row per agent (agent_id UNIQUE) with the
-- whole prompt. Reshape it into named, individually selectable skills.

ALTER TABLE agent_skills DROP CONSTRAINT IF EXISTS agent_skills_agent_id_key;
ALTER TABLE agent_skills ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE agent_skills ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE agent_skills ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE agent_skills ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Carry any existing single-prompt rows over into the new content column.
UPDATE agent_skills SET content = system_prompt WHERE content IS NULL;
ALTER TABLE agent_skills ALTER COLUMN system_prompt DROP NOT NULL;

CREATE INDEX IF NOT EXISTS agent_skills_agent_order_idx ON agent_skills (agent_id, sort_order);

-- ── 3. One agent per app, automatically ─────────────────────────────────────

-- Minimal slugifier: lowercase, strip accents we actually use, keep [a-z0-9].
CREATE OR REPLACE FUNCTION bitzen_slug(txt text) RETURNS text AS $$
  SELECT regexp_replace(
    lower(translate(coalesce(txt, ''),
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')),
    '[^a-z0-9]+', '', 'g')
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION agents_sync_from_app() RETURNS trigger AS $$
DECLARE
  slug text;
BEGIN
  slug := bitzen_slug(NEW.name);
  IF slug = '' THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO agents (agent_id, name, description, app_id, kind, sort_order)
    VALUES (slug, NEW.name, coalesce(NEW.description, ''), NEW.id, 'produto', coalesce(NEW.sort_order, 0))
    ON CONFLICT (agent_id) DO UPDATE
      SET app_id = EXCLUDED.app_id,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          updated_at = now();
  ELSE
    -- Keep the label in sync, but never rename an agent_id already in use.
    UPDATE agents
       SET name = NEW.name,
           description = coalesce(NEW.description, ''),
           updated_at = now()
     WHERE app_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS apps_create_agent ON apps;
CREATE TRIGGER apps_create_agent
  AFTER INSERT OR UPDATE OF name, description ON apps
  FOR EACH ROW EXECUTE FUNCTION agents_sync_from_app();

-- Backfill agents for apps that already exist.
INSERT INTO agents (agent_id, name, description, app_id, kind, sort_order)
SELECT bitzen_slug(a.name), a.name, coalesce(a.description, ''), a.id, 'produto', coalesce(a.sort_order, 0)
FROM apps a
WHERE bitzen_slug(a.name) <> ''
ON CONFLICT (agent_id) DO UPDATE SET app_id = EXCLUDED.app_id, updated_at = now();

-- Functional agents have no app of their own.
INSERT INTO agents (agent_id, name, description, kind, sort_order) VALUES
  ('pesquisador', 'Pesquisador', 'Analisa mercado, concorrentes e tendências', 'funcional', 10),
  ('copywriter',  'Copywriter',  'Cria posts e conteúdo de marketing',          'funcional', 20),
  ('revisor',     'Revisor',     'Revê e melhora conteúdos criados',            'funcional', 30),
  ('gerente',     'Gerente',     'Aprova ou devolve conteúdos para revisão',    'funcional', 40),
  ('vinculo',     'Vínculo',     'Prontuário eletrónico TCC para psicólogos',   'produto',   50)
ON CONFLICT (agent_id) DO NOTHING;

-- ── 4. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read" ON agents;
CREATE POLICY "anon_read" ON agents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "service_write" ON agents;
CREATE POLICY "service_write" ON agents FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON agents TO anon, authenticated;
GRANT ALL ON agents TO service_role;

-- settings / ebooks / apps: read-only for the public. Admin writes go through
-- the admin-data edge function, which holds the service role key.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['settings', 'ebooks', 'apps'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "service_all" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_read" ON %I', t);
    EXECUTE format('CREATE POLICY "anon_read" ON %I FOR SELECT TO anon, authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "service_write" ON %I', t);
    EXECUTE format('CREATE POLICY "service_write" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON %I FROM anon, authenticated', t);
    EXECUTE format('GRANT SELECT ON %I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON %I TO service_role', t);
  END LOOP;
END $$;

-- testimonials: visitors may submit one, and only unapproved. Approving and
-- deleting stay with the service role.
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all" ON testimonials;
DROP POLICY IF EXISTS "anon_read" ON testimonials;
CREATE POLICY "anon_read" ON testimonials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_submit" ON testimonials;
CREATE POLICY "anon_submit" ON testimonials FOR INSERT TO anon, authenticated
  WITH CHECK (coalesce(approved, false) = false);
DROP POLICY IF EXISTS "service_write" ON testimonials;
CREATE POLICY "service_write" ON testimonials FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE UPDATE, DELETE ON testimonials FROM anon, authenticated;
GRANT SELECT, INSERT ON testimonials TO anon, authenticated;
GRANT ALL ON testimonials TO service_role;

-- blog_posts: the like button is a public UPDATE, but only of likes_count.
-- Column-level GRANT is what limits it; RLS alone cannot scope to a column.
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all" ON blog_posts;
DROP POLICY IF EXISTS "anon_read" ON blog_posts;
CREATE POLICY "anon_read" ON blog_posts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_like" ON blog_posts;
CREATE POLICY "anon_like" ON blog_posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "service_write" ON blog_posts;
CREATE POLICY "service_write" ON blog_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON blog_posts FROM anon, authenticated;
GRANT SELECT ON blog_posts TO anon, authenticated;
GRANT UPDATE (likes_count) ON blog_posts TO anon, authenticated;
GRANT ALL ON blog_posts TO service_role;

-- post_comments: public submission stays open.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'post_comments') THEN
    EXECUTE 'ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "service_all" ON post_comments';
    EXECUTE 'DROP POLICY IF EXISTS "anon_read" ON post_comments';
    EXECUTE 'CREATE POLICY "anon_read" ON post_comments FOR SELECT TO anon, authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "anon_submit" ON post_comments';
    EXECUTE 'CREATE POLICY "anon_submit" ON post_comments FOR INSERT TO anon, authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "service_write" ON post_comments';
    EXECUTE 'CREATE POLICY "service_write" ON post_comments FOR ALL TO service_role USING (true) WITH CHECK (true)';
    EXECUTE 'REVOKE UPDATE, DELETE ON post_comments FROM anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT ON post_comments TO anon, authenticated';
    EXECUTE 'GRANT ALL ON post_comments TO service_role';
  END IF;
END $$;

-- agent_skills keeps its own policies from the previous migration.
GRANT SELECT ON agent_skills TO anon, authenticated;
GRANT ALL ON agent_skills TO service_role;

NOTIFY pgrst, 'reload schema';
