import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "@/components/category-page";
import { listPosts } from "@/lib/content.functions";
import { validatePageSearch } from "@/lib/route-search";
import { SITE_NAME } from "@/lib/site";

const TITLE = `Software Comparisons — ${SITE_NAME}`;
const DESCRIPTION =
  "Head-to-head comparisons that end with a clear recommendation for each type of buyer.";

export const Route = createFileRoute("/comparisons")({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => listPosts({ data: { postType: "comparison", page: deps.page } }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/comparisons" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/comparisons" }],
  }),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  return (
    <CategoryListing
      eyebrow="Head-to-head"
      title="Comparisons"
      description={DESCRIPTION}
      posts={data.posts}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      basePath="/comparisons"
    />
  );
}
