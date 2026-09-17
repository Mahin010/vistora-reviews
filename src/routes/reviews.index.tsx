import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "@/components/category-page";
import { listPosts } from "@/lib/content.functions";
import { validatePageSearch } from "@/lib/route-search";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION =
  "Every hands-on review we publish, newest first: AI tools, SaaS platforms, marketing software, productivity apps and WordPress products.";

export const Route = createFileRoute("/reviews/")({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => listPosts({ data: { page: deps.page } }),
  head: () => ({
    meta: [
      { title: `All Reviews — ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `All Reviews — ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/reviews" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/reviews" }],
  }),
  component: ReviewsIndex,
});

function ReviewsIndex() {
  const data = Route.useLoaderData();
  return (
    <CategoryListing
      eyebrow="The archive"
      title="Reviews, comparisons and guides"
      description={DESCRIPTION}
      posts={data.posts}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      basePath="/reviews"
    />
  );
}
