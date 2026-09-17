import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronRight, Clock, ExternalLink } from "lucide-react";

import { CommentSection } from "@/components/comment-section";
import { PostCard } from "@/components/post-card";
import { ProductOverviewCard } from "@/components/product-overview";
import { Rating } from "@/components/rating";
import { SiteShell } from "@/components/site-shell";
import { TableOfContents } from "@/components/table-of-contents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPostBySlug } from "@/lib/content.functions";
import { AFFILIATE_DISCLOSURE, SITE_NAME, formatDate, withHeadingIds } from "@/lib/site";

export const Route = createFileRoute("/reviews/$slug")({
  loader: async ({ params }) => {
    const result = await getPostBySlug({ data: { slug: params.slug } });
    if (!result.post) throw notFound();
    return result;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData?.post) {
      return { meta: [{ title: `Not found — ${SITE_NAME}` }, { name: "robots", content: "noindex" }] };
    }
    const post = loaderData.post;
    const title = post.seo_title ?? `${post.title} — ${SITE_NAME}`;
    const description = post.meta_description ?? post.excerpt ?? "";
    const url = `/reviews/${params.slug}`;
    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (post.featured_image?.startsWith("https://")) {
      meta.push(
        { property: "og:image", content: post.featured_image },
        { name: "twitter:image", content: post.featured_image },
      );
    }
    return {
      meta,
      links: [{ rel: "canonical", href: post.canonical_url ?? url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": post.rating ? "Review" : "Article",
            headline: post.title,
            description,
            image: post.featured_image ?? undefined,
            datePublished: post.published_at,
            dateModified: post.updated_at ?? post.published_at,
            author: { "@type": "Person", name: post.author_name },
            publisher: { "@type": "Organization", name: SITE_NAME },
            ...(post.rating
              ? {
                  itemReviewed: { "@type": "SoftwareApplication", name: post.product_name ?? post.title },
                  reviewRating: {
                    "@type": "Rating",
                    ratingValue: Number(post.rating),
                    bestRating: 5,
                    worstRating: 1,
                  },
                }
              : {}),
          }),
        },
      ],
    };
  },
  component: PostPage,
});

function Block({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <section id={id} className="mt-12">
      <h2 className="text-2xl">{title}</h2>
      <ul className="mt-4 space-y-2 text-[1.02rem] leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PostPage() {
  const { post, related, comments } = Route.useLoaderData();
  if (!post) return null;

  const { html, headings } = withHeadingIds(post.content ?? "");

  const extraHeadings = [
    post.product_name || post.rating ? { id: "product-overview", text: "At a glance", level: 2 } : null,
    post.key_features?.length ? { id: "key-features", text: "Key features", level: 2 } : null,
    post.who_is_it_for ? { id: "who-its-for", text: "Who it's for", level: 2 } : null,
    post.alternatives?.length ? { id: "alternatives", text: "Alternatives", level: 2 } : null,
    post.verdict ? { id: "verdict", text: "Final verdict", level: 2 } : null,
  ].filter(Boolean) as { id: string; text: string; level: number }[];

  return (
    <SiteShell>
      <article className="mx-auto max-w-6xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/reviews" className="hover:text-primary">
            Reviews
          </Link>
          {post.category ? (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link to={`/${post.category.slug}` as "/software"} className="hover:text-primary">
                {post.category.name}
              </Link>
            </>
          ) : null}
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{post.title}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          {post.category ? <Badge variant="secondary">{post.category.name}</Badge> : null}
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl lg:text-5xl">{post.title}</h1>
          {post.excerpt ? (
            <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{post.author_name}</span>
            <span>·</span>
            <span>{formatDate(post.published_at)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.reading_time} min read
            </span>
            {post.rating ? (
              <>
                <span>·</span>
                <Rating value={Number(post.rating)} />
              </>
            ) : null}
          </div>
        </header>

        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="mt-8 aspect-[16/7] w-full rounded-2xl object-cover shadow-card"
          />
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <ProductOverviewCard post={post} />

            <div className="article-prose mt-12" dangerouslySetInnerHTML={{ __html: html }} />

            <Block id="key-features" title="Key features" items={post.key_features ?? []} />
            {post.who_is_it_for ? (
              <section id="who-its-for" className="mt-12">
                <h2 className="text-2xl">Who it's for</h2>
                <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
                  {post.who_is_it_for}
                </p>
              </section>
            ) : null}

            {post.how_it_works ? (
              <section id="how-it-works" className="mt-12">
                <h2 className="text-2xl">How it works</h2>
                <p className="mt-4 text-[1.02rem] leading-relaxed text-muted-foreground">
                  {post.how_it_works}
                </p>
              </section>
            ) : null}

            <Block id="alternatives" title="Alternatives worth considering" items={post.alternatives ?? []} />

            {post.verdict ? (
              <section id="verdict" className="mt-12 rounded-2xl border-l-4 border-primary bg-surface p-6">
                <h2 className="text-2xl">Final verdict</h2>
                <p className="mt-3 text-[1.02rem] leading-relaxed text-muted-foreground">{post.verdict}</p>
                {post.affiliate_url ? (
                  <Button asChild className="mt-5">
                    <a
                      href={post.affiliate_url}
                      target="_blank"
                      rel="nofollow sponsored noopener noreferrer"
                    >
                      {post.affiliate_cta_label ?? "Try it yourself"}
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </section>
            ) : null}

            <section className="mt-12 rounded-xl border bg-card p-6">
              <p className="eyebrow mb-2">About the author</p>
              <p className="font-display text-lg">{post.author_name}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.author_bio ??
                  `${post.author_name} writes for ${SITE_NAME}, testing software hands-on before recommending it.`}
              </p>
            </section>

            <p className="mt-8 rounded-lg bg-muted p-4 text-xs text-muted-foreground">
              {AFFILIATE_DISCLOSURE}
            </p>

            <CommentSection postId={post.id} comments={comments} />
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <TableOfContents headings={[...extraHeadings, ...headings]} />
          </aside>
        </div>

        {related.length > 0 ? (
          <section className="mt-16 border-t pt-10">
            <h2 className="text-2xl">Related reading</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </SiteShell>
  );
}
