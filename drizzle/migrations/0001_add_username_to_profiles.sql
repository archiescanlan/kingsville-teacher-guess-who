ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
BEGIN
  v_username := NULLIF(LOWER(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'username', ''))), '');
  v_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'display_name'), ''),
    v_username,
    NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
    'Player'
  );
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, v_username, v_display_name)
  ON CONFLICT (id) DO UPDATE
    SET username = COALESCE(EXCLUDED.username, public.profiles.username),
        display_name = EXCLUDED.display_name;
  RETURN NEW;
END;
$$;
