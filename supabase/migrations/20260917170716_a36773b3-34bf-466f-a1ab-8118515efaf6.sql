-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','editor','author');
CREATE TYPE public.post_status AS ENUM ('draft','published','scheduled');
CREATE TYPE public.post_type AS ENUM ('review','comparison','guide','article');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Staff member',
  job_title TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_all(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'));
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN (SELECT count(*) FROM public.user_roles) = 0 THEN 'admin'::public.app_role ELSE 'author'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_manage" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  accent TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories_staff_manage" ON public.categories FOR ALL TO authenticated USING (public.can_manage_all(auth.uid())) WITH CHECK (public.can_manage_all(auth.uid()));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TAGS
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_public_read" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tags_staff_manage" ON public.tags FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- POSTS
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT 'Vistora Editorial',
  author_title TEXT,
  author_bio TEXT,
  post_type public.post_type NOT NULL DEFAULT 'article',
  status public.post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  reading_time INT NOT NULL DEFAULT 5,
  view_count INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  seo_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  canonical_url TEXT,
  product_name TEXT,
  product_url TEXT,
  affiliate_url TEXT,
  affiliate_cta_label TEXT,
  rating NUMERIC(2,1),
  pros TEXT[] NOT NULL DEFAULT '{}',
  cons TEXT[] NOT NULL DEFAULT '{}',
  key_features TEXT[] NOT NULL DEFAULT '{}',
  alternatives TEXT[] NOT NULL DEFAULT '{}',
  pricing_summary TEXT,
  who_is_it_for TEXT,
  how_it_works TEXT,
  verdict TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_status_published_idx ON public.posts (status, published_at DESC);
CREATE INDEX posts_category_idx ON public.posts (category_id);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_public_read_published" ON public.posts FOR SELECT TO anon, authenticated
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));
CREATE POLICY "posts_staff_read" ON public.posts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "posts_author_insert" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND (public.can_manage_all(auth.uid()) OR author_id = auth.uid()));
CREATE POLICY "posts_author_update" ON public.posts FOR UPDATE TO authenticated
  USING (public.can_manage_all(auth.uid()) OR author_id = auth.uid())
  WITH CHECK (public.can_manage_all(auth.uid()) OR author_id = auth.uid());
CREATE POLICY "posts_author_delete" ON public.posts FOR DELETE TO authenticated
  USING (public.can_manage_all(auth.uid()) OR author_id = auth.uid());
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- POST TAGS
CREATE TABLE public.post_tags (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.post_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tags TO authenticated;
GRANT ALL ON public.post_tags TO service_role;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_tags_public_read" ON public.post_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "post_tags_staff_manage" ON public.post_tags FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- MEDIA
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  storage_path TEXT,
  url TEXT NOT NULL,
  alt_text TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_public_read" ON public.media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media_staff_manage" ON public.media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- COMMENTS
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read_approved" ON public.comments FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "comments_staff_read" ON public.comments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "comments_public_insert" ON public.comments FOR INSERT TO anon, authenticated WITH CHECK (is_approved = false);
CREATE POLICY "comments_staff_manage" ON public.comments FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "comments_staff_delete" ON public.comments FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT NOT NULL DEFAULT 'Vistora Reviews',
  tagline TEXT,
  logo_url TEXT,
  default_seo_title TEXT,
  default_meta_description TEXT,
  affiliate_disclosure TEXT,
  contact_email TEXT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_settings_admin_update" ON public.site_settings FOR UPDATE TO authenticated USING (public.can_manage_all(auth.uid())) WITH CHECK (public.can_manage_all(auth.uid()));
CREATE POLICY "site_settings_admin_insert" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.can_manage_all(auth.uid()));

-- NEWSLETTER
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "newsletter_staff_read" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "newsletter_staff_delete" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.can_manage_all(auth.uid()));

-- CONTACT MESSAGES
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_public_insert" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contact_staff_read" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "contact_staff_manage" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "contact_staff_delete" ON public.contact_messages FOR DELETE TO authenticated USING (public.can_manage_all(auth.uid()));

