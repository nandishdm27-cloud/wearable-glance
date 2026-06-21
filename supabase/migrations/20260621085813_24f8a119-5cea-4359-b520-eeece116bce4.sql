
DROP POLICY IF EXISTS "Public insert watch_events" ON public.watch_events;
REVOKE INSERT ON public.watch_events FROM anon;
