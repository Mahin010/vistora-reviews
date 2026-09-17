import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "@/components/category-page";
import { listPosts } from "@/lib/content.functions";
import { validatePageSearch } from "@/lib/route-search";
import { SITE_NAME } from "@/lib/site";

const TITLE = `WordPress Reviews & Guides — ${SITE_NAME}`;
const DESCRIPTION =
  "Hosting, themes, plugins and page builders reviewed with real site performance numbers and setup walkthroughs.";

export const Route = createFileRoute("/wordpress")({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => listPosts({ data: { categorySlug: "wordpress", page: deps.page } }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/wordpress" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/wordpress" }],
  }),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  return (
    <CategoryListing
      eyebrow="Category"
      title={data.category?.name ?? "WordPress"}
      description={data.category?.description ?? DESCRIPTION}
      posts={data.posts}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      basePath="/wordpress"
    />
  );
}
