import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
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

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

type SettingsForm = {
  site_name: string;
  tagline: string;
  site_url: string;
  admin_email: string;
  contact_email: string;
  timezone: string;
  posts_per_page: number;
  default_category_id: string;
  default_post_type: string;
  comments_enabled: boolean;
  comments_require_approval: boolean;
  max_upload_mb: number;
  default_seo_title: string;
  default_meta_description: string;
  default_robots: string;
  sitemap_enabled: boolean;
  affiliate_disclosure: string;
  default_affiliate_cta: string;
  twitter_handle: string;
  linkedin_url: string;
  youtube_url: string;
  ai_provider: string;
  ai_model: string;
  ai_default_language: string;
  ai_default_tone: string;
  ai_default_word_count: number;
  ai_default_audience: string;
  ai_max_words: number;
  ai_images_enabled: boolean;
  ai_tools_enabled: boolean;
};

const EMPTY: SettingsForm = {
  site_name: "",
  tagline: "",
  site_url: "",
  admin_email: "",
  contact_email: "",
  timezone: "UTC",
  posts_per_page: 9,
  default_category_id: "none",
  default_post_type: "review",
  comments_enabled: true,
  comments_require_approval: true,
  max_upload_mb: 15,
  default_seo_title: "",
  default_meta_description: "",
  default_robots: "index, follow",
  sitemap_enabled: true,
  affiliate_disclosure: "",
  default_affiliate_cta: "Visit website",
  twitter_handle: "",
  linkedin_url: "",
  youtube_url: "",
  ai_provider: "lovable",
  ai_model: "openai/gpt-6-astra",
  ai_default_language: "English",
  ai_default_tone: "Natural",
  ai_default_word_count: 1500,
  ai_default_audience: "US audience",
  ai_max_words: 3000,
  ai_images_enabled: true,
  ai_tools_enabled: true,
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const { data: staff } = useStaff();
  const isAdmin = staff?.role === "admin";

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      site_name: settings.site_name ?? "",
      tagline: settings.tagline ?? "",
      site_url: settings.site_url ?? "",
      admin_email: settings.admin_email ?? "",
      contact_email: settings.contact_email ?? "",
      timezone: settings.timezone ?? "UTC",
      posts_per_page: settings.posts_per_page ?? 9,
      default_category_id: settings.default_category_id ?? "none",
      default_post_type: settings.default_post_type ?? "review",
      comments_enabled: settings.comments_enabled ?? true,
      comments_require_approval: settings.comments_require_approval ?? true,
      max_upload_mb: settings.max_upload_mb ?? 15,
      default_seo_title: settings.default_seo_title ?? "",
      default_meta_description: settings.default_meta_description ?? "",
      default_robots: settings.default_robots ?? "index, follow",
      sitemap_enabled: settings.sitemap_enabled ?? true,
      affiliate_disclosure: settings.affiliate_disclosure ?? "",
      default_affiliate_cta: settings.default_affiliate_cta ?? "Visit website",
      twitter_handle: settings.twitter_handle ?? "",
      linkedin_url: settings.linkedin_url ?? "",
      youtube_url: settings.youtube_url ?? "",
      ai_provider: settings.ai_provider ?? "lovable",
      ai_model: settings.ai_model ?? "openai/gpt-6-astra",
      ai_default_language: settings.ai_default_language ?? "English",
      ai_default_tone: settings.ai_default_tone ?? "Natural",
      ai_default_word_count: settings.ai_default_word_count ?? 1500,
      ai_default_audience: settings.ai_default_audience ?? "US audience",
      ai_max_words: settings.ai_max_words ?? 3000,
      ai_images_enabled: settings.ai_images_enabled ?? true,
      ai_tools_enabled: settings.ai_tools_enabled ?? true,
    });
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .update({
          site_name: form.site_name.trim() || "Vistora Reviews",
          tagline: form.tagline.trim() || null,
          site_url: form.site_url.trim() || null,
          admin_email: form.admin_email.trim() || null,
          contact_email: form.contact_email.trim() || null,
          timezone: form.timezone,
          posts_per_page: Number(form.posts_per_page) || 9,
          default_category_id: form.default_category_id === "none" ? null : form.default_category_id,
          default_post_type: form.default_post_type,
          comments_enabled: form.comments_enabled,
          comments_require_approval: form.comments_require_approval,
          max_upload_mb: Number(form.max_upload_mb) || 15,
          default_seo_title: form.default_seo_title.trim() || null,
          default_meta_description: form.default_meta_description.trim() || null,
          default_robots: form.default_robots,
          sitemap_enabled: form.sitemap_enabled,
          affiliate_disclosure: form.affiliate_disclosure.trim() || null,
          default_affiliate_cta: form.default_affiliate_cta.trim() || "Visit website",
          twitter_handle: form.twitter_handle.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          youtube_url: form.youtube_url.trim() || null,
          ai_provider: form.ai_provider,
          ai_model: form.ai_model.trim() || "openai/gpt-6-astra",
          ai_default_language: form.ai_default_language,
          ai_default_tone: form.ai_default_tone,
          ai_default_word_count: Number(form.ai_default_word_count) || 1500,
          ai_default_audience: form.ai_default_audience.trim() || "US audience",
          ai_max_words: Number(form.ai_max_words) || 3000,
          ai_images_enabled: form.ai_images_enabled,
          ai_tools_enabled: form.ai_tools_enabled,
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: () => toast.error("Only editors and admins can change settings."),
  });

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AdminShell
      title="Settings"
      description="Site identity, reading, discussion, SEO and affiliate defaults."
      actions={
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
          Save changes
        </Button>
      }
    >
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="ai">AI Writer</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-5 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
          <Text label="Site name" value={form.site_name} onChange={(v) => set("site_name", v)} />
          <Text label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
          <Text label="Site URL" value={form.site_url} onChange={(v) => set("site_url", v)} placeholder="https://…" />
          <Text label="Admin email" value={form.admin_email} onChange={(v) => set("admin_email", v)} />
          <Text label="Public contact email" value={form.contact_email} onChange={(v) => set("contact_email", v)} />
          <Text label="Timezone" value={form.timezone} onChange={(v) => set("timezone", v)} />
          <Text label="X / Twitter handle" value={form.twitter_handle} onChange={(v) => set("twitter_handle", v)} />
          <Text label="LinkedIn URL" value={form.linkedin_url} onChange={(v) => set("linkedin_url", v)} />
          <Text label="YouTube URL" value={form.youtube_url} onChange={(v) => set("youtube_url", v)} />
        </TabsContent>

        <TabsContent value="reading" className="mt-5 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ppp">Posts per page</Label>
            <Input
              id="ppp"
              type="number"
              min="3"
              max="48"
              value={form.posts_per_page}
              onChange={(e) => set("posts_per_page", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label>Default category for new posts</Label>
            <Select
              value={form.default_category_id}
              onValueChange={(v) => set("default_category_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Default post type</Label>
            <Select value={form.default_post_type} onValueChange={(v) => set("default_post_type", v)}>
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
        </TabsContent>

        <TabsContent value="discussion" className="mt-5 space-y-4 rounded-xl border bg-card p-5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.comments_enabled}
              onCheckedChange={(checked) => set("comments_enabled", Boolean(checked))}
            />
            Allow readers to comment on posts
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.comments_require_approval}
              onCheckedChange={(checked) => set("comments_require_approval", Boolean(checked))}
            />
            Hold new comments for approval before they appear
          </label>
        </TabsContent>

        <TabsContent value="seo" className="mt-5 space-y-4 rounded-xl border bg-card p-5">
          <Text label="Default SEO title" value={form.default_seo_title} onChange={(v) => set("default_seo_title", v)} />
          <div className="space-y-1">
            <Label htmlFor="dmd">Default meta description</Label>
            <Textarea
              id="dmd"
              rows={3}
              value={form.default_meta_description}
              onChange={(e) => set("default_meta_description", e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Default search engine visibility</Label>
            <Select value={form.default_robots} onValueChange={(v) => set("default_robots", v)}>
              <SelectTrigger className="sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="index, follow">Index &amp; follow</SelectItem>
                <SelectItem value="noindex, nofollow">Hide from search engines</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.sitemap_enabled}
              onCheckedChange={(checked) => set("sitemap_enabled", Boolean(checked))}
            />
            Keep the sitemap available to search engines
          </label>
        </TabsContent>

        <TabsContent value="affiliate" className="mt-5 space-y-4 rounded-xl border bg-card p-5">
          <div className="space-y-1">
            <Label htmlFor="disclosure">Affiliate disclosure</Label>
            <Textarea
              id="disclosure"
              rows={4}
              value={form.affiliate_disclosure}
              onChange={(e) => set("affiliate_disclosure", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown on every review that links to a paid product.
            </p>
          </div>
          <Text
            label="Default affiliate button label"
            value={form.default_affiliate_cta}
            onChange={(v) => set("default_affiliate_cta", v)}
          />
        </TabsContent>

        <TabsContent value="media" className="mt-5 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="upl">Maximum upload size (MB)</Label>
            <Input
              id="upl"
              type="number"
              min="1"
              max="50"
              value={form.max_upload_mb}
              onChange={(e) => set("max_upload_mb", Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Images are stored securely and only JPG, PNG, WEBP and GIF files are accepted.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-5 space-y-5">
          <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>AI provider</Label>
              <Select
                value={form.ai_provider}
                onValueChange={(v) => set("ai_provider", v)}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable">Built-in AI (recommended)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Credentials stay on the server and are never exposed to visitors.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ai-model">Model</Label>
              <Input
                id="ai-model"
                value={form.ai_model}
                onChange={(e) => set("ai_model", e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-1">
              <Label>Default language</Label>
              <Select
                value={form.ai_default_language}
                onValueChange={(v) => set("ai_default_language", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Bengali">Bengali</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Default tone</Label>
              <Select value={form.ai_default_tone} onValueChange={(v) => set("ai_default_tone", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Natural", "Professional", "Conversational", "Friendly", "Informative", "Expert", "Casual"].map(
                    (tone) => (
                      <SelectItem key={tone} value={tone}>
                        {tone}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ai-words">Default word count</Label>
              <Input
                id="ai-words"
                type="number"
                min="300"
                max="6000"
                value={form.ai_default_word_count}
                onChange={(e) => set("ai_default_word_count", Number(e.target.value))}
              />
            </div>
            <Text
              label="Default audience"
              value={form.ai_default_audience}
              onChange={(v) => set("ai_default_audience", v)}
            />
            <div className="space-y-1">
              <Label htmlFor="ai-max">Maximum generation length (words)</Label>
              <Input
                id="ai-max"
                type="number"
                min="500"
                max="6000"
                value={form.ai_max_words}
                onChange={(e) => set("ai_max_words", Number(e.target.value))}
                disabled={!isAdmin}
              />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.ai_images_enabled}
                onCheckedChange={(checked) => set("ai_images_enabled", Boolean(checked))}
              />
              Allow AI-generated featured images
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.ai_tools_enabled}
                onCheckedChange={(checked) => set("ai_tools_enabled", Boolean(checked))}
              />
              Allow AI editing tools while writing
            </label>
            {!isAdmin ? (
              <p className="text-xs text-muted-foreground">
                Only administrators can change the AI provider, model and maximum length.
              </p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = label.replace(/[^\w]+/g, "-").toLowerCase();
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
      />
    </div>
  );
}