-- SEED SETTINGS
INSERT INTO public.site_settings (id, site_name, tagline, default_seo_title, default_meta_description, affiliate_disclosure, contact_email, twitter_handle)
VALUES (1, 'Vistora Reviews', 'Independent reviews of the digital tools that run modern work.',
 'Vistora Reviews — Independent Digital Product Reviews',
 'Hands-on reviews, comparisons and how-to guides for AI tools, SaaS, marketing software, productivity apps and WordPress products.',
 'Some links on Vistora Reviews are affiliate links. If you buy through them we may earn a commission at no extra cost to you. It never influences our scores or verdicts.',
 'hello@vistorareviews.com', '@vistorareviews');

-- SEED CATEGORIES
INSERT INTO public.categories (name, slug, description, accent, sort_order) VALUES
 ('Software', 'software', 'In-depth reviews of SaaS platforms and business software.', 'sky', 1),
 ('AI Tools', 'ai-tools', 'Testing the AI assistants, writers and agents worth paying for.', 'violet', 2),
 ('Marketing Tools', 'marketing-tools', 'Email, SEO, social and analytics tools that actually move numbers.', 'amber', 3),
 ('Productivity', 'productivity', 'Note taking, project management and focus tools for real teams.', 'emerald', 4),
 ('WordPress', 'wordpress', 'Themes, plugins and hosting reviewed on live sites.', 'rose', 5),
 ('Comparisons', 'comparisons', 'Head-to-head breakdowns to help you choose fast.', 'cyan', 6),
 ('How-To Guides', 'how-to-guides', 'Step-by-step tutorials for the tools we review.', 'indigo', 7);

-- SEED TAGS
INSERT INTO public.tags (name, slug, description) VALUES
 ('AI Writing','ai-writing','Tools that draft and edit content'),
 ('SEO','seo','Search visibility software'),
 ('Email Marketing','email-marketing','Newsletters and automation'),
 ('Project Management','project-management','Planning and tracking work'),
 ('Hosting','hosting','Where your site lives'),
 ('Automation','automation','Connecting your stack'),
 ('Note Taking','note-taking','Capturing knowledge'),
 ('Best Value','best-value','Strong quality per dollar');

-- SEED POSTS
INSERT INTO public.posts (title, slug, excerpt, content, featured_image, category_id, author_name, author_title, author_bio, post_type, status, published_at, reading_time, view_count, is_featured, seo_title, meta_description, focus_keyword, product_name, product_url, affiliate_url, affiliate_cta_label, rating, pros, cons, key_features, alternatives, pricing_summary, who_is_it_for, how_it_works, verdict)
VALUES
('Notion AI Review 2026: Is the Add-On Worth It?', 'notion-ai-review',
 'We used Notion AI as the default writing layer across a real 14-person workspace for eight weeks. Here is where it earns its price and where it still frustrates.',
 '<h2>Overview</h2><p>Notion AI sits directly inside the pages your team already works in, which is both its biggest advantage and the reason it feels limited compared with a dedicated assistant. We ran it across meeting notes, product specs, help-centre drafts and a messy internal wiki.</p><h2>What we tested</h2><p>Eight weeks, 14 seats, roughly 900 AI actions logged. We measured drafting speed, summary accuracy on long meeting transcripts, and how often output needed a second pass.</p><h2>Where it shines</h2><p>Summarising long documents and turning rough bullet points into a readable first draft. Q&amp;A across the workspace is the standout: asking "what did we decide about pricing in March" reliably surfaced the right page.</p><h2>Where it struggles</h2><p>Long-form original writing still reads generic, and it cannot reliably follow a detailed brand style guide without heavy prompting each time.</p><h2>Performance and reliability</h2><p>Responses landed in two to six seconds on typical pages. Very long databases occasionally timed out.</p>',
 'https://images.unsplash.com/photo-1618788372246-79faff0c3742?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='ai-tools'), 'Mahin Rahman', 'Editor-in-Chief',
 'Mahin has spent a decade evaluating SaaS and AI tooling for small product teams, and writes every Vistora review after real hands-on use.',
 'review','published', now() - interval '2 days', 11, 4820, true,
 'Notion AI Review 2026: Features, Pricing and Verdict',
 'A hands-on Notion AI review after eight weeks in a 14-person workspace: real strengths, honest limits, pricing and whether the add-on is worth buying.',
 'notion ai review','Notion AI','https://www.notion.so/product/ai','https://www.notion.so/product/ai','Try Notion AI', 4.3,
 ARRAY['Lives inside documents your team already uses','Workspace Q&A finds decisions buried in old pages','Excellent transcript and meeting summaries','Flat per-seat pricing with no credit anxiety'],
 ARRAY['Long-form original writing still needs heavy editing','Hard to enforce a strict brand voice','Slow on very large databases'],
 ARRAY['Inline drafting and rewriting','Workspace-wide Q&A search','Meeting note summarisation','Autofill for database properties','Translation across 15+ languages'],
 ARRAY['ChatGPT Team','Claude Projects','Coda AI'],
 'Add-on priced per member per month on top of any paid Notion plan, billed annually for the lowest rate. No free tier beyond a small trial allowance.',
 'Teams already standardised on Notion who want AI where their documentation lives. Not the right pick if you need a best-in-class long-form writer.',
 'You trigger it inline with a slash command or the space bar, or ask a question in the AI panel. It reads the pages you have access to, so permissions carry over from your workspace.',
 'If Notion is already your source of truth, the add-on pays for itself on summaries and search alone. If you want the strongest writing model on the market, pair it with a dedicated assistant instead.'),

