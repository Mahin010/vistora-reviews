import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { PostCard } from "@/components/post-card";
import { PageHeader, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPosts } from "@/lib/content.functions";
import { SITE_NAME } from "@/lib/site";

type SearchParams = { q?: string; category?: string; product?: string; page?: number };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const str = (key: string) => {
      const value = search[key];
      return typeof value === "string" && value.trim() ? value.trim() : undefined;
    };
    const page = Number(search["page"]);
    return {
      q: str("q"),
      category: str("category"),
      product: str("product"),
      ...(Number.isFinite(page) && page > 1 ? { page } : {}),
    };
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    searchPosts({
      data: {
        q: deps.q,
        categorySlug: deps.category,
        product: deps.product,
        page: deps.page ?? 1,
      },
    }),
  head: () => ({
    meta: [
      { title: `Search — ${SITE_NAME}` },
      { name: "description", content: `Search reviews, comparisons and guides on ${SITE_NAME}.` },
      { property: "og:title", content: `Search — ${SITE_NAME}` },
      { property: "og:description", content: `Search reviews, comparisons and guides on ${SITE_NAME}.` },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [term, setTerm] = useState(search.q ?? "");
  const [product, setProduct] = useState(search.product ?? "");

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const current = search.page ?? 1;

  function apply(event: React.FormEvent) {
    event.preventDefault();
    navigate({
      search: {
        q: term.trim() || undefined,
        product: product.trim() || undefined,
        category: search.category,
      },
    });
  }

  return (
    <SiteShell>
      <PageHeader
        eyebrow="Search"
        title="Find the review you need"
        description="Search by keyword, product name or category across everything we publish."
      />
      <div className="mx-auto max-w-5xl px-4 pb-20">
        <form onSubmit={apply} className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Keyword, e.g. email marketing"
            aria-label="Keyword"
          />
          <Input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Product name, e.g. ClickUp"
            aria-label="Product name"
          />
          <Button type="submit">
            <Search className="mr-1 h-4 w-4" /> Search
          </Button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/search"
            search={{ q: search.q, product: search.product }}
            className={`rounded-full border px-3 py-1 text-xs ${
              search.category ? "text-muted-foreground" : "border-primary bg-primary/10 text-primary"
            }`}
          >
            All categories
          </Link>
          {data.categories.map((cat) => (
            <Link
              key={cat.id}
              to="/search"
              search={{ q: search.q, product: search.product, category: cat.slug }}
              className={`rounded-full border px-3 py-1 text-xs ${
                search.category === cat.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {data.total} result{data.total === 1 ? "" : "s"}
          {search.q ? ` for “${search.q}”` : ""}
        </p>

        {data.posts.length > 0 ? (
          <div className="mt-6 space-y-6">
            {data.posts.map((post) => (
              <PostCard key={post.id} post={post} orientation="horizontal" />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Nothing matched. Try a broader keyword or clear the product filter.
          </p>
        )}

        {pages > 1 ? (
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Button key={n} asChild variant={n === current ? "default" : "outline"} size="sm">
                <Link to="/search" search={{ ...search, page: n }}>
                  {n}
                </Link>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </SiteShell>
  );
}
