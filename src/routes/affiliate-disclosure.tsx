import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site-shell";
import { AFFILIATE_DISCLOSURE, SITE_NAME } from "@/lib/site";

const DESCRIPTION = `How ${SITE_NAME} uses affiliate links and why they never affect our scores or verdicts.`;

export const Route = createFileRoute("/affiliate-disclosure")({
  head: () => ({
    meta: [
      { title: `Affiliate Disclosure — ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `Affiliate Disclosure — ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/affiliate-disclosure" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/affiliate-disclosure" }],
  }),
  component: Disclosure,
});

function Disclosure() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Transparency" title="Affiliate Disclosure" description={DESCRIPTION} />
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <div className="article-prose">
          <p>{AFFILIATE_DISCLOSURE}</p>
          <h2>What an affiliate link is</h2>
          <p>
            When we link to a product we review, that link sometimes carries a tracking code. If you sign up
            or buy, the vendor pays us a share of the sale. The price you pay is the same either way.
          </p>
          <h2>What commission does not buy</h2>
          <p>
            Vendors cannot pay to be reviewed, to be included in a comparison, to change a score, or to have
            criticism removed. Commission rates are never a factor in which product we recommend, and we
            regularly recommend tools that pay us nothing — including free ones.
          </p>
          <h2>How we label links</h2>
          <p>
            Affiliate call-to-action buttons appear inside a labelled product card with this disclosure
            attached, and all outbound commercial links are marked as sponsored for search engines.
          </p>
          <h2>Questions</h2>
          <p>
            If you would rather not use an affiliate link, search for the product directly — our verdict is
            the same either way. For anything else, reach us through the contact page.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
