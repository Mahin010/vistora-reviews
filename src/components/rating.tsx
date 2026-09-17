import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function Rating({
  value,
  size = "sm",
  showNumber = true,
  className,
}: {
  value: number;
  size?: "sm" | "lg";
  showNumber?: boolean;
  className?: string;
}) {
  const stars = [1, 2, 3, 4, 5];
  const dim = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {stars.map((s) => (
          <Star
            key={s}
            className={cn(
              dim,
              value >= s - 0.25
                ? "fill-highlight text-highlight"
                : value >= s - 0.75
                  ? "fill-highlight/50 text-highlight"
                  : "text-muted-foreground/40",
            )}
          />
        ))}
      </div>
      {showNumber ? (
        <span
          className={cn(
            "font-mono font-medium",
            size === "lg" ? "text-base" : "text-xs",
          )}
        >
          {value.toFixed(1)}
        </span>
      ) : null}
      <span className="sr-only">{value.toFixed(1)} out of 5</span>
    </div>
  );
}
