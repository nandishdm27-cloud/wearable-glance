
CREATE TABLE public.watch_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('vitals','steps','game_score')),
  heart_rate INTEGER,
  spo2 INTEGER,
  steps INTEGER,
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.watch_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_events TO authenticated;
GRANT ALL ON public.watch_events TO service_role;

ALTER TABLE public.watch_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read watch_events" ON public.watch_events FOR SELECT USING (true);
CREATE POLICY "Public insert watch_events" ON public.watch_events FOR INSERT WITH CHECK (true);

CREATE INDEX watch_events_type_created_idx ON public.watch_events (event_type, created_at DESC);

-- Seed demo data: 40 vitals, 40 steps, 20 game_scores over the past ~3 hours
INSERT INTO public.watch_events (event_type, heart_rate, spo2, created_at)
SELECT
  'vitals',
  (65 + (random()*40))::int,
  (94 + (random()*5))::int,
  now() - (i || ' minutes')::interval
FROM generate_series(1, 40) i;

INSERT INTO public.watch_events (event_type, steps, created_at)
SELECT
  'steps',
  (200 + (random()*1500))::int,
  now() - (i*4 || ' minutes')::interval
FROM generate_series(1, 40) i;

INSERT INTO public.watch_events (event_type, score, created_at)
SELECT
  'game_score',
  (100 + (random()*900))::int,
  now() - (i*10 || ' minutes')::interval
FROM generate_series(1, 20) i;
