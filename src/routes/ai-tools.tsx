import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "@/components/category-page";
import { listPosts } from "@/lib/content.functions";
import { validatePageSearch } from "@/lib/route-search";
import { SITE_NAME } from "@/lib/site";

const TITLE = `AI Tool Reviews — ${SITE_NAME}`;
const DESCRIPTION =
  "Tested reviews of AI writing, research and automation tools, with honest notes on accuracy, pricing and real workflow fit.";

export const Route = createFileRoute("/ai-tools")({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => listPosts({ data: { categorySlug: "ai-tools", page: deps.page } }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/ai-tools" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/ai-tools" }],
  }),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  return (
    <CategoryListing
      eyebrow="Category"
      title={data.category?.name ?? "AI Tools"}
      description={data.category?.description ?? DESCRIPTION}
      posts={data.posts}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      basePath="/ai-tools"
    />
  );
}