('ClickUp Review: Powerful, But Is It Too Much Software?', 'clickup-review',
 'ClickUp does almost everything, which is exactly the problem. We migrated a real client roadmap into it to see who thrives and who drowns.',
 '<h2>Overview</h2><p>ClickUp is the most feature-dense project manager we have tested. Docs, sprints, time tracking, goals, dashboards, whiteboards and forms all sit in one workspace.</p><h2>Setup experience</h2><p>Getting to a usable setup took our team roughly six hours, mostly spent turning things off. The default workspace shows almost every feature at once.</p><h2>Daily use</h2><p>Once configured, custom views are genuinely excellent, and automations removed a lot of status-chasing.</p><h2>Performance</h2><p>Large lists were noticeably slower to load than in leaner tools, though 2026 releases have improved this.</p>',
 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='productivity'), 'Ayesha Karim', 'Senior Reviewer',
 'Ayesha reviews project and productivity software, with a focus on how tools hold up after the honeymoon period.',
 'review','published', now() - interval '5 days', 10, 3110, false,
 'ClickUp Review 2026: Features, Pricing, Pros and Cons',
 'An honest ClickUp review after migrating a live client roadmap: setup effort, best features, real limitations and who it suits.',
 'clickup review','ClickUp','https://clickup.com','https://clickup.com','See ClickUp pricing', 4.0,
 ARRAY['Enormous feature range for the price','Custom views suit almost any workflow','Strong automation builder','Generous free plan'],
 ARRAY['Overwhelming defaults','Slower on very large lists','Frequent UI changes'],
 ARRAY['Multiple task views','Native docs and whiteboards','Automations','Goals and dashboards','Time tracking'],
 ARRAY['Asana','Linear','Height'],
 'Free plan for individuals, low per-user monthly tiers for teams, with automations and dashboards gated to paid plans.',
 'Growing teams that want one tool instead of five and are willing to invest setup time. Small teams wanting instant clarity should look at leaner options.',
 'You build a hierarchy of spaces, folders and lists, then layer views, custom fields and automations on top.',
 'Excellent value if someone owns the configuration. Without that owner, it becomes noise.'),

('ConvertKit vs Mailchimp: Which Should Creators Choose in 2026?', 'convertkit-vs-mailchimp',
 'We ran the same 12,000-subscriber list through both platforms for a full quarter. Deliverability, automation and true cost compared.',
 '<h2>Overview</h2><p>Both platforms send email well. They differ sharply in who they are built for.</p><h2>Automation</h2><p>ConvertKit''s visual sequences are simpler to reason about; Mailchimp offers deeper branching plus a broader marketing suite.</p><h2>Deliverability</h2><p>Across 340,000 sends, inbox placement was within two percentage points of each other. Neither is a reason to switch.</p><h2>Real cost</h2><p>At 12,000 subscribers Mailchimp was cheaper on paper, but ConvertKit''s unlimited sends removed the overage risk during launches.</p>',
 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='comparisons'), 'Mahin Rahman', 'Editor-in-Chief',
 'Mahin has spent a decade evaluating SaaS and AI tooling for small product teams.',
 'comparison','published', now() - interval '8 days', 9, 5240, true,
 'ConvertKit vs Mailchimp 2026: A Real 12,000-Subscriber Test',
 'ConvertKit vs Mailchimp compared on automation, deliverability, landing pages and true cost using the same 12,000-subscriber list.',
 'convertkit vs mailchimp','ConvertKit','https://convertkit.com','https://convertkit.com','Compare plans', 4.4,
 ARRAY['Clear winner for creators selling digital products','Unlimited sends remove launch-week overage risk','Simple, readable automations'],
 ARRAY['Fewer templates than Mailchimp','Reporting is basic','Pricier at large list sizes'],
 ARRAY['Visual automation builder','Landing pages and forms','Paid newsletter support','Tag-based segmentation'],
 ARRAY['Mailchimp','Beehiiv','MailerLite'],
 'Free tier up to a small list size, then subscriber-based monthly pricing with unlimited sends on paid plans.',
 'Creators, newsletter writers and course sellers. Ecommerce teams needing a full marketing suite will prefer Mailchimp.',
 'You import your list, tag subscribers by behaviour, then trigger sequences from forms, purchases or tags.',
 'Creators should pick ConvertKit; broader small-business marketing teams get more from Mailchimp.'),

('Semrush Review: Still the SEO Benchmark?', 'semrush-review',
 'Six months of daily use across three client sites. Keyword data quality, site audit depth and whether the price is defensible.',
 '<h2>Overview</h2><p>Semrush remains the most complete SEO platform we test against. The question is whether smaller teams need all of it.</p><h2>Keyword data</h2><p>We spot-checked 500 keywords against search console data. Volume estimates tracked directionally well, with the usual long-tail noise.</p><h2>Site audit</h2><p>The crawler surfaced real issues our previous tool missed, particularly internal redirect chains.</p><h2>Reporting</h2><p>Client-ready PDF reports saved several hours a month.</p>',
 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='marketing-tools'), 'Daniel Osei', 'SEO Analyst',
 'Daniel runs technical SEO audits for agencies and tests search tooling against live client data.',
 'review','published', now() - interval '11 days', 12, 2760, false,
 'Semrush Review 2026: Data Quality, Audits and Pricing',
 'A six-month Semrush review across three client sites covering keyword data accuracy, site audits, reporting and whether the price holds up.',
 'semrush review','Semrush','https://semrush.com','https://semrush.com','Start Semrush trial', 4.5,
 ARRAY['Deepest all-in-one SEO toolkit','Strong technical site audit','Excellent client reporting','Reliable competitor research'],
 ARRAY['Expensive for solo site owners','Seat limits feel stingy','Interface is dense'],
 ARRAY['Keyword research and gap analysis','Site audit crawler','Backlink analytics','Rank tracking','White-label reporting'],
 ARRAY['Ahrefs','Ubersuggest','Sitebulb'],
 'Three main monthly tiers; extra users and some toolkits cost more. Annual billing saves noticeably.',
 'Agencies and in-house teams managing multiple sites. Single-site hobby projects will overpay.',
 'You add projects per domain, then run audits, track keywords and compare competitors from one dashboard.',
 'Still the benchmark. If SEO is a core revenue channel, it is worth the line item.'),

('Claude vs ChatGPT for Work in 2026', 'claude-vs-chatgpt-for-work',
 'Same 40 real work tasks, both assistants, blind-scored output. Writing, analysis, coding and long-document work compared.',
 '<h2>How we tested</h2><p>Forty tasks pulled from real client work, run through both assistants, then blind-scored by three reviewers.</p><h2>Writing</h2><p>Claude produced calmer, more editable prose. ChatGPT was stronger at punchy marketing copy.</p><h2>Long documents</h2><p>Claude held detail across a 90-page contract noticeably better.</p><h2>Coding and data</h2><p>ChatGPT''s tooling ecosystem gave it the edge for data analysis and file handling.</p>',
 'https://images.unsplash.com/photo-1712002641088-9d76f9080889?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='comparisons'), 'Ayesha Karim', 'Senior Reviewer',
 'Ayesha reviews AI and productivity software with an emphasis on long-term usefulness.',
 'comparison','published', now() - interval '14 days', 10, 6890, false,
 'Claude vs ChatGPT 2026: 40 Real Work Tasks Compared',
 'A blind-scored Claude vs ChatGPT comparison across 40 real work tasks: writing, analysis, coding, long documents and pricing.',
 'claude vs chatgpt','Claude','https://claude.ai','https://claude.ai','Try Claude', 4.6,
 ARRAY['Best long-document comprehension','Prose needs less editing','Careful, well-hedged analysis'],
 ARRAY['Smaller tooling ecosystem','Fewer integrations','Occasionally over-cautious'],
 ARRAY['Long context handling','Project-based memory','Document analysis','Team workspaces'],
 ARRAY['ChatGPT','Gemini','Copilot'],
 'Free tier plus per-seat monthly plans for individuals and teams; higher tiers raise usage limits.',
 'Writers, analysts and anyone working through long documents. Pick ChatGPT if you lean on data tooling and integrations.',
 'You work in projects, attach reference files, and the assistant keeps that context across the conversation.',
 'Claude wins on writing and long documents; ChatGPT wins on tooling. Most teams we advise end up paying for one and using the other free tier.'),

('Kinsta Review: Managed WordPress Hosting Tested for 90 Days', 'kinsta-review',
 'We moved a 40,000-visit-per-month WordPress site to Kinsta and measured load times, support quality and real monthly cost.',
 '<h2>Overview</h2><p>Kinsta is premium managed WordPress hosting, and it prices like it. We wanted to know what the money actually buys.</p><h2>Speed</h2><p>Median server response dropped from 640ms to 210ms after migration, with no plugin changes.</p><h2>Support</h2><p>Six support chats, median first response under two minutes, all resolved without escalation.</p><h2>Dashboard</h2><p>Staging, backups and one-click cloning are genuinely painless.</p>',
 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='wordpress'), 'Daniel Osei', 'SEO Analyst',
 'Daniel handles technical audits and hosting migrations for content-heavy WordPress sites.',
 'review','published', now() - interval '18 days', 9, 1980, false,
 'Kinsta Review 2026: Speed, Support and Real Cost',
 'A 90-day Kinsta review on a 40,000-visit WordPress site: measured speed gains, support response times, staging workflow and pricing.',
 'kinsta review','Kinsta','https://kinsta.com','https://kinsta.com','View Kinsta plans', 4.4,
 ARRAY['Large measured speed improvement','Fast, competent support','Excellent staging and backups','Clear resource dashboards'],
 ARRAY['Expensive entry tier','Visit-based limits can bite','No email hosting'],
 ARRAY['Google Cloud premium tier network','Free staging environments','Daily automatic backups','Edge caching','Free migrations'],
 ARRAY['WP Engine','Cloudways','Rocket.net'],
 'Monthly plans tiered by monthly visits and storage, with overage charges above your visit allowance. Annual billing includes two free months.',
 'Businesses whose revenue depends on their WordPress site. Hobby blogs will find cheaper hosts sufficient.',
 'You migrate through their free service, then manage staging, backups and caching from the MyKinsta dashboard.',
 'Worth it when downtime or slowness costs you money. Overkill for low-traffic personal sites.'),

('Zapier Review: Automation That Pays For Itself?', 'zapier-review',
 'We rebuilt six manual client workflows in Zapier and tracked how many hours it actually saved against the monthly task cost.',
 '<h2>Overview</h2><p>Zapier connects almost everything, and its 2026 releases finally make multi-step logic readable.</p><h2>What we built</h2><p>Six workflows: lead routing, invoice reminders, content publishing, support triage, onboarding and reporting.</p><h2>Results</h2><p>Roughly nine hours saved per month, against a mid-tier plan cost.</p><h2>Limits</h2><p>Task-based pricing punishes high-volume automations; heavy users should look at self-hosted alternatives.</p>',
 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='software'), 'Mahin Rahman', 'Editor-in-Chief',
 'Mahin evaluates SaaS tooling for small product teams and writes every review after real use.',
 'review','published', now() - interval '22 days', 8, 2440, false,
 'Zapier Review 2026: Real Hours Saved vs Task Pricing',
 'A practical Zapier review: six real workflows rebuilt, hours saved measured, and an honest look at task-based pricing limits.',
 'zapier review','Zapier','https://zapier.com','https://zapier.com','Try Zapier free', 4.2,
 ARRAY['Widest app library anywhere','Readable multi-step builder','Reliable error notifications','Fast to prototype'],
 ARRAY['Task pricing scales badly','Debugging deep paths is fiddly','Premium apps gated to higher tiers'],
 ARRAY['8,000+ app integrations','Multi-step paths and filters','Built-in formatting tools','Scheduled runs','Team folders'],
 ARRAY['Make','n8n','Pipedream'],
 'Free tier with limited monthly tasks; paid plans scale by task volume and unlock premium apps and paths.',
 'Small teams gluing together SaaS tools without engineering help. High-volume automation should consider n8n.',
 'You pick a trigger app, add action steps, map fields between them, then turn the Zap on.',
 'Pays for itself quickly at low volume. Watch the task counter as you grow.'),

('How to Set Up a Fast WordPress Review Site in a Weekend', 'set-up-fast-wordpress-review-site',
 'A practical build order for a review site that loads quickly, ranks and stays maintainable — no page-builder bloat.',
 '<h2>Pick hosting first</h2><p>Everything downstream depends on this. Choose managed hosting with staging and daily backups.</p><h2>Keep the theme light</h2><p>A block theme plus a handful of patterns beats a heavy multi-purpose theme every time.</p><h2>Plan your content structure</h2><p>Decide categories before publishing. Reviews, comparisons and guides should each have a consistent template.</p><h2>Install only what you need</h2><p>Caching, SEO, forms and image optimisation. That is usually the whole list.</p><h2>Measure before you launch</h2><p>Run Core Web Vitals on three real pages, not just the homepage.</p>',
 'https://images.unsplash.com/photo-1499750310159-5b5b2b7e5c34?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='how-to-guides'), 'Daniel Osei', 'SEO Analyst',
 'Daniel builds and audits content-heavy WordPress sites.',
 'guide','published', now() - interval '25 days', 7, 1520, false,
 'How to Build a Fast WordPress Review Site (2026 Guide)',
 'A weekend build order for a fast, maintainable WordPress review site: hosting, theme choice, content structure, plugins and performance checks.',
 'wordpress review site', NULL, NULL, NULL, NULL, NULL,
 '{}','{}',
 ARRAY['Hosting-first build order','Block theme setup','Content structure planning','Minimal plugin stack','Core Web Vitals checks'],
 '{}', NULL,
 'Anyone launching an affiliate or review publication who wants speed and clarity rather than a page builder.',
 NULL,
 'Follow the order above and you will have a publishable, fast site in about two working days.'),

('Linear Review: The Fastest Issue Tracker We Have Used', 'linear-review',
 'Opinionated, fast and deliberately narrow. We ran a full product cycle in Linear to see what the constraints cost.',
 '<h2>Overview</h2><p>Linear is built for software teams that ship on a cycle. Everything else is deliberately absent.</p><h2>Speed</h2><p>Every interaction feels instant, including on large projects. Keyboard-first navigation is the real feature.</p><h2>Cycles and projects</h2><p>Automatic cycle rollover kept planning honest without a weekly ceremony.</p><h2>Limits</h2><p>Non-engineering teams struggled to adapt it, and reporting is intentionally light.</p>',
 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='productivity'), 'Ayesha Karim', 'Senior Reviewer',
 'Ayesha reviews project and productivity software after living in it for a full cycle.',
 'review','published', now() - interval '29 days', 8, 3390, false,
 'Linear Review 2026: Speed, Cycles and Honest Limits',
 'A full-cycle Linear review: what its speed and constraints buy engineering teams, and where non-technical teams will struggle.',
 'linear review','Linear','https://linear.app','https://linear.app','Try Linear', 4.7,
 ARRAY['Fastest interface in the category','Keyboard-first workflow','Sensible cycle automation','Clean roadmap views'],
 ARRAY['Weak fit for non-engineering teams','Light reporting','Opinionated structure'],
 ARRAY['Cycles and triage','Projects and roadmaps','Git integrations','Keyboard command menu'],
 ARRAY['Jira','ClickUp','Shortcut'],
 'Free plan for small teams, then per-user monthly pricing with higher tiers adding advanced roadmap and security features.',
 'Software teams that value speed and convention over configurability.',
 'Issues flow through triage into cycles, with Git branches and pull requests updating status automatically.',
 'The best pure issue tracker available, provided your team is happy inside its opinions.'),

('Ahrefs vs Semrush: Which SEO Suite Wins on Data?', 'ahrefs-vs-semrush',
 'Backlink index size, keyword accuracy, crawl depth and price per seat compared across the same three domains.',
 '<h2>Backlink data</h2><p>Ahrefs still found more referring domains on all three test sites, though Semrush closed the gap in 2026.</p><h2>Keyword research</h2><p>Semrush''s keyword gap analysis was more useful for content planning; Ahrefs was cleaner for quick checks.</p><h2>Site audits</h2><p>Both surfaced the same critical issues. Semrush explained fixes more clearly.</p><h2>Price</h2><p>Similar headline pricing, but seat and project limits differ enough to change the real cost.</p>',
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='comparisons'), 'Daniel Osei', 'SEO Analyst',
 'Daniel tests search tooling against live client data.',
 'comparison','published', now() - interval '33 days', 9, 4110, false,
 'Ahrefs vs Semrush 2026: Data Quality Compared',
 'Ahrefs vs Semrush tested on the same three domains: backlink index, keyword accuracy, site audits, reporting and true per-seat cost.',
 'ahrefs vs semrush','Ahrefs','https://ahrefs.com','https://ahrefs.com','Compare Ahrefs plans', 4.5,
 ARRAY['Largest backlink index in testing','Cleanest interface for quick research','Excellent site explorer'],
 ARRAY['No free trial','Credit-style limits on some reports','Fewer marketing extras'],
 ARRAY['Site explorer','Keywords explorer','Content gap analysis','Rank tracker'],
 ARRAY['Semrush','Moz Pro','SE Ranking'],
 'Monthly tiers by project and report volume; extra seats cost more on lower plans.',
 'Link-focused SEO teams pick Ahrefs; broader marketing teams get more from Semrush.',
 'You add a domain, then explore backlinks, keywords and content gaps from a single explorer view.',
 'Ahrefs for link data and speed, Semrush for breadth. Neither choice is a mistake.'),

('Descript Review: Editing Video Like a Document', 'descript-review',
 'We produced eight review videos entirely in Descript. Transcript editing, filler-word removal and where the illusion breaks.',
 '<h2>Overview</h2><p>Descript turns video editing into text editing, which changes who on your team can edit at all.</p><h2>What worked</h2><p>Cutting filler words and restructuring a talking-head video took minutes instead of hours.</p><h2>What did not</h2><p>Anything requiring precise motion work still needs a traditional timeline editor.</p><h2>Voice features</h2><p>Studio Sound genuinely rescued two poorly recorded takes.</p>',
 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='software'), 'Ayesha Karim', 'Senior Reviewer',
 'Ayesha reviews creative and productivity software after shipping real work in it.',
 'review','published', now() - interval '37 days', 8, 1670, false,
 'Descript Review 2026: Text-Based Video Editing Tested',
 'A hands-on Descript review after producing eight videos: transcript editing, filler removal, Studio Sound quality and real limitations.',
 'descript review','Descript','https://descript.com','https://descript.com','Try Descript', 4.1,
 ARRAY['Anyone who can edit a document can edit video','Filler-word removal is excellent','Studio Sound rescues bad audio','Fast podcast workflow'],
 ARRAY['Not a replacement for timeline editors','Exports can be slow','Higher tiers needed for best audio tools'],
 ARRAY['Transcript-based editing','Filler word removal','Studio Sound','Overdub voice cloning','Screen recording'],
 ARRAY['CapCut','Premiere Pro','Riverside'],
 'Free tier with watermarked exports; paid per-seat monthly tiers unlock hours of transcription and better audio tools.',
 'Podcasters, course creators and marketing teams producing talking-head video without an editor on staff.',
 'You record or upload, Descript transcribes, and deleting text deletes the matching video.',
 'A genuine workflow change for spoken-word content. Keep a timeline editor for anything cinematic.'),

