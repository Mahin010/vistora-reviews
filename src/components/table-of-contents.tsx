import type { Heading } from "@/lib/site";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="rounded-xl border bg-card p-5 shadow-card">
      <p className="eyebrow mb-3">On this page</p>
      <ol className="space-y-2 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
            <a href={`#${h.id}`} className="text-muted-foreground hover:text-primary">
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
