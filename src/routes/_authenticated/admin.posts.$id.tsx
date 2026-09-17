import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, History, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { FeaturedImageField } from "@/components/admin/media-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";
import {
  autoExcerpt,
  formatDateTime,
  fromLocalInput,
  readingTime,
  relativeTime,
  slugify,
  toLocalInput,
  uniqueSlug,
} from "@/lib/admin/utils";

export const Route = createFileRoute("/_authenticated/admin/posts/$id")({
  head: () => ({ meta: [{ title: "Edit post — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: PostEditor,
});

type Status = "draft" | "published" | "scheduled";
type PostType = "review" | "comparison" | "guide" | "article";

type FormState = {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  category_id: string;
  post_type: PostType;
  status: Status;
  published_at: string;
  is_featured: boolean;
  reading_time: number;
  author_name: string;
  author_title: string;
  author_bio: string;
  product_name: string;
  product_type: string;
  product_url: string;
  affiliate_url: string;
  affiliate_cta_label: string;
  rating: string;
  pricing_summary: string;
  money_back_guarantee: string;
  coupon_code: string;
  coupon_url: string;
  who_is_it_for: string;
  how_it_works: string;
  verdict: string;
  pros: string;
  cons: string;
  key_features: string;
  alternatives: string;
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  robots_meta: string;
  og_title: string;
  og_description: string;
  social_image: string | null;
};

const EMPTY: FormState = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  featured_image: null,
  category_id: "none",
  post_type: "review",
  status: "draft",
  published_at: "",
  is_featured: false,
  reading_time: 5,
  author_name: "",
  author_title: "",
  author_bio: "",
  product_name: "",
  product_type: "",
  product_url: "",
  affiliate_url: "",
  affiliate_cta_label: "",
  rating: "",
  pricing_summary: "",
  money_back_guarantee: "",
  coupon_code: "",
  coupon_url: "",
  who_is_it_for: "",
  how_it_works: "",
  verdict: "",
  pros: "",
  cons: "",
  key_features: "",
  alternatives: "",
  seo_title: "",
  meta_description: "",
  focus_keyword: "",
  canonical_url: "",
  robots_meta: "index, follow",
  og_title: "",
  og_description: "",
  social_image: null,
};

const toLines = (list: string[] | null) => (list ?? []).join("\n");
const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function PostEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(isNew);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    dirtyRef.current = true;
  };

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["admin-tags-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("tags").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: post } = useQuery({
    queryKey: ["admin-post", id],
    enabled: !isNew,
    queryFn: async () => {
      const [{ data, error }, links] = await Promise.all([
        supabase.from("posts").select("*").eq("id", id).single(),
        supabase.from("post_tags").select("tag_id").eq("post_id", id),
      ]);
      if (error) throw error;
      return { post: data, tagIds: (links.data ?? []).map((t) => t.tag_id) };
    },
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ["admin-revisions", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data } = await supabase
        .from("post_revisions")
        .select("id, title, created_at, created_by_name")
        .eq("post_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data ?? []) as {
        id: string;
        title: string;
        created_at: string;
        created_by_name: string | null;
      }[];
    },
  });

  useEffect(() => {
    if (!post) return;
    const p = post.post;
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content ?? "",
      excerpt: p.excerpt ?? "",
      featured_image: p.featured_image,
      category_id: p.category_id ?? "none",
      post_type: p.post_type,
      status: p.status,
      published_at: toLocalInput(p.published_at),
      is_featured: p.is_featured,
      reading_time: p.reading_time,
      author_name: p.author_name ?? "",
      author_title: p.author_title ?? "",
      author_bio: p.author_bio ?? "",
      product_name: p.product_name ?? "",
      product_type: p.product_type ?? "",
      product_url: p.product_url ?? "",
      affiliate_url: p.affiliate_url ?? "",
      affiliate_cta_label: p.affiliate_cta_label ?? "",
      rating: p.rating != null ? String(p.rating) : "",
      pricing_summary: p.pricing_summary ?? "",
      money_back_guarantee: p.money_back_guarantee ?? "",
      coupon_code: p.coupon_code ?? "",
      coupon_url: p.coupon_url ?? "",
      who_is_it_for: p.who_is_it_for ?? "",
      how_it_works: p.how_it_works ?? "",
      verdict: p.verdict ?? "",
      pros: toLines(p.pros),
      cons: toLines(p.cons),
      key_features: toLines(p.key_features),
      alternatives: toLines(p.alternatives),
      seo_title: p.seo_title ?? "",
      meta_description: p.meta_description ?? "",
      focus_keyword: p.focus_keyword ?? "",
      canonical_url: p.canonical_url ?? "",
      robots_meta: p.robots_meta ?? "index, follow",
      og_title: p.og_title ?? "",
      og_description: p.og_description ?? "",
      social_image: p.social_image,
    });
    setTagIds(post.tagIds);
    setLoaded(true);
    setDirty(false);
    dirtyRef.current = false;
  }, [post]);

  useEffect(() => {
    if (isNew && staff && !form.author_name) {
      setForm((prev) => ({ ...prev, author_name: staff.fullName || "Vistora Editorial" }));
    }
  }, [isNew, staff, form.author_name]);

  const canEdit = isNew || staff?.canManageAll || post?.post.author_id === staff?.id;

  const buildPayload = async (status: Status) => {
    const title = form.title.trim() || "Untitled post";
    const slug =
      slugify(form.slug) ||
      (await uniqueSlug(supabase, "posts", title, isNew ? null : id));
    return {
      title,
      slug,
      content: form.content,
      excerpt: form.excerpt.trim() || (form.content ? autoExcerpt(form.content) : null),
      featured_image: form.featured_image,
      category_id: form.category_id === "none" ? null : form.category_id,
      post_type: form.post_type,
      status,
      published_at:
        status === "published"
          ? fromLocalInput(form.published_at) ?? new Date().toISOString()
          : status === "scheduled"
            ? fromLocalInput(form.published_at)
            : fromLocalInput(form.published_at),
      is_featured: form.is_featured,
      reading_time: Number(form.reading_time) || readingTime(form.content),
      author_id: isNew ? staff?.id ?? null : post?.post.author_id ?? staff?.id ?? null,
      author_name: form.author_name.trim() || "Vistora Editorial",
      author_title: form.author_title.trim() || null,
      author_bio: form.author_bio.trim() || null,
      product_name: form.product_name.trim() || null,
      product_type: form.product_type.trim() || null,
      product_url: form.product_url.trim() || null,
      affiliate_url: form.affiliate_url.trim() || null,
      affiliate_cta_label: form.affiliate_cta_label.trim() || null,
      rating: form.rating ? Number(form.rating) : null,
      pricing_summary: form.pricing_summary.trim() || null,
      money_back_guarantee: form.money_back_guarantee.trim() || null,
      coupon_code: form.coupon_code.trim() || null,
      coupon_url: form.coupon_url.trim() || null,
      who_is_it_for: form.who_is_it_for.trim() || null,
      how_it_works: form.how_it_works.trim() || null,
      verdict: form.verdict.trim() || null,
      pros: fromLines(form.pros),
      cons: fromLines(form.cons),
      key_features: fromLines(form.key_features),
      alternatives: fromLines(form.alternatives),
      seo_title: form.seo_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      focus_keyword: form.focus_keyword.trim() || null,
      canonical_url: form.canonical_url.trim() || null,
      robots_meta: form.robots_meta,
      og_title: form.og_title.trim() || null,
      og_description: form.og_description.trim() || null,
      social_image: form.social_image,
    };
  };

  const syncTags = async (postId: string) => {
    await supabase.from("post_tags").delete().eq("post_id", postId);
    if (tagIds.length) {
      await supabase.from("post_tags").insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
    }
  };

  const save = useMutation({
    mutationFn: async ({ status, silent }: { status: Status; silent?: boolean }) => {
      const payload = await buildPayload(status);
      if (isNew) {
        const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
        if (error) throw error;
        await syncTags(data.id);
        return { id: data.id as string, silent, created: true };
      }
      const { error } = await supabase.from("posts").update(payload).eq("id", id);
      if (error) throw error;
      await syncTags(id);
      // Snapshot the saved state so it can be reviewed later.
      await supabase.from("post_revisions").insert({
        post_id: id,
        title: payload.title,
        content: payload.content,
        excerpt: payload.excerpt,
        snapshot: payload as never,
        created_by: staff?.id ?? null,
        created_by_name: staff?.fullName ?? null,
      });
      return { id, silent, created: false };
    },
    onSuccess: (result) => {
      setLastSaved(new Date().toISOString());
      setDirty(false);
      dirtyRef.current = false;
      void queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-revisions", id] });
      if (!result.silent) toast.success("Post saved successfully");
      if (result.created) {
        void navigate({ to: "/admin/posts/$id", params: { id: result.id } });
      }
    },
    onError: (error: Error) => toast.error(error.message || "Could not save this post."),
  });

  const trash = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("posts")
        .update({ trashed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Moved to trash");
      void queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      void navigate({ to: "/admin/posts", search: { status: "all", page: 1 } });
    },
    onError: () => toast.error("Could not trash this post."),
  });

  // Autosave existing posts every 45 seconds while there are unsaved changes.
  useEffect(() => {
    if (isNew || !loaded || !canEdit) return;
    const timer = setInterval(() => {
      if (dirtyRef.current && !save.isPending) {
        save.mutate({ status: form.status, silent: true });
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [isNew, loaded, canEdit, form.status, save]);

  const restoreRevision = useMutation({
    mutationFn: async (revisionId: string) => {
      const { data, error } = await supabase
        .from("post_revisions")
        .select("title, content, excerpt")
        .eq("id", revisionId)
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (revision) => {
      setForm((prev) => ({
        ...prev,
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt ?? "",
      }));
      setDirty(true);
      dirtyRef.current = true;
      toast.success("Revision loaded — save to keep it.");
    },
    onError: () => toast.error("Could not load that revision."),
  });

  const seoScore = useMemo(() => {
    let score = 0;
    if (form.seo_title || form.title) score += 20;
    if ((form.meta_description || form.excerpt).length >= 80) score += 20;
    if (form.focus_keyword && form.title.toLowerCase().includes(form.focus_keyword.toLowerCase()))
      score += 20;
    if (form.featured_image) score += 20;
    if (form.content.length > 1200) score += 20;
    return score;
  }, [form]);

  if (!loaded) {
    return (
      <AdminShell title="Loading post…">
        <p className="text-sm text-muted-foreground">Fetching content…</p>
      </AdminShell>
    );
  }

  if (!canEdit) {
    return (
      <AdminShell title="Not allowed">
        <p className="text-sm text-muted-foreground">
          This post belongs to another author. Ask an editor to make changes.
        </p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={isNew ? "Add new post" : "Edit post"}
      description={
        lastSaved
          ? `Saved ${relativeTime(lastSaved)}${dirty ? " · unsaved changes" : ""}`
          : dirty
            ? "Unsaved changes"
            : "All changes saved"
      }
      actions={
        <>
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin/posts" search={{ status: "all", page: 1 }}>
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => save.mutate({ status: form.status === "published" ? "published" : "draft" })}
            disabled={save.isPending}
          >
            <Save className="mr-1 h-3.5 w-3.5" /> {save.isPending ? "Saving…" : "Save draft"}
          </Button>
          <Button
            size="sm"
            onClick={() =>
              save.mutate({ status: form.published_at && isFuture(form.published_at) ? "scheduled" : "published" })
            }
            disabled={save.isPending}
          >
            {form.status === "published" ? "Update" : "Publish"}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <Input
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (isNew) set("slug", slugify(e.target.value));
              }}
              placeholder="Add title"
              className="h-auto border-0 bg-transparent px-0 font-display text-2xl shadow-none focus-visible:ring-0 sm:text-3xl"
              aria-label="Post title"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Permalink:</span>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                className="h-7 w-64 text-xs"
                aria-label="Slug"
              />
              {!isNew && form.status === "published" ? (
                <Link
                  to="/reviews/$slug"
                  params={{ slug: form.slug }}
                  className="inline-flex items-center gap-1 text-primary"
                >
                  <ExternalLink className="h-3 w-3" /> View
                </Link>
              ) : null}
            </div>
          </div>

          <RichTextEditor value={form.content} onChange={(html) => set("content", html)} />

          <Tabs defaultValue="excerpt">
            <TabsList className="flex-wrap">
              <TabsTrigger value="excerpt">Excerpt</TabsTrigger>
              <TabsTrigger value="review">Review details</TabsTrigger>
              <TabsTrigger value="seo">SEO & social</TabsTrigger>
              <TabsTrigger value="author">Author</TabsTrigger>
              {!isNew ? <TabsTrigger value="revisions">Revisions</TabsTrigger> : null}
            </TabsList>

            <TabsContent value="excerpt" className="mt-4 rounded-xl border bg-card p-5">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Short summary shown on cards and in search results."
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => set("excerpt", autoExcerpt(form.content))}
              >
                Generate from content
              </Button>
            </TabsContent>

            <TabsContent value="review" className="mt-4 space-y-4 rounded-xl border bg-card p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" value={form.product_name} onChange={(v) => set("product_name", v)} />
                <Field label="Product type" value={form.product_type} onChange={(v) => set("product_type", v)} placeholder="SaaS, plugin, course…" />
                <Field label="Product URL" value={form.product_url} onChange={(v) => set("product_url", v)} />
                <Field label="Affiliate URL" value={form.affiliate_url} onChange={(v) => set("affiliate_url", v)} />
                <Field label="Affiliate button label" value={form.affiliate_cta_label} onChange={(v) => set("affiliate_cta_label", v)} placeholder="Visit website" />
                <div className="space-y-1">
                  <Label htmlFor="rating">Rating (0–5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={form.rating}
                    onChange={(e) => set("rating", e.target.value)}
                  />
                </div>
                <Field label="Pricing summary" value={form.pricing_summary} onChange={(v) => set("pricing_summary", v)} />
                <Field label="Money-back guarantee" value={form.money_back_guarantee} onChange={(v) => set("money_back_guarantee", v)} />
                <Field label="Coupon code" value={form.coupon_code} onChange={(v) => set("coupon_code", v)} />
                <Field label="Coupon URL" value={form.coupon_url} onChange={(v) => set("coupon_url", v)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ListField label="Pros (one per line)" value={form.pros} onChange={(v) => set("pros", v)} />
                <ListField label="Cons (one per line)" value={form.cons} onChange={(v) => set("cons", v)} />
                <ListField label="Key features (one per line)" value={form.key_features} onChange={(v) => set("key_features", v)} />
                <ListField label="Alternatives (one per line)" value={form.alternatives} onChange={(v) => set("alternatives", v)} />
              </div>

              <ListField label="Who is it for" value={form.who_is_it_for} onChange={(v) => set("who_is_it_for", v)} rows={3} />
              <ListField label="How it works" value={form.how_it_works} onChange={(v) => set("how_it_works", v)} rows={3} />
              <ListField label="Final verdict" value={form.verdict} onChange={(v) => set("verdict", v)} rows={3} />
            </TabsContent>

            <TabsContent value="seo" className="mt-4 space-y-4 rounded-xl border bg-card p-5">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Search preview</p>
                <p className="mt-2 truncate text-base text-primary">
                  {form.seo_title || form.title || "Post title"}
                </p>
                <p className="text-xs text-muted-foreground">vistora-reviews.lovable.app/reviews/{form.slug || "slug"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {form.meta_description || form.excerpt || "Add a meta description to control this text."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">SEO checklist score: {seoScore}%</p>
              </div>
              <Field label="SEO title" value={form.seo_title} onChange={(v) => set("seo_title", v)} hint={`${form.seo_title.length}/60`} />
              <div className="space-y-1">
                <Label htmlFor="metadesc">Meta description ({form.meta_description.length}/160)</Label>
                <Textarea
                  id="metadesc"
                  rows={2}
                  value={form.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Focus keyword" value={form.focus_keyword} onChange={(v) => set("focus_keyword", v)} />
                <Field label="Canonical URL" value={form.canonical_url} onChange={(v) => set("canonical_url", v)} />
                <div className="space-y-1">
                  <Label>Search engine visibility</Label>
                  <Select value={form.robots_meta} onValueChange={(v) => set("robots_meta", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="index, follow">Index &amp; follow</SelectItem>
                      <SelectItem value="noindex, follow">No index, follow</SelectItem>
                      <SelectItem value="index, nofollow">Index, no follow</SelectItem>
                      <SelectItem value="noindex, nofollow">Hide completely</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field label="Open Graph title" value={form.og_title} onChange={(v) => set("og_title", v)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ogdesc">Open Graph description</Label>
                <Textarea
                  id="ogdesc"
                  rows={2}
                  value={form.og_description}
                  onChange={(e) => set("og_description", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Social share image</Label>
                <FeaturedImageField
                  value={form.social_image}
                  onChange={(url) => set("social_image", url)}
                />
              </div>
            </TabsContent>

            <TabsContent value="author" className="mt-4 space-y-4 rounded-xl border bg-card p-5">
              <Field label="Author name" value={form.author_name} onChange={(v) => set("author_name", v)} />
              <Field label="Author title" value={form.author_title} onChange={(v) => set("author_title", v)} />
              <div className="space-y-1">
                <Label htmlFor="authorbio">Author bio</Label>
                <Textarea
                  id="authorbio"
                  rows={3}
                  value={form.author_bio}
                  onChange={(e) => set("author_bio", e.target.value)}
                />
              </div>
            </TabsContent>

            {!isNew ? (
              <TabsContent value="revisions" className="mt-4 rounded-xl border bg-card p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <History className="h-4 w-4" /> Recent revisions
                </h3>
                <ul className="mt-3 divide-y text-sm">
                  {revisions.length ? (
                    revisions.map((rev) => (
                      <li key={rev.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{rev.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {rev.created_by_name ?? "Someone"} · {formatDateTime(rev.created_at)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreRevision.mutate(rev.id)}
                        >
                          Restore
                        </Button>
                      </li>
                    ))
                  ) : (
                    <li className="py-3 text-muted-foreground">
                      No revisions yet — they're created each time you save.
                    </li>
                  )}
                </ul>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Publish</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v as Status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="pubdate">Publish date &amp; time</Label>
                <Input
                  id="pubdate"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => set("published_at", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A future date automatically publishes the post at that moment.
                </p>
              </div>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={form.is_featured}
                  onCheckedChange={(checked) => set("is_featured", Boolean(checked))}
                />
                <span>Feature on the homepage hero</span>
              </label>
              {!isNew ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Move this post to the trash?")) trash.mutate();
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Move to trash
                </Button>
              ) : null}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Featured image</h2>
            <div className="mt-3">
              <FeaturedImageField
                value={form.featured_image}
                onChange={(url) => set("featured_image", url)}
              />
            </div>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Organisation</h2>
            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <Label>Post type</Label>
                <Select value={form.post_type} onValueChange={(v) => set("post_type", v as PostType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="comparison">Comparison</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Uncategorised" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorised</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const active = tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setTagIds((prev) =>
                            active ? prev.filter((t) => t !== tag.id) : [...prev, tag.id],
                          );
                          setDirty(true);
                          dirtyRef.current = true;
                        }}
                      >
                        <Badge variant={active ? "default" : "outline"}>{tag.name}</Badge>
                      </button>
                    );
                  })}
                  {!tags.length ? (
                    <Link to="/admin/tags" className="text-xs text-primary">
                      Create your first tag
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="rt">Reading time (minutes)</Label>
                <Input
                  id="rt"
                  type="number"
                  min="1"
                  value={form.reading_time}
                  onChange={(e) => set("reading_time", Number(e.target.value))}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => set("reading_time", readingTime(form.content))}
                >
                  Calculate from content
                </Button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}

function isFuture(localValue: string) {
  const iso = fromLocalInput(localValue);
  return iso ? new Date(iso).getTime() > Date.now() : false;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        {label} {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
      />
    </div>
  );
}

function ListField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const id = label.replace(/[^\w]+/g, "-").toLowerCase();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
