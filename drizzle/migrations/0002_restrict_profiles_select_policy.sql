DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or game peers"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM public.games g
      WHERE (
        (g.host_id = auth.uid() OR g.guest_id = auth.uid())
        AND (g.host_id = profiles.id OR g.guest_id = profiles.id)
      )
      OR (
        g.status = 'waiting'
        AND g.guest_id IS NULL
        AND g.host_id = profiles.id
      )
    )
  );
