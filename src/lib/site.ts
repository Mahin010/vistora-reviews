export const SITE_NAME = "Vistora Reviews";
export const SITE_TAGLINE = "Independent reviews of the digital tools that run modern work.";
export const SITE_DESCRIPTION =
  "Hands-on reviews, head-to-head comparisons and how-to guides for AI tools, SaaS, marketing software, productivity apps and WordPress products.";
export const AFFILIATE_DISCLOSURE =
  "Some links on Vistora Reviews are affiliate links. If you buy through them we may earn a commission at no extra cost to you. It never influences our scores or verdicts.";

export const NAV_LINKS = [
  { label: "Reviews", to: "/reviews" },
  { label: "Software", to: "/software" },
  { label: "AI Tools", to: "/ai-tools" },
  { label: "Marketing", to: "/marketing-tools" },
  { label: "Productivity", to: "/productivity" },
  { label: "WordPress", to: "/wordpress" },
  { label: "Comparisons", to: "/comparisons" },
  { label: "How-To", to: "/how-to-guides" },
] as const;

export const FOOTER_LINKS = [
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Affiliate Disclosure", to: "/affiliate-disclosure" },
] as const;

export function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type Heading = { id: string; text: string; level: number };

/** Adds ids to h2/h3 in stored HTML and returns the heading list for a table of contents. */
export function withHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id =
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60) || "section";
    let n = 2;
    while (used.has(id)) id = `${id}-${n++}`;
    used.add(id);
    headings.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, headings };
}
