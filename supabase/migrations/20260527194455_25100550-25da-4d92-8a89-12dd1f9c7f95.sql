-- Persona drives the home / account layout split between operators vs recruiters / team leads.
DO $$ BEGIN
  CREATE TYPE public.user_persona AS ENUM (
    'csm','senior_csm','manager','director','vp','recruiter','team_lead'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS persona public.user_persona,
  ADD COLUMN IF NOT EXISTS seniority text;

-- Ensure authenticated users can read/update their own profile row for persona writes.
DO $$ BEGIN
  CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT TO authenticated
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can upsert own profile"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;