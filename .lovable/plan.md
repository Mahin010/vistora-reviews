# Vistora Reviews — build plan

A digital product review publication with a public site and a private admin panel, backed by Lovable Cloud (database, logins, image storage).

## Look and feel

Modern tech-publication style: generous whitespace, strong editorial headline font paired with a clean reading font, a confident single accent colour, light/dark toggle, fully responsive. All colours and fonts defined once as design tokens so the theme stays consistent.

## Public pages

- Home: sticky header with branding, nav and search; featured review hero; latest reviews; popular reviews; latest articles; category grid; comparison highlights; newsletter sign-up; full footer.
- Reviews index plus category pages: Software, AI Tools, Marketing Tools, Productivity, WordPress, Comparisons, How-To Guides.
- Article/review page: breadcrumbs, table of contents, product overview card (rating, pros/cons, pricing, affiliate button, disclosure), key features, who it's for, how it works, alternatives, final verdict, author bio, related posts.
- Search page: keyword box plus category and product filters, paginated results.
- About, Contact, Privacy Policy, Terms & Conditions, Affiliate Disclosure.
- Blog card used everywhere: image, category badge, title, excerpt, author, date, reading time, read link.

## Admin panel at /admin

- Email/password login plus Google sign-in; everything under /admin requires a signed-in staff account.
- Dashboard: total posts, published, drafts, categories, recent comments, quick actions.
- Posts: create/edit/delete, save draft, publish, schedule, category and tags, SEO fields, affiliate settings, rich content editing.
- Categories and tags: create, edit, slugs, descriptions.
- Media library: upload, browse, search, reuse images.
- Settings: branding, SEO defaults, affiliate disclosure text.

## Content to start with

Seeded categories (AI Tools, Software/SaaS, Marketing Tools, Productivity, WordPress, Comparisons, How-To Guides) and a set of realistic sample reviews and guides with images, ratings, pros/cons and affiliate CTAs, so the site looks complete on first load.

## Search and SEO

Per-page titles, descriptions, Open Graph and Twitter tags, clean slugs, breadcrumbs, and Article / WebSite / Organization structured data.

## Technical notes

- Tables: profiles (role: admin/editor/author), user_roles, categories, tags, posts, post_tags, media, comments, site_settings. Row-level security: public read of published posts only; staff writes scoped by role; roles stored in a separate table and checked by a security-definer function.
- Posts carry slug, content, excerpt, featured_image, category_id, status (draft/published/scheduled), published_at, seo_title, meta_description, focus_keyword, canonical_url, product_name, product_url, affiliate_url, rating, pros, cons, pricing_summary.
- Reads and writes go through typed server functions; public routes use anon-safe public reads, admin routes use authenticated ones. Admin routes live under a protected layout.
- Images stored in Cloud storage; media library records rows in `media`.
- Seed rows ship inside the database migration itself.

## Build order

1. Enable Cloud, create schema + policies + seed data.
2. Design tokens, layout shell, header/footer, theme toggle.
3. Public pages and article/review template.
4. Search with filters and pagination.
5. Auth + admin dashboard, posts, taxonomy, media, settings.
6. SEO metadata, structured data, sitemap, final pass.
