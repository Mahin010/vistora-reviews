import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Code2,
  Layers3,
  Megaphone,
  MousePointerClick,
  Scale,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";
import { PostCard } from "@/components/post-card";
import { Rating } from "@/components/rating";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/content.functions";
import { SITE_DESCRIPTION, SITE_NAME, formatDate } from "@/lib/site";
import type { PostCardData } from "@/lib/types";

type CategoryPath = "/software" | "/ai-tools" | "/marketing-tools" | "/productivity" | "/wordpress" | "/comparisons" | "/how-to-guides";

const CATEGORY_DETAILS: Record<string, { icon: LucideIcon; description: string; to: CategoryPath }> = {
  software: { icon: Layers3, description: "Business software and essential SaaS platforms.", to: "/software" },
  "ai-tools": { icon: Bot, description: "AI assistants and intelligent work tools.", to: "/ai-tools" },
  "marketing-tools": { icon: Megaphone, description: "Tools for growth, email, content and SEO.", to: "/marketing-tools" },
  productivity: { icon: Zap, description: "Apps that help teams do their best work.", to: "/productivity" },
  wordpress: { icon: Code2, description: "Hosting, plugins and tools for WordPress.", to: "/wordpress" },
  comparisons: { icon: Scale, description: "Clear, side-by-side product comparisons.", to: "/comparisons" },
  "how-to-guides": { icon: Wrench, description: "Practical guidance for getting more from your tools.", to: "/how-to-guides" },
};

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  head: () => ({
    meta: [
      { title: `${SITE_NAME} — Independent Software Reviews & Comparisons` },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: `${SITE_NAME} — Independent Software Reviews & Comparisons` },
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
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; to: "/reviews" | "/comparisons" | "/how-to-guides" };
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="eyebrow mb-2 text-primary">{eyebrow}</p> : null}
        <h2 className="text-3xl leading-tight sm:text-4xl">{title}</h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <Link to={action.to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {action.label} <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function HeroStory({ post, prominent = false }: { post: PostCardData; prominent?: boolean }) {
  return (
    <article className={prominent ? "group md:row-span-2" : "group"}>
      <Link to="/reviews/$slug" params={{ slug: post.slug }} className="block overflow-hidden rounded-lg bg-muted">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            loading={prominent ? "eager" : "lazy"}
            fetchPriority={prominent ? "high" : "auto"}
            className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] ${prominent ? "aspect-[16/10] md:aspect-[4/3]" : "aspect-[16/8]"}`}
          />
        ) : (
          <div className={prominent ? "aspect-[4/3] bg-secondary" : "aspect-[16/8] bg-secondary"} />
        )}
      </Link>
      <div className="pt-3">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          {post.category ? <span className="eyebrow text-primary">{post.category.name}</span> : null}
          {post.rating ? <Rating value={Number(post.rating)} /> : null}
        </div>
        <h3 className={prominent ? "text-xl leading-snug sm:text-2xl" : "text-base leading-snug"}>
          <Link to="/reviews/$slug" params={{ slug: post.slug }} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {prominent && post.excerpt ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}
      </div>
    </article>
  );
}

function EditorialPost({ post }: { post: PostCardData }) {
  return (
    <article className="group grid grid-cols-[7rem_1fr] gap-4 border-t py-5 sm:grid-cols-[9rem_1fr]">
      <Link to="/reviews/$slug" params={{ slug: post.slug }} className="overflow-hidden rounded-lg bg-muted">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            loading="lazy"
            className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="aspect-square bg-secondary" />
        )}
      </Link>
      <div className="min-w-0 py-0.5">
        {post.category ? <p className="eyebrow mb-1.5 text-primary">{post.category.name}</p> : null}
        <h3 className="text-lg leading-snug sm:text-xl">
          <Link to="/reviews/$slug" params={{ slug: post.slug }} className="hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? <p className="mt-2 hidden line-clamp-2 text-sm text-muted-foreground sm:block">{post.excerpt}</p> : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{post.author_name}</span>
          <span>·</span>
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {post.reading_time} min</span>
        </p>
      </div>
    </article>
  );
}

function Home() {
  const { featured, latestReviews, popular, latestArticles, comparisons, categories } = Route.useLoaderData();
  const heroPosts = [featured, ...latestReviews.filter((post) => post.id !== featured?.id)].filter(
    (post): post is PostCardData => Boolean(post),
  ).slice(0, 4);
  const visibleCategories = categories
    .filter((category) => CATEGORY_DETAILS[category.slug])
    .sort((a, b) => Object.keys(CATEGORY_DETAILS).indexOf(a.slug) - Object.keys(CATEGORY_DETAILS).indexOf(b.slug));

  return (
    <SiteShell>
      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-16">
          <div>
            <p className="eyebrow mb-4 text-primary">Independent software reviews</p>
            <h1 className="max-w-xl text-4xl leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
              Find the right tools before you buy.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Honest reviews, practical comparisons, and hands-on guides for the software and digital tools that power modern work.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/reviews">Browse Reviews</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/comparisons">Explore Comparisons</Link></Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Independent verdicts</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Clear affiliate disclosure</span>
            </div>
          </div>

          {heroPosts.length ? (
            <div className="grid gap-5 border-t pt-6 sm:grid-cols-2 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              {heroPosts.map((post, index) => <HeroStory key={post.id} post={post} prominent={index === 0} />)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <SectionHeading
          eyebrow="Freshly published"
          title="Latest Reviews"
          description="Recently tested tools, platforms, and software."
          action={{ label: "View all reviews", to: "/reviews" }}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latestReviews.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </section>

      <section className="border-y bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <SectionHeading title="Explore by Category" description="Find reviews and guides for the tools you use." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCategories.map((category) => {
              const detail = CATEGORY_DETAILS[category.slug];
              if (!detail) return null;
              const Icon = detail.icon;
              return (
                <Link
                  key={category.id}
                  to={detail.to}
                  className="group flex min-h-44 flex-col rounded-lg border bg-card p-5 shadow-card transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-primary"><Icon className="h-4.5 w-4.5" /></span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <h3 className="mt-5 text-lg group-hover:text-primary">{category.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{category.description || detail.description}</p>
                  <p className="mt-auto pt-3 text-xs text-muted-foreground">{category.post_count} {category.post_count === 1 ? "post" : "posts"}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {comparisons.length ? (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <SectionHeading
            eyebrow="Side by side"
            title="Head-to-Head Comparisons"
            description="Compare popular tools before making a decision."
            action={{ label: "All comparisons", to: "/comparisons" }}
          />
          <div className="grid gap-5 md:grid-cols-3">
            {comparisons.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </section>
      ) : null}

      <section className="border-y bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-[1.55fr_0.75fr] lg:gap-16 sm:py-16">
          <div>
            <SectionHeading
              title="Latest Articles & Guides"
              description="Practical advice for choosing and using better tools."
              action={{ label: "How-to guides", to: "/how-to-guides" }}
            />
            <div>{latestArticles.slice(0, 4).map((post) => <EditorialPost key={post.id} post={post} />)}</div>
          </div>

          <aside>
            <SectionHeading title="Most Read" description="What readers are exploring now." />
            <ol className="border-t">
              {popular.map((post, index) => (
                <li key={post.id} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b py-4">
                  <span className="font-display text-2xl text-primary/55">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <Link to="/reviews/$slug" params={{ slug: post.slug }} className="text-sm font-semibold leading-snug hover:text-primary">
                      {post.title}
                    </Link>
                    {post.view_count > 0 || post.category ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {post.view_count > 0 ? `${post.view_count.toLocaleString()} reads` : ""}
                        {post.view_count > 0 && post.category ? " · " : ""}
                        {post.category?.name ?? ""}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="grid gap-8 rounded-lg border bg-accent px-6 py-8 md:grid-cols-[1fr_1.1fr] md:items-center md:px-10">
          <div>
            <p className="eyebrow mb-2 text-primary">The weekly edit</p>
            <h2 className="text-3xl leading-tight">Get better tools in your inbox.</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              One useful email each week with new reviews, comparisons, and practical guides.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>

      <section className="border-y bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <SectionHeading eyebrow="Our standard" title="How We Review" />
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [MousePointerClick, "Hands-On Testing", "Tools are evaluated through practical use."],
              [ShieldCheck, "Independent Reviews", "Our verdicts are independent, with affiliate relationships clearly disclosed."],
              [SearchCheck, "Real-World Use", "We focus on usability, features, pricing, and practical value."],
              [Sparkles, "Updated Information", "Important pricing and product details are updated when possible."],
            ].map(([Icon, title, description]) => {
              const TrustIcon = Icon as LucideIcon;
              return (
                <div key={title as string} className="border-t border-primary/40 pt-4">
                  <TrustIcon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-base">{title as string}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}