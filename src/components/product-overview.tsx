import { Check, ExternalLink, Info, X } from "lucide-react";

import { Rating } from "@/components/rating";
import { Button } from "@/components/ui/button";
import { AFFILIATE_DISCLOSURE } from "@/lib/site";
import type { Post } from "@/lib/types";

export function ProductOverviewCard({ post }: { post: Post }) {
  if (!post.product_name && !post.rating) return null;

  return (
    <section
      id="product-overview"
      aria-label="Product overview"
      className="rounded-2xl border bg-card p-6 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-1">At a glance</p>
          <h2 className="text-2xl">{post.product_name ?? post.title}</h2>
        </div>
        {post.rating ? (
          <div className="rounded-xl bg-secondary px-4 py-3 text-center">
            <p className="font-display text-3xl leading-none">{Number(post.rating).toFixed(1)}</p>
            <Rating value={Number(post.rating)} showNumber={false} className="mt-1 justify-center" />
            <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              Vistora score
            </p>
          </div>
        ) : null}
      </div>

      {(post.pros.length > 0 || post.cons.length > 0) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {post.pros.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold">What we liked</p>
              <ul className="space-y-2 text-sm">
                {post.pros.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {post.cons.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-semibold">What held it back</p>
              <ul className="space-y-2 text-sm">
                {post.cons.map((item) => (
                  <li key={item} className="flex gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {post.pricing_summary ? (
        <div className="mt-6 rounded-lg border border-dashed p-4">
          <p className="eyebrow mb-1">Pricing</p>
          <p className="text-sm text-muted-foreground">{post.pricing_summary}</p>
        </div>
      ) : null}

      {post.affiliate_url ? (
        <div className="mt-6">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={post.affiliate_url} target="_blank" rel="nofollow sponsored noopener noreferrer">
              {post.affiliate_cta_label ?? `Visit ${post.product_name ?? "site"}`}
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{AFFILIATE_DISCLOSURE}</span>
          </p>
        </div>
      ) : null}
    </section>
  );
}
