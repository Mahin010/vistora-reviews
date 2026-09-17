import { Link } from "@tanstack/react-router";

import { PostCard } from "@/components/post-card";
import { PageHeader, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import type { Category, PostCardData } from "@/lib/types";

export function CategoryListing({
  title,
  description,
  eyebrow,
  posts,
  total,
  page,
  pageSize,
  basePath,
}: {
  title: string;
  description?: string | undefined;
  eyebrow?: string | undefined;
  posts: PostCardData[];
  total: number;
  page: number;
  pageSize: number;
  basePath: string;
  category?: Category | null;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <SiteShell>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mx-auto max-w-6xl px-4 py-14">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">
            Nothing published here yet — new articles land every week.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                asChild
                size="sm"
                variant={n === page ? "default" : "outline"}
              >
                <Link to={basePath as "/reviews"} search={{ page: n }}>
                  {n}
                </Link>
              </Button>
            ))}
          </nav>
        ) : null}
      </div>
    </SiteShell>
  );
}
