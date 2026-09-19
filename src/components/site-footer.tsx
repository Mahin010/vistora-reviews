import { Link } from "@tanstack/react-router";

import { NewsletterForm } from "@/components/newsletter-form";
import { FOOTER_LINKS, NAV_LINKS, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary font-display text-base font-semibold text-primary-foreground">
              V
            </span>
            <span className="font-display text-lg font-semibold">{SITE_NAME}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{SITE_TAGLINE}</p>
          <div className="mt-5 max-w-sm">
            <p className="eyebrow mb-2">The weekly issue</p>
            <NewsletterForm compact />
          </div>
        </div>

        <div>
          <p className="eyebrow mb-3">Sections</p>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">Publication</p>
          <ul className="space-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                Staff login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 {SITE_NAME}. All rights reserved.
          </p>
          <p>Independent · Reader-supported · Never paid for coverage</p>
        </div>
      </div>
    </footer>
  );
}
