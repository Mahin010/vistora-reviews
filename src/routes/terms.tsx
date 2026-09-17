import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site-shell";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION = `The terms that apply when you read, comment on or rely on content published by ${SITE_NAME}.`;

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms & Conditions — ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `Terms & Conditions — ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Terms & Conditions" description={DESCRIPTION} />
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <div className="article-prose">
          <h2>Using this site</h2>
          <p>
            You may read, share and quote our articles with attribution and a link. You may not republish
            full articles, scrape the site at scale, or present our content as your own.
          </p>
          <h2>Editorial content is opinion</h2>
          <p>
            Reviews, scores and verdicts reflect our testing at the time of writing. Products change, prices
            change, and your requirements may differ from the scenarios we tested. Always verify current
            pricing and features with the vendor before buying.
          </p>
          <h2>No warranty</h2>
          <p>
            Content is provided as-is without warranty of any kind. {SITE_NAME} is not liable for losses
            arising from decisions made on the basis of our articles, or from your use of third-party
            products we write about.
          </p>
          <h2>Comments</h2>
          <p>
            Comments are moderated. We remove spam, abuse, undisclosed promotion and anything unlawful. By
            posting a comment you grant us the right to publish and edit it for length or clarity.
          </p>
          <h2>Third-party links</h2>
          <p>
            Outbound links, including affiliate links, lead to sites we do not control. Their terms and
            privacy policies apply once you leave this site.
          </p>
          <h2>Contact</h2>
          <p>Questions about these terms can be sent through the contact page.</p>
        </div>
      </div>
    </SiteShell>
  );
}
