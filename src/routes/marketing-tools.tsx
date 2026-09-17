import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "@/components/category-page";
import { listPosts } from "@/lib/content.functions";
import { validatePageSearch } from "@/lib/route-search";
import { SITE_NAME } from "@/lib/site";

const TITLE = `Marketing Tool Reviews — ${SITE_NAME}`;
const DESCRIPTION =
  "SEO platforms, email marketing suites and analytics tools reviewed by marketers who use them daily.";

export const Route = createFileRoute("/marketing-tools")({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => listPosts({ data: { categorySlug: "marketing-tools", page: deps.page } }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/marketing-tools" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/marketing-tools" }],
  }),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  return (
    <CategoryListing
      eyebrow="Category"
      title={data.category?.name ?? "Marketing Tools"}
      description={data.category?.description ?? DESCRIPTION}
      posts={data.posts}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      basePath="/marketing-tools"
    />
  );
}
