import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site-shell";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION = `How ${SITE_NAME} tests digital products, scores them, and stays independent of the companies we cover.`;

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `About — ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <SiteShell>
      <PageHeader eyebrow="About" title={`Why ${SITE_NAME} exists`} description={DESCRIPTION} />
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <div className="article-prose">
          <p>
            Software buying decisions are made in a fog of sponsored listicles and screenshots from
            marketing sites. {SITE_NAME} was started to cut through that: we buy the tools, run real work
            through them, and publish what we found — including the parts vendors would rather we skipped.
          </p>
          <h2>How we test</h2>
          <p>
            Every review starts with a real job to be done. We set up the product from scratch, migrate or
            recreate a representative workload, and use it for at least two weeks before scoring it. Where
            performance matters — hosting, page builders, AI output quality — we record measurements and
            repeat them.
          </p>
          <h2>How we score</h2>
          <p>
            Scores run from 1 to 5 and weigh capability, usability, support quality and value. A product
            can be excellent and still score lower for a specific audience, which is why every review has a
            “who it's for” section rather than a single verdict for everyone.
          </p>
          <h2>How we make money</h2>
          <p>
            Some links are affiliate links, which means we may earn a commission if you buy after clicking.
            Affiliate relationships never determine which products we cover, what we say about them, or the
            score they receive. We do not accept payment for reviews or for a better rating.
          </p>
          <h2>Corrections</h2>
          <p>
            Products change quickly. If something in a review is out of date or wrong, tell us on the
            contact page and we will re-test and update the article with a dated note.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
