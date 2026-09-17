DROP POLICY IF EXISTS posts_public_read_published ON public.posts;
CREATE POLICY posts_public_read_published ON public.posts FOR SELECT TO anon, authenticated
USING (
  trashed_at IS NULL
  AND (
    (status = 'published' AND (published_at IS NULL OR published_at <= now()))
    OR (status = 'scheduled' AND published_at IS NOT NULL AND published_at <= now())
  )
);

DROP POLICY IF EXISTS user_roles_admin_insert ON public.user_roles;
CREATE POLICY user_roles_admin_insert ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
CREATE POLICY user_roles_admin_update ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;
CREATE POLICY user_roles_admin_delete ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;