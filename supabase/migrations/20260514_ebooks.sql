CREATE TABLE IF NOT EXISTS ebooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text DEFAULT '',
  price text DEFAULT '',
  platform text DEFAULT 'hotmart',
  buy_url text DEFAULT '',
  cover text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON ebooks FOR SELECT USING (true);
CREATE POLICY "service_all" ON ebooks USING (true) WITH CHECK (true);
