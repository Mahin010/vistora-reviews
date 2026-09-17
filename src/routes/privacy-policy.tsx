import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SiteShell } from "@/components/site-shell";
import { SITE_NAME } from "@/lib/site";

const DESCRIPTION = `What data ${SITE_NAME} collects, why we collect it, and the choices you have.`;

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `Privacy Policy — ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy-policy" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteShell>
      <PageHeader eyebrow="Legal" title="Privacy Policy" description={DESCRIPTION} />
      <div className="mx-auto max-w-3xl px-4 pb-20">
        <div className="article-prose">
          <h2>What we collect</h2>
          <p>
            We collect only what a publication needs to run: the email address you give us when subscribing
            to the newsletter, the name, email and message you send through the contact form, the name and
            optional email attached to a comment, and aggregate analytics about which pages are read.
          </p>
          <h2>Why we collect it</h2>
          <p>
            Newsletter emails are used to send the newsletter. Contact details are used to reply to you.
            Comment details are used to attribute and moderate comments. Analytics help us decide what to
            review next. We do not sell personal data.
          </p>
          <h2>Cookies and tracking</h2>
          <p>
            We use a small number of first-party cookies and local storage entries, for example to remember
            your light or dark theme preference. Affiliate partners may set their own cookies when you click
            an outbound link; their policies apply on their sites.
          </p>
          <h2>Retention</h2>
          <p>
            Newsletter subscriptions are kept until you unsubscribe. Contact messages are kept while the
            conversation is relevant, then deleted. Comments remain published unless you ask us to remove
            them.
          </p>
          <h2>Your rights</h2>
          <p>
            You can ask us to access, correct or delete the personal data we hold about you, and you can
            unsubscribe from the newsletter at any time using the link in every email. Contact us and we
            will action requests promptly.
          </p>
          <h2>Changes</h2>
          <p>
            If this policy changes materially we will note the change on this page. Continued use of the
            site after a change means you accept the updated policy.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
