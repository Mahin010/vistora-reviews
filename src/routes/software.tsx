import { createFileRoute } from "@tanstack/react-router";

import { CategoryListing } from "@/components/category-page";
import { listPosts } from "@/lib/content.functions";
import { validatePageSearch } from "@/lib/route-search";
import { SITE_NAME } from "@/lib/site";

const TITLE = `Software Reviews — ${SITE_NAME}`;
const DESCRIPTION =
  "Reviews of SaaS and business software: what each platform does well, where it falls short, and who should pay for it.";

export const Route = createFileRoute("/software")({
  validateSearch: validatePageSearch,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: ({ deps }) => listPosts({ data: { categorySlug: "software", page: deps.page } }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/software" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/software" }],
  }),
  component: Page,
});

function Page() {
  const data = Route.useLoaderData();
  return (
    <CategoryListing
      eyebrow="Category"
      title={data.category?.name ?? "Software"}
      description={data.category?.description ?? DESCRIPTION}
      posts={data.posts}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      basePath="/software"
    />
  );
}
