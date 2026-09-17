-- POSTS: trash + extra review/SEO fields
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS trashed_at timestamptz,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS money_back_guarantee text,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS coupon_url text,
  ADD COLUMN IF NOT EXISTS robots_meta text DEFAULT 'index, follow',
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS social_image text;

CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_key ON public.posts (slug);
CREATE INDEX IF NOT EXISTS posts_status_published_idx ON public.posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS posts_trashed_idx ON public.posts (trashed_at);
CREATE INDEX IF NOT EXISTS posts_updated_idx ON public.posts (updated_at DESC);
CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts (category_id);

-- CATEGORIES: hierarchy + image
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url text;
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS tags_slug_key ON public.tags (slug);

-- MEDIA: metadata
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS folder text DEFAULT 'content';
CREATE INDEX IF NOT EXISTS media_created_idx ON public.media (created_at DESC);

-- COMMENTS: moderation status
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_status_check;
ALTER TABLE public.comments
  ADD CONSTRAINT comments_status_check CHECK (status IN ('pending','approved','spam','trash'));
UPDATE public.comments SET status = 'approved' WHERE is_approved AND status <> 'approved';

CREATE OR REPLACE FUNCTION public.sync_comment_approval()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.is_approved := (NEW.status = 'approved');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS comments_sync_approval ON public.comments;
CREATE TRIGGER comments_sync_approval BEFORE INSERT OR UPDATE OF status ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_approval();
CREATE INDEX IF NOT EXISTS comments_status_idx ON public.comments (status, created_at DESC);

-- REVISIONS
CREATE TABLE IF NOT EXISTS public.post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_revisions TO authenticated;
GRANT ALL ON public.post_revisions TO service_role;
ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff read revisions" ON public.post_revisions;
CREATE POLICY "Staff read revisions" ON public.post_revisions FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff write revisions" ON public.post_revisions;
CREATE POLICY "Staff write revisions" ON public.post_revisions FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Managers delete revisions" ON public.post_revisions;
CREATE POLICY "Managers delete revisions" ON public.post_revisions FOR DELETE TO authenticated
  USING (public.can_manage_all(auth.uid()));
CREATE INDEX IF NOT EXISTS post_revisions_post_idx ON public.post_revisions (post_id, created_at DESC);

-- SITE SETTINGS: full CMS options
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS site_url text,
  ADD COLUMN IF NOT EXISTS favicon_url text,
  ADD COLUMN IF NOT EXISTS admin_email text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS posts_per_page integer NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS default_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_post_type text DEFAULT 'review',
  ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comments_require_approval boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_upload_mb integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS social_image text,
  ADD COLUMN IF NOT EXISTS default_robots text DEFAULT 'index, follow',
  ADD COLUMN IF NOT EXISTS sitemap_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_affiliate_cta text DEFAULT 'Visit website',
  ADD COLUMN IF NOT EXISTS footer_text text;