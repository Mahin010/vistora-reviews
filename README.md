# Vistora Content Hub

Build Vistora Reviews, a professional digital product review blog website with a public publication and a secure /admin management panel powered by Lovable Cloud (Supabase).

Key requirements:
1. Public Site & Pages:
- Clean, modern tech publication aesthetic (trustworthy branding, typography, whitespace, responsive, dark/light mode toggle).
- Pages: Home, Reviews, Software, AI Tools, Marketing Tools, Productivity, WordPress, Comparisons, How-To Guides, About, Contact, Privacy Policy, Terms & Conditions, Affiliate Disclosure.
- Homepage: Sticky header with Vistora Reviews branding, search bar/modal, featured review hero, latest reviews, popular reviews, latest articles, categories grid, comparison highlights, newsletter subscription form, and full footer.
- Blog Card: Featured image, category badge, title, excerpt, author, publication date, reading time, and read link.
- Review/Article layout: Table of contents, product overview card (rating, pros/cons, pricing, affiliate CTA button, affiliate disclosure), key features, who it's for, how it works, alternatives, final verdict, author bio, and related posts.
- Search: Site-wide search with filtering by keyword, category, product name, and pagination.

2. Backend & Database (Lovable Cloud / Supabase):
- Database tables: profiles (roles: admin, editor, author), posts (with title, slug, content, excerpt, featured_image, category_id, status: draft/published/scheduled, published_at, seo_title, meta_description, focus_keyword, canonical_url, product_name, product_url, affiliate_url, rating, pros, cons, pricing_summary), categories, tags, post_tags, media, comments, and site_settings.
- RLS policies ensuring public users have read-only access to published posts, while authenticated staff (admin/editor/author) manage content according to their role.
- Seed with realistic initial digital product reviews and categories (AI tools, SaaS, Productivity, WordPress, Marketing).

3. Admin Dashboard (/admin):
- Secure authentication (login/signup with protected admin routes).
- Dashboard overview with key metrics (total posts, published, drafts, categories, recent comments, quick actions).
- Post Management: Full CRUD, draft saving, publishing, scheduling, category/tag assignment, SEO fields, affiliate CTA settings, and rich content editing.
- Category & Tag Management: Create, edit, slug management, and descriptions.
- Media Library: Upload, browse, search, and reuse images.
- Settings: Site branding, SEO defaults, affiliate disclosures.

4. SEO & Performance:
- Semantic HTML, meta titles, descriptions, Open Graph and Twitter Card tags, clean slugs, breadcrumbs, and Schema.org JSON-LD structured data (Article, WebSite, Organization).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vistora-reviews.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6deba49e-dc34-4b70-bfc7-7111e1fff9ee).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
