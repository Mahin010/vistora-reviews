import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";

import { Rating } from "@/components/rating";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/site";
import type { PostCardData } from "@/lib/types";

export function PostCard({
  post,
  orientation = "vertical",
  className,
}: {
  post: PostCardData;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  const horizontal = orientation === "horizontal";

  return (
    <article
      className={cn(
        "group flex overflow-hidden rounded-lg border bg-card shadow-card transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-lift",
        horizontal ? "flex-col sm:flex-row" : "flex-col",
        className,
      )}
    >
      <Link
        to="/reviews/$slug"
        params={{ slug: post.slug }}
        className={cn("block overflow-hidden bg-muted", horizontal ? "sm:w-56 sm:shrink-0" : "")}
      >
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            loading="lazy"
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
              horizontal ? "aspect-[16/10] sm:aspect-square" : "aspect-[16/9]",
            )}
          />
        ) : (
          <div className="aspect-[16/9] w-full bg-secondary" />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          {post.category ? (
            <Badge variant="secondary" className="font-mono text-[0.65rem] uppercase tracking-wider">
              {post.category.name}
            </Badge>
          ) : null}
          {post.rating ? <Rating value={Number(post.rating)} /> : null}
        </div>

        <h3 className="text-lg leading-snug">
          <Link
            to="/reviews/$slug"
            params={{ slug: post.slug }}
            className="transition-colors hover:text-primary"
          >
            {post.title}
          </Link>
        </h3>

        {post.excerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{post.author_name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {post.reading_time} min read
          </span>
        </div>

        <Link
          to="/reviews/$slug"
          params={{ slug: post.slug }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          Read {post.post_type === "review" ? "review" : post.post_type === "comparison" ? "comparison" : "article"}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
