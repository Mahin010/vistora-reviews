import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Sparkles, TrendingUp } from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";
import { PostCard } from "@/components/post-card";
import { Rating } from "@/components/rating";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/content.functions";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, formatDate } from "@/lib/site";

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  head: () => ({
    meta: [
      { title: `${SITE_NAME} — Independent Digital Product Reviews` },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: `${SITE_NAME} — Independent Digital Product Reviews` },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          description: SITE_DESCRIPTION,
          publisher: { "@type": "Organization", name: SITE_NAME },
        }),
      },
    ],
  }),
  component: Home,
});

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <Link
          to={action.to as "/reviews"}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          {action.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

function Home() {
  const { featured, latestReviews, popular, latestArticles, comparisons, categories } =
    Route.useLoaderData();

  return (
    <SiteShell>
      {/* Hero */}
      <section className="border-b bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="eyebrow mb-4">Issue 24 · Tested this month</p>
              <h1 className="text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
                Buy the right software the first time.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">{SITE_TAGLINE}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/reviews">Browse reviews</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/comparisons">See comparisons</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span>Hands-on testing only</span>
                <span>·</span>
                <span>No paid placements</span>
                <span>·</span>
                <span>Scores we can defend</span>
              </div>
            </div>

            {featured ? (
              <article className="overflow-hidden rounded-2xl border bg-card shadow-lift">
                <Link to="/reviews/$slug" params={{ slug: featured.slug }}>
                  {featured.featured_image ? (
                    <img
                      src={featured.featured_image}
                      alt={featured.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="p-6">
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1">
                      <Sparkles className="h-3 w-3" /> Featured review
                    </Badge>
                    {featured.rating ? <Rating value={Number(featured.rating)} /> : null}
                  </div>
                  <h2 className="mt-3 text-2xl leading-snug">
                    <Link
                      to="/reviews/$slug"
                      params={{ slug: featured.slug }}
                      className="hover:text-primary"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{featured.excerpt}</p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{featured.author_name}</span>
                    <span>·</span>
                    <span>{formatDate(featured.published_at)}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {featured.reading_time} min
                    </span>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      {/* Latest reviews + popular */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <SectionHeading
              title="Latest reviews"
              description="Every score comes from real use, not a spec sheet."
              action={{ label: "All reviews", to: "/reviews" }}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              {latestReviews.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          <aside>
            <SectionHeading title="Most read" />
            <ol className="space-y-5">
              {popular.map((post, index) => (
                <li key={post.id} className="flex gap-4">
                  <span className="font-display text-2xl text-muted-foreground/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <Link
                      to="/reviews/$slug"
                      params={{ slug: post.slug }}
                      className="text-sm font-medium leading-snug hover:text-primary"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      {post.view_count.toLocaleString()} reads
                      {post.category ? ` · ${post.category.name}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 rounded-xl border bg-surface p-5">
              <p className="eyebrow mb-2">Newsletter</p>
              <p className="text-sm text-muted-foreground">
                One email a week: what we tested, what we would actually buy.
              </p>
              <div className="mt-4">
                <NewsletterForm />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Categories */}
      <section className="border-y bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading title="Browse by category" description="Find the shortlist for your stack." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/${cat.slug}` as "/software"}
                className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-card"
              >
                <p className="font-display text-lg group-hover:text-primary">{cat.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comparisons */}
      {comparisons.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading
            title="Head-to-head"
            description="Two tools, one decision. Our comparison breakdowns."
            action={{ label: "All comparisons", to: "/comparisons" }}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {comparisons.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Latest articles */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <SectionHeading
          title="Latest articles and guides"
          description="Practical walkthroughs from the team that tests the tools."
          action={{ label: "How-to guides", to: "/how-to-guides" }}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {latestArticles.map((post) => (
            <PostCard key={post.id} post={post} orientation="horizontal" />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
