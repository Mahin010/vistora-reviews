import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/posts/$id")({
  head: () => ({ meta: [{ title: "Edit post — Vistora Admin" }, { name: "robots", content: "noindex" }] }),
  component: PostEditor,
});

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category_id: string;
  post_type: string;
  status: string;
  published_at: string;
  is_featured: boolean;
  reading_time: number;
  author_name: string;
  author_title: string;
  author_bio: string;
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  product_name: string;
  product_url: string;
  affiliate_url: string;
  affiliate_cta_label: string;
  rating: string;
  pricing_summary: string;
  who_is_it_for: string;
  how_it_works: string;
  verdict: string;
  pros: string;
  cons: string;
  key_features: string;
  alternatives: string;
};

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "<p></p>",
  featured_image: "",
  category_id: "",
  post_type: "review",
  status: "draft",
  published_at: "",
  is_featured: false,
  reading_time: 6,
  author_name: "",
  author_title: "",
  author_bio: "",
  seo_title: "",
  meta_description: "",
  focus_keyword: "",
  canonical_url: "",
  product_name: "",
  product_url: "",
  affiliate_url: "",
  affiliate_cta_label: "",
  rating: "",
  pricing_summary: "",
  who_is_it_for: "",
  how_it_works: "",
  verdict: "",
  pros: "",
  cons: "",
  key_features: "",
  alternatives: "",
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

const toLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="mb-4 text-lg">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function PostEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: taxonomy } = useQuery({
    queryKey: ["admin-taxonomy"],
    queryFn: async () => {
      const [categories, tags] = await Promise.all([
        supabase.from("categories").select("id, name").order("sort_order"),
        supabase.from("tags").select("id, name").order("name"),
      ]);
      return {
        categories: (categories.data ?? []) as { id: string; name: string }[],
        tags: (tags.data ?? []) as { id: string; name: string }[],
      };
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["admin-post", id],
    enabled: !isNew,
    queryFn: async () => {
      const [post, postTags] = await Promise.all([
        supabase.from("posts").select("*").eq("id", id).maybeSingle(),
        supabase.from("post_tags").select("tag_id").eq("post_id", id),
      ]);
      if (post.error) throw post.error;
      return {
        post: post.data as Record<string, unknown> | null,
        tagIds: ((postTags.data ?? []) as { tag_id: string }[]).map((t) => t.tag_id),
      };
    },
  });

  useEffect(() => {
    if (isNew && staff && !form.author_name) {
      setForm((prev) => ({ ...prev, author_name: staff.fullName }));
    }
  }, [isNew, staff, form.author_name]);

  useEffect(() => {
    if (!existing?.post) return;
    const p = existing.post as Record<string, any>;
    setForm({
      ...EMPTY,
      ...Object.fromEntries(
        Object.keys(EMPTY).map((key) => {
          const value = p[key];
          if (key === "pros" || key === "cons" || key === "key_features" || key === "alternatives") {
            return [key, Array.isArray(value) ? value.join("\n") : ""];
          }
          if (key === "is_featured") return [key, Boolean(value)];
          if (key === "reading_time") return [key, Number(value ?? 6)];
          if (key === "published_at") {
            return [key, value ? String(value).slice(0, 16) : ""];
          }
          return [key, value == null ? "" : String(value)];
        }),
      ),
    } as FormState);
    setSelectedTags(existing.tagIds);
  }, [existing]);

  const save = useMutation({
    mutationFn: async (statusOverride?: string) => {
      const status = statusOverride ?? form.status;
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugify(form.title),
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        featured_image: form.featured_image.trim() || null,
        category_id: form.category_id || null,
        post_type: form.post_type,
        status,
        published_at:
          status === "draft"
            ? null
            : form.published_at
              ? new Date(form.published_at).toISOString()
              : new Date().toISOString(),
        is_featured: form.is_featured,
        reading_time: Number(form.reading_time) || 6,
        author_name: form.author_name.trim() || staff?.fullName || "Vistora Team",
        author_title: form.author_title.trim() || null,
        author_bio: form.author_bio.trim() || null,
        seo_title: form.seo_title.trim() || null,
        meta_description: form.meta_description.trim() || null,
        focus_keyword: form.focus_keyword.trim() || null,
        canonical_url: form.canonical_url.trim() || null,
        product_name: form.product_name.trim() || null,
        product_url: form.product_url.trim() || null,
        affiliate_url: form.affiliate_url.trim() || null,
        affiliate_cta_label: form.affiliate_cta_label.trim() || null,
        rating: form.rating ? Number(form.rating) : null,
        pricing_summary: form.pricing_summary.trim() || null,
        who_is_it_for: form.who_is_it_for.trim() || null,
        how_it_works: form.how_it_works.trim() || null,
        verdict: form.verdict.trim() || null,
        pros: toLines(form.pros),
        cons: toLines(form.cons),
        key_features: toLines(form.key_features),
        alternatives: toLines(form.alternatives),
      };

      let postId = id;
      if (isNew) {
        const { data, error } = await supabase
          .from("posts")
          .insert({ ...payload, author_id: staff?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        postId = (data as { id: string }).id;
      } else {
        const { error } = await supabase.from("posts").update(payload).eq("id", id);
        if (error) throw error;
      }

      await supabase.from("post_tags").delete().eq("post_id", postId);
      if (selectedTags.length > 0) {
        await supabase
          .from("post_tags")
          .insert(selectedTags.map((tag_id) => ({ post_id: postId, tag_id })));
      }
      return postId;
    },
    onSuccess: (postId) => {
      toast.success("Post saved.");
      void queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-post", postId] });
      if (isNew) navigate({ to: "/admin/posts/$id", params: { id: postId } });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the post."),
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <AdminShell
      title={isNew ? "New post" : "Edit post"}
      description="Content, SEO and affiliate settings for this article."
      actions={
        <>
          <Button asChild variant="ghost">
            <Link to="/admin/posts">
              <ArrowLeft className="mr-1 h-4 w-4" /> Posts
            </Link>
          </Button>
          <Button variant="outline" disabled={save.isPending} onClick={() => save.mutate("draft")}>
            Save draft
          </Button>
          <Button disabled={save.isPending} onClick={() => save.mutate(undefined)}>
            <Save className="mr-1 h-4 w-4" /> {save.isPending ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Panel title="Content">
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title,
                    slug: prev.slug && !isNew ? prev.slug : slugify(title),
                  }));
                }}
              />
            </Field>
            <Field label="Slug" hint="Used in the URL: /reviews/your-slug">
              <Input value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            </Field>
            <Field label="Excerpt">
              <Textarea rows={3} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
            </Field>
            <Field label="Body (HTML)" hint="Use <h2>, <h3>, <p>, <ul> — headings become the table of contents.">
              <Textarea
                rows={20}
                className="font-mono text-xs"
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
              />
            </Field>
            <Field label="Featured image URL">
              <Input
                value={form.featured_image}
                onChange={(e) => set("featured_image", e.target.value)}
              />
            </Field>
          </Panel>

          <Panel title="Review details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name">
                <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} />
              </Field>
              <Field label="Rating (1–5)">
                <Input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={(e) => set("rating", e.target.value)}
                />
              </Field>
              <Field label="Product URL">
                <Input value={form.product_url} onChange={(e) => set("product_url", e.target.value)} />
              </Field>
              <Field label="Affiliate URL">
                <Input value={form.affiliate_url} onChange={(e) => set("affiliate_url", e.target.value)} />
              </Field>
              <Field label="Affiliate CTA label">
                <Input
                  value={form.affiliate_cta_label}
                  onChange={(e) => set("affiliate_cta_label", e.target.value)}
                />
              </Field>
              <Field label="Pricing summary">
                <Input
                  value={form.pricing_summary}
                  onChange={(e) => set("pricing_summary", e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pros" hint="One per line">
                <Textarea rows={5} value={form.pros} onChange={(e) => set("pros", e.target.value)} />
              </Field>
              <Field label="Cons" hint="One per line">
                <Textarea rows={5} value={form.cons} onChange={(e) => set("cons", e.target.value)} />
              </Field>
              <Field label="Key features" hint="One per line">
                <Textarea
                  rows={5}
                  value={form.key_features}
                  onChange={(e) => set("key_features", e.target.value)}
                />
              </Field>
              <Field label="Alternatives" hint="One per line">
                <Textarea
                  rows={5}
                  value={form.alternatives}
                  onChange={(e) => set("alternatives", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Who it's for">
              <Textarea
                rows={3}
                value={form.who_is_it_for}
                onChange={(e) => set("who_is_it_for", e.target.value)}
              />
            </Field>
            <Field label="How it works">
              <Textarea
                rows={3}
                value={form.how_it_works}
                onChange={(e) => set("how_it_works", e.target.value)}
              />
            </Field>
            <Field label="Final verdict">
              <Textarea rows={3} value={form.verdict} onChange={(e) => set("verdict", e.target.value)} />
            </Field>
          </Panel>

          <Panel title="SEO">
            <Field label="SEO title">
              <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
            </Field>
            <Field label="Meta description">
              <Textarea
                rows={3}
                value={form.meta_description}
                onChange={(e) => set("meta_description", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Focus keyword">
                <Input
                  value={form.focus_keyword}
                  onChange={(e) => set("focus_keyword", e.target.value)}
                />
              </Field>
              <Field label="Canonical URL">
                <Input
                  value={form.canonical_url}
                  onChange={(e) => set("canonical_url", e.target.value)}
                />
              </Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Publishing">
            <Field label="Status">
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Field label="Publish date & time" hint="Set a future date with the Scheduled status.">
              <Input
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => set("published_at", e.target.value)}
              />
            </Field>
            <Field label="Post type">
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.post_type}
                onChange={(e) => set("post_type", e.target.value)}
              >
                <option value="review">Review</option>
                <option value="comparison">Comparison</option>
                <option value="guide">Guide</option>
                <option value="article">Article</option>
              </select>
            </Field>
            <Field label="Category">
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
              >
                <option value="">No category</option>
                {taxonomy?.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Reading time (minutes)">
              <Input
                type="number"
                min="1"
                value={form.reading_time}
                onChange={(e) => set("reading_time", Number(e.target.value))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => set("is_featured", e.target.checked)}
              />
              Feature on the homepage
            </label>
          </Panel>

          <Panel title="Tags">
            <div className="flex flex-wrap gap-2">
              {taxonomy?.tags.map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        active ? prev.filter((t) => t !== tag.id) : [...prev, tag.id],
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Author">
            <Field label="Author name">
              <Input value={form.author_name} onChange={(e) => set("author_name", e.target.value)} />
            </Field>
            <Field label="Author title">
              <Input value={form.author_title} onChange={(e) => set("author_title", e.target.value)} />
            </Field>
            <Field label="Author bio">
              <Textarea
                rows={4}
                value={form.author_bio}
                onChange={(e) => set("author_bio", e.target.value)}
              />
            </Field>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
