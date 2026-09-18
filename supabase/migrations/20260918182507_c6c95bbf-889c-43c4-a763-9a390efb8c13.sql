CREATE TABLE public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  prompt text NOT NULL,
  title text,
  article_type text,
  language text DEFAULT 'English',
  tone text,
  target_word_count integer,
  word_count integer,
  model text,
  status text NOT NULL DEFAULT 'completed',
  error_message text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  input_tokens integer,
  output_tokens integer,
  duration_ms integer,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_generations_created_idx ON public.ai_generations (created_at DESC);
CREATE INDEX ai_generations_user_idx ON public.ai_generations (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read own or all AI generations"
ON public.ai_generations FOR SELECT TO authenticated
USING (public.can_manage_all(auth.uid()) OR (public.is_staff(auth.uid()) AND user_id = auth.uid()));

CREATE POLICY "Staff create AI generations"
ON public.ai_generations FOR INSERT TO authenticated
WITH CHECK (public.is_staff(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Staff update own or all AI generations"
ON public.ai_generations FOR UPDATE TO authenticated
USING (public.can_manage_all(auth.uid()) OR (public.is_staff(auth.uid()) AND user_id = auth.uid()));

CREATE POLICY "Staff delete own or all AI generations"
ON public.ai_generations FOR DELETE TO authenticated
USING (public.can_manage_all(auth.uid()) OR (public.is_staff(auth.uid()) AND user_id = auth.uid()));

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'lovable',
  ADD COLUMN IF NOT EXISTS ai_model text DEFAULT 'openai/gpt-6-astra',
  ADD COLUMN IF NOT EXISTS ai_default_language text DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS ai_default_tone text DEFAULT 'Natural',
  ADD COLUMN IF NOT EXISTS ai_default_word_count integer DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS ai_default_audience text DEFAULT 'US audience',
  ADD COLUMN IF NOT EXISTS ai_max_words integer DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS ai_images_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_tools_enabled boolean DEFAULT true;