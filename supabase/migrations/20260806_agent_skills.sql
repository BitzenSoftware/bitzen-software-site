-- Agent skills, editable from the admin panel instead of hardcoded in agent-chat.
-- A row here OVERRIDES the built-in default for that agent_id; no row means the
-- function falls back to the default compiled into agent-chat. That keeps the
-- defaults in version control and makes this table purely additive.

CREATE TABLE IF NOT EXISTS agent_skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id text NOT NULL UNIQUE,
  name text DEFAULT '',
  system_prompt text NOT NULL,
  model text DEFAULT NULL,          -- NULL = use the function's default model
  max_tokens integer DEFAULT NULL,  -- NULL = use the function's default
  active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_skills_agent_id_idx ON agent_skills (agent_id);

ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;

-- Read is public so the admin UI can render current values with the anon key.
DROP POLICY IF EXISTS "anon_read" ON agent_skills;
CREATE POLICY "anon_read" ON agent_skills FOR SELECT TO anon, authenticated USING (true);

-- Writes are NOT granted to anon. The existing tables in this project use
-- `CREATE POLICY ... USING (true)` with no TO clause, which Postgres applies to
-- PUBLIC — that lets anyone holding the (public) anon key write. Verified against
-- the settings table. These prompts drive content published to LinkedIn, so
-- writes go through the agent-skills edge function, which checks an ADMIN_TOKEN
-- held in Supabase secrets and never shipped to the browser.
DROP POLICY IF EXISTS "service_write" ON agent_skills;
CREATE POLICY "service_write" ON agent_skills FOR ALL TO service_role USING (true) WITH CHECK (true);