('How to Write Product Reviews That Actually Rank', 'how-to-write-product-reviews-that-rank',
 'The structure, evidence and disclosure practices that separate reviews readers trust from thin affiliate pages.',
 '<h2>Lead with real testing</h2><p>State what you tested, for how long, and how you measured it. Specifics are the whole ballgame.</p><h2>Structure for scanning</h2><p>Overview, testing method, pros and cons, pricing, who it is for, verdict. Readers jump; help them land.</p><h2>Show the numbers</h2><p>Screenshots, timings and counts beat adjectives.</p><h2>Be honest about limits</h2><p>Naming who should not buy a product builds more trust than any praise.</p><h2>Disclose clearly</h2><p>Put your affiliate disclosure above the first affiliate link, not in the footer.</p>',
 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&h=630',
 (SELECT id FROM public.categories WHERE slug='how-to-guides'), 'Mahin Rahman', 'Editor-in-Chief',
 'Mahin sets editorial standards at Vistora Reviews.',
 'guide','published', now() - interval '41 days', 6, 2110, false,
 'How to Write Product Reviews That Rank (2026 Guide)',
 'A practical guide to writing product reviews readers and search engines trust: testing evidence, structure, honest limits and clear disclosure.',
 'how to write product reviews', NULL, NULL, NULL, NULL, NULL,
 '{}','{}',
 ARRAY['Evidence-first testing notes','Scannable review structure','Concrete measurements','Honest limitations','Clear affiliate disclosure'],
 '{}', NULL,
 'Bloggers and publishers who want reviews that survive both reader scrutiny and search updates.',
 NULL,
 'Follow this structure and your reviews will read like testing notes rather than sales pages — which is exactly why they rank.');

-- LINK TAGS
INSERT INTO public.post_tags (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p, public.tags t
WHERE (p.slug='notion-ai-review' AND t.slug IN ('ai-writing','note-taking'))
   OR (p.slug='clickup-review' AND t.slug IN ('project-management','best-value'))
   OR (p.slug='convertkit-vs-mailchimp' AND t.slug IN ('email-marketing'))
   OR (p.slug='semrush-review' AND t.slug IN ('seo'))
   OR (p.slug='claude-vs-chatgpt-for-work' AND t.slug IN ('ai-writing'))
   OR (p.slug='kinsta-review' AND t.slug IN ('hosting'))
   OR (p.slug='zapier-review' AND t.slug IN ('automation','best-value'))
   OR (p.slug='linear-review' AND t.slug IN ('project-management'))
   OR (p.slug='ahrefs-vs-semrush' AND t.slug IN ('seo'))
   OR (p.slug='descript-review' AND t.slug IN ('best-value'))
   OR (p.slug='set-up-fast-wordpress-review-site' AND t.slug IN ('hosting','seo'))
   OR (p.slug='how-to-write-product-reviews-that-rank' AND t.slug IN ('seo'));

-- SAMPLE APPROVED COMMENTS
INSERT INTO public.comments (post_id, author_name, author_email, content, is_approved)
SELECT id, 'Priya S.', 'priya@example.com', 'The workspace Q&A point matches my experience exactly — that alone justified the add-on for us.', true FROM public.posts WHERE slug='notion-ai-review';
INSERT INTO public.comments (post_id, author_name, author_email, content, is_approved)
SELECT id, 'Tom B.', 'tom@example.com', 'Finally a ClickUp review that admits the setup cost. Six hours sounds about right.', true FROM public.posts WHERE slug='clickup-review';