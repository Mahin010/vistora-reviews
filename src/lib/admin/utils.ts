import type { SupabaseClient } from "@supabase/supabase-js";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

/** Ensures a slug is unique inside a table, appending -2, -3 … when needed. */
export async function uniqueSlug(
  db: SupabaseClient,
  table: "posts" | "categories" | "tags",
  base: string,
  excludeId?: string | null,
) {
  const root = slugify(base) || "untitled";
  let candidate = root;
  for (let attempt = 2; attempt < 60; attempt++) {
    let query = db.from(table).select("id").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    candidate = `${root}-${attempt}`;
  }
  return `${root}-${Date.now()}`;
}

export function htmlToText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoExcerpt(html: string, length = 180) {
  const text = htmlToText(html);
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

export function readingTime(html: string) {
  const words = htmlToText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** ISO string -> value for <input type="datetime-local"> in the browser's zone. */
export function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function fromLocalInput(value: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value?: string | null) {
  if (!value) return "—";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Removes script/iframe/event handlers from pasted or editor HTML before saving. */
export function sanitizeHtml(html: string) {
  return html
    .replace(/<\s*(script|iframe|object|embed|style)[\s\S]*?<\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|style)[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
