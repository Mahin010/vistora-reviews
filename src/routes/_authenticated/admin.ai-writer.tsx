import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Clock,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { FeaturedImageField } from "@/components/admin/media-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  generateArticle,
  generateFeaturedImage,
  refineContent,
} from "@/lib/ai-writer.functions";
import { autoExcerpt, formatDateTime, readingTime, slugify, uniqueSlug } from "@/lib/admin/utils";

export const Route = createFileRoute("/_authenticated/admin/ai-writer")({
  head: () => ({
    meta: [{ title: "Write with AI — Vistora CMS" }, { name: "robots", content: "noindex" }],
  }),
  component: AiWriterPage,
});

const TONES = [
  "Natural",
  "Professional",
  "Conversational",
  "Friendly",
  "Informative",
  "Expert",
  "Casual",
];
const ARTICLE_TYPES = [
  "Product Review",
  "Comparison",
  "How-To Guide",
  "Listicle",
  "Tutorial",
  "Informational Article",
  "Buying Guide",
  "Software Review",
];
const WORD_COUNTS = [500, 750, 1000, 1500, 2000, 2500, 3000];

const REFINE_TOOLS: { action: string; label: string }[] = [
  { action: "improve", label: "Improve writing" },
  { action: "natural", label: "Make more natural" },
  { action: "shorten", label: "Shorten" },
  { action: "expand", label: "Expand" },
  { action: "rewrite", label: "Rewrite" },
  { action: "grammar", label: "Fix grammar" },
  { action: "intro", label: "Improve introduction" },
  { action: "conclusion", label: "Improve conclusion" },
  { action: "examples", label: "Add examples" },
  { action: "simplify", label: "Simplify" },
  { action: "conversational", label: "More conversational" },
  { action: "seo", label: "Improve SEO" },
  { action: "faq", label: "Add FAQ" },
  { action: "repetition", label: "Remove repetition" },
  { action: "tone", label: "Change tone" },
];

type Product = {
  name: string;
  website: string;
  productUrl: string;
  affiliateUrl: string;
  productType: string;
  pricing: string;
  rating: string;
  guarantee: string;
  coupon: string;
  pros: string;
  cons: string;
  keyFeatures: string;
  alternatives: string;
  whoIsItFor: string;
  extraInfo: string;
};

type Article = {
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  seo_title: string;
  meta_description: string;
  focus_keyword: string;
  secondary_keywords: string[];
  suggested_tags: string[];
  suggested_category: string;
  pros: string[];
  cons: string[];
  key_features: string[];
  alternatives: string[];
  who_is_it_for: string;
  how_it_works: string;
  verdict: string;
  faq: { question: string; answer: string }[];
  editor_notes: string[];
};

const EMPTY_PRODUCT: Product = {
  name: "",
  website: "",
  productUrl: "",
  affiliateUrl: "",
  productType: "",
  pricing: "",
  rating: "",
  guarantee: "",
  coupon: "",
  pros: "",
  cons: "",
  keyFeatures: "",
  alternatives: "",
  whoIsItFor: "",
  extraInfo: "",
};

function faqHtml(faq: { question: string; answer: string }[]) {
  if (!faq?.length) return "";
  return `<h2>Frequently asked questions</h2>${faq
    .map((item) => `<h3>${item.question}</h3><p>${item.answer}</p>`)
    .join("")}`;
}

function countWords(html: string) {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function AiWriterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();

  const generate = useServerFn(generateArticle);
  const refine = useServerFn(refineContent);
  const makeImage = useServerFn(generateFeaturedImage);

  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [audience, setAudience] = useState("US audience");
  const [language, setLanguage] = useState<"English" | "Bengali">("English");
  const [tone, setTone] = useState("Natural");
  const [articleType, setArticleType] = useState("Product Review");
  const [wordCount, setWordCount] = useState("1500");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [authorName, setAuthorName] = useState("");
  const [product, setProduct] = useState<Product>(EMPTY_PRODUCT);

  const [article, setArticle] = useState<Article | null>(null);
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    inputTokens: number | null;
    outputTokens: number | null;
    durationMs: number;
    model: string;
  } | null>(null);
  const [pendingEdit, setPendingEdit] = useState<{ label: string; html: string } | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [refineAction, setRefineAction] = useState("improve");
  const [tab, setTab] = useState("brief");

  const isReviewMode = /review|comparison|buying guide/i.test(articleType);

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["ai-generations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_generations")
        .select(
          "id, title, prompt, article_type, language, model, word_count, status, created_at, post_id, user_name, result, settings",
        )
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as {
        id: string;
        title: string | null;
        prompt: string;
        article_type: string | null;
        language: string | null;
        model: string | null;
        word_count: number | null;
        status: string;
        created_at: string;
        post_id: string | null;
        user_name: string | null;
        result: Article | null;
        settings: Record<string, unknown> | null;
      }[];
    },
  });

  const imagesEnabled = (settings as { ai_images_enabled?: boolean } | null)?.ai_images_enabled !== false;
  const toolsEnabled = (settings as { ai_tools_enabled?: boolean } | null)?.ai_tools_enabled !== false;

  const words = useMemo(() => countWords(content), [content]);

  const generation = useMutation({
    mutationFn: async () => {
      const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";
      return await generate({
        data: {
          topic: topic.trim(),
          audience: audience.trim() || "US audience",
          language,
          tone,
          articleType,
          wordCount: Math.min(6000, Math.max(300, Number(wordCount) || 1500)),
          primaryKeyword,
          secondaryKeywords,
          categoryName,
          authorName: authorName.trim() || staff?.fullName || "",
          instructions,
          product: isReviewMode ? product : EMPTY_PRODUCT,
        },
      });
    },
    onSuccess: (result) => {
      const generated = result.article as Article;
      setArticle(generated);
      setContent(`${generated.content_html}${faqHtml(generated.faq)}`);
      setGenerationId(result.generationId);
      setUsage({
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        durationMs: result.durationMs,
        model: result.model,
      });
      setUndoStack([]);
      setTab("article");
      void queryClient.invalidateQueries({ queryKey: ["ai-generations"] });
      toast.success("Article generated — review it before publishing.");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to generate the article right now."),
  });

  const refinement = useMutation({
    mutationFn: async (action: string) => {
      const result = await refine({
        data: {
          action,
          html: content,
          tone,
          language,
          keyword: primaryKeyword || article?.focus_keyword || "",
        },
      });
      return { action, html: result.html };
    },
    onSuccess: ({ action, html }) => {
      const label = REFINE_TOOLS.find((tool) => tool.action === action)?.label ?? "AI edit";
      setPendingEdit({ label, html });
    },
    onError: (error: Error) => toast.error(error.message || "That AI edit could not be applied."),
  });

  const imageGeneration = useMutation({
    mutationFn: async () =>
      await makeImage({ data: { title: article?.title || topic, hint: primaryKeyword } }),
    onSuccess: (result) => {
      setFeaturedImage(result.url);
      toast.success("Featured image generated and added to your media library.");
    },
    onError: (error: Error) => toast.error(error.message || "Unable to generate an image right now."),
  });

  async function syncTags(postId: string, names: string[]) {
    const clean = names.map((n) => n.trim()).filter(Boolean).slice(0, 8);
    if (!clean.length) return;
    const ids: string[] = [];
    for (const name of clean) {
      const slug = slugify(name);
      if (!slug) continue;
      const existing = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle();
      if (existing.data?.id) {
        ids.push(existing.data.id);
        continue;
      }
      const created = await supabase.from("tags").insert({ name, slug }).select("id").single();
      if (created.data?.id) ids.push(created.data.id);
    }
    if (ids.length) {
      await supabase.from("post_tags").insert(ids.map((tag_id) => ({ post_id: postId, tag_id })));
    }
  }

  const saveDraft = useMutation({
    mutationFn: async () => {
      if (!article) throw new Error("Generate an article first.");
      const title = article.title.trim() || topic.trim() || "Untitled post";
      const slug = await uniqueSlug(supabase, "posts", article.slug || title);
      const postType = /review|software review/i.test(articleType)
        ? "review"
        : /comparison/i.test(articleType)
          ? "comparison"
          : /guide|tutorial|how-to/i.test(articleType)
            ? "guide"
            : "article";

      const category =
        categoryId !== "none"
          ? categoryId
          : categories.find(
              (c) => c.name.toLowerCase() === (article.suggested_category ?? "").toLowerCase(),
            )?.id ?? null;

      const fromLines = (value: string) =>
        value.split("\n").map((line) => line.trim()).filter(Boolean);

      const payload = {
        title,
        slug,
        content,
        excerpt: article.excerpt?.trim() || autoExcerpt(content),
        featured_image: featuredImage,
        category_id: category,
        post_type: postType as "review" | "comparison" | "guide" | "article",
        status: "draft" as const,
        reading_time: readingTime(content),
        author_id: staff?.id ?? null,
        author_name: authorName.trim() || staff?.fullName || "Vistora Editorial",
        product_name: product.name.trim() || null,
        product_type: product.productType.trim() || null,
        product_url: (product.productUrl || product.website).trim() || null,
        affiliate_url: product.affiliateUrl.trim() || null,
        affiliate_cta_label:
          (settings as { default_affiliate_cta?: string } | null)?.default_affiliate_cta || null,
        rating: product.rating ? Number(product.rating) || null : null,
        pricing_summary: product.pricing.trim() || null,
        money_back_guarantee: product.guarantee.trim() || null,
        coupon_code: product.coupon.trim() || null,
        who_is_it_for: (product.whoIsItFor || article.who_is_it_for || "").trim() || null,
        how_it_works: article.how_it_works?.trim() || null,
        verdict: article.verdict?.trim() || null,
        pros: product.pros ? fromLines(product.pros) : article.pros ?? [],
        cons: product.cons ? fromLines(product.cons) : article.cons ?? [],
        key_features: product.keyFeatures ? fromLines(product.keyFeatures) : article.key_features ?? [],
        alternatives: product.alternatives
          ? fromLines(product.alternatives)
          : article.alternatives ?? [],
        seo_title: article.seo_title?.trim() || null,
        meta_description: article.meta_description?.trim() || null,
        focus_keyword: article.focus_keyword?.trim() || null,
        og_title: article.seo_title?.trim() || null,
        og_description: article.meta_description?.trim() || null,
        social_image: featuredImage,
      };

      const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
      if (error) throw error;
      await syncTags(data.id as string, article.suggested_tags ?? []);
      if (generationId) {
        await supabase.from("ai_generations").update({ post_id: data.id }).eq("id", generationId);
      }
      return data.id as string;
    },
    onError: (error: Error) => toast.error(error.message || "Could not save this draft."),
  });

  const deleteGeneration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_generations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("History entry deleted");
      void queryClient.invalidateQueries({ queryKey: ["ai-generations"] });
    },
    onError: () => toast.error("Could not delete that entry."),
  });

  async function saveAndOpen() {
    const id = await saveDraft.mutateAsync();
    toast.success("Draft saved — opening the post editor.");
    void navigate({ to: "/admin/posts/$id", params: { id } });
  }

  function applyPending() {
    if (!pendingEdit) return;
    setUndoStack((prev) => [...prev, content]);
    setContent(pendingEdit.html);
    setPendingEdit(null);
    toast.success("AI edit applied");
  }

  function undoEdit() {
    setUndoStack((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1]!;
      setContent(last);
      return prev.slice(0, -1);
    });
  }

  function loadHistory(entry: { id: string; result: Article | null; settings: Record<string, unknown> | null }) {
    if (!entry.result) {
      toast.error("This entry has no stored article.");
      return;
    }
    setArticle(entry.result);
    setContent(`${entry.result.content_html}${faqHtml(entry.result.faq)}`);
    setGenerationId(entry.id);
    const s = (entry.settings ?? {}) as Record<string, string>;
    if (s["topic"]) setTopic(s["topic"]);
    if (s["articleType"]) setArticleType(s["articleType"]);
    if (s["tone"]) setTone(s["tone"]);
    setTab("article");
  }

  return (
    <AdminShell
      title="Write with AI"
      description="Create a complete blog post with AI and edit it before publishing."
      actions={
        <Button
          size="sm"
          onClick={() => generation.mutate()}
          disabled={generation.isPending || topic.trim().length < 3}
        >
          {generation.isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generate article
            </>
          )}
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="brief">Content settings</TabsTrigger>
          <TabsTrigger value="article" disabled={!article}>
            Generated article
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ---------------- Brief ---------------- */}
        <TabsContent value="brief" className="mt-5 space-y-5">
          <div className="space-y-4 rounded-xl border bg-card p-5">
            <div className="space-y-1.5">
              <Label htmlFor="topic">Enter your blog title or topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="10 AI Tools That Can Help Freelancers Save Time"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructions">Additional instructions (optional)</Label>
              <Textarea
                id="instructions"
                rows={3}
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Write for a US audience. Keep the tone natural, practical, and easy to understand."
              />
            </div>
          </div>

          <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
            <Field label="Target audience">
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} />
            </Field>
            <Field label="Content language">
              <Select value={language} onValueChange={(v) => setLanguage(v as "English" | "Bengali")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Bengali">Bengali</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Writing tone">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Article type">
              <Select value={articleType} onValueChange={setArticleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_TYPES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Target word count">
              <div className="flex gap-2">
                <Select value={WORD_COUNTS.includes(Number(wordCount)) ? wordCount : "custom"} onValueChange={(v) => v !== "custom" && setWordCount(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORD_COUNTS.map((item) => (
                      <SelectItem key={item} value={String(item)}>
                        {item} words
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={300}
                  max={6000}
                  value={wordCount}
                  onChange={(e) => setWordCount(e.target.value)}
                  className="w-28"
                  aria-label="Custom word count"
                />
              </div>
            </Field>
            <Field label="Primary keyword">
              <Input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} />
            </Field>
            <Field label="Secondary keywords">
              <Input
                value={secondaryKeywords}
                onChange={(e) => setSecondaryKeywords(e.target.value)}
                placeholder="Comma separated"
              />
            </Field>
            <Field label="Category">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Let AI suggest</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Author">
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={staff?.fullName || "Vistora Editorial"}
              />
            </Field>
          </div>

          {isReviewMode ? (
            <div className="space-y-4 rounded-xl border bg-card p-5">
              <div>
                <h2 className="text-sm font-semibold">Product review details</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI only states product facts you supply here. Anything you leave blank is written
                  around or flagged for editor review — never invented.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name">
                  <Input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
                </Field>
                <Field label="Product type">
                  <Input
                    value={product.productType}
                    onChange={(e) => setProduct({ ...product, productType: e.target.value })}
                  />
                </Field>
                <Field label="Product website">
                  <Input value={product.website} onChange={(e) => setProduct({ ...product, website: e.target.value })} />
                </Field>
                <Field label="Product URL">
                  <Input
                    value={product.productUrl}
                    onChange={(e) => setProduct({ ...product, productUrl: e.target.value })}
                  />
                </Field>
                <Field label="Affiliate URL">
                  <Input
                    value={product.affiliateUrl}
                    onChange={(e) => setProduct({ ...product, affiliateUrl: e.target.value })}
                  />
                </Field>
                <Field label="Pricing">
                  <Input value={product.pricing} onChange={(e) => setProduct({ ...product, pricing: e.target.value })} />
                </Field>
                <Field label="Rating (0–5)">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={product.rating}
                    onChange={(e) => setProduct({ ...product, rating: e.target.value })}
                  />
                </Field>
                <Field label="Money-back guarantee">
                  <Input
                    value={product.guarantee}
                    onChange={(e) => setProduct({ ...product, guarantee: e.target.value })}
                  />
                </Field>
                <Field label="Coupon code">
                  <Input value={product.coupon} onChange={(e) => setProduct({ ...product, coupon: e.target.value })} />
                </Field>
                <Field label="Who is it for?">
                  <Input
                    value={product.whoIsItFor}
                    onChange={(e) => setProduct({ ...product, whoIsItFor: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Pros (one per line)">
                  <Textarea rows={4} value={product.pros} onChange={(e) => setProduct({ ...product, pros: e.target.value })} />
                </Field>
                <Field label="Cons (one per line)">
                  <Textarea rows={4} value={product.cons} onChange={(e) => setProduct({ ...product, cons: e.target.value })} />
                </Field>
                <Field label="Key features (one per line)">
                  <Textarea
                    rows={4}
                    value={product.keyFeatures}
                    onChange={(e) => setProduct({ ...product, keyFeatures: e.target.value })}
                  />
                </Field>
                <Field label="Alternatives (one per line)">
                  <Textarea
                    rows={4}
                    value={product.alternatives}
                    onChange={(e) => setProduct({ ...product, alternatives: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Additional product information">
                <Textarea
                  rows={3}
                  value={product.extraInfo}
                  onChange={(e) => setProduct({ ...product, extraInfo: e.target.value })}
                />
              </Field>
            </div>
          ) : null}

          {generation.isError ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{(generation.error as Error).message}</p>
              <Button size="sm" variant="outline" onClick={() => generation.mutate()}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : null}

          {generation.isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Generating your article… this usually takes
              under a minute.
            </p>
          ) : null}

          <div className="sticky bottom-3 z-20 lg:hidden">
            <Button
              className="w-full"
              size="lg"
              onClick={() => generation.mutate()}
              disabled={generation.isPending || topic.trim().length < 3}
            >
              {generation.isPending ? "Generating…" : "Generate article"}
            </Button>
          </div>
        </TabsContent>

        {/* ---------------- Generated article ---------------- */}
        <TabsContent value="article" className="mt-5 space-y-5">
          {article ? (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{articleType}</Badge>
                    <span>{words} words</span>
                    <span>·</span>
                    <span>{readingTime(content)} min read</span>
                    {usage ? (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {(usage.durationMs / 1000).toFixed(1)}s
                        </span>
                        {usage.inputTokens != null ? (
                          <span>· {(usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)} tokens</span>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                  <Input
                    className="mt-3 h-11 text-base font-semibold"
                    value={article.title}
                    onChange={(e) => setArticle({ ...article, title: e.target.value })}
                    aria-label="Article title"
                  />
                  {article.editor_notes?.length ? (
                    <ul className="mt-3 list-disc space-y-1 rounded-lg bg-muted/50 p-3 pl-6 text-xs text-muted-foreground">
                      {article.editor_notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {toolsEnabled ? (
                  <div className="space-y-3 rounded-xl border bg-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={refineAction} onValueChange={setRefineAction}>
                        <SelectTrigger className="w-full sm:w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REFINE_TOOLS.map((tool) => (
                            <SelectItem key={tool.action} value={tool.action}>
                              {tool.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refinement.mutate(refineAction)}
                        disabled={refinement.isPending || !content}
                      >
                        {refinement.isPending ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Working…
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Run AI edit
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={undoEdit}
                        disabled={!undoStack.length}
                      >
                        Undo
                      </Button>
                    </div>
                    {pendingEdit ? (
                      <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
                        <p className="text-xs font-medium">
                          {pendingEdit.label}: preview ready ({countWords(pendingEdit.html)} words)
                        </p>
                        <div
                          className="max-h-56 overflow-y-auto rounded border bg-background p-3 text-xs"
                          // Sanitized on the server before it reaches the browser.
                          dangerouslySetInnerHTML={{ __html: pendingEdit.html }}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={applyPending}>
                            Apply
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setPendingEdit(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <RichTextEditor value={content} onChange={setContent} />
              </div>

              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border bg-card p-4">
                  <h2 className="text-sm font-semibold">Featured image</h2>
                  <FeaturedImageField value={featuredImage} onChange={setFeaturedImage} />
                  {imagesEnabled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => imageGeneration.mutate()}
                      disabled={imageGeneration.isPending}
                    >
                      {imageGeneration.isPending ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating image…
                        </>
                      ) : (
                        <>
                          <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> Generate featured image
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-xl border bg-card p-4">
                  <h2 className="text-sm font-semibold">SEO</h2>
                  <Field label="SEO title">
                    <Input
                      value={article.seo_title}
                      onChange={(e) => setArticle({ ...article, seo_title: e.target.value })}
                    />
                  </Field>
                  <Field label="Meta description">
                    <Textarea
                      rows={3}
                      value={article.meta_description}
                      onChange={(e) => setArticle({ ...article, meta_description: e.target.value })}
                    />
                  </Field>
                  <Field label="URL slug">
                    <Input
                      value={article.slug}
                      onChange={(e) => setArticle({ ...article, slug: slugify(e.target.value) })}
                    />
                  </Field>
                  <Field label="Focus keyword">
                    <Input
                      value={article.focus_keyword}
                      onChange={(e) => setArticle({ ...article, focus_keyword: e.target.value })}
                    />
                  </Field>
                  <Field label="Excerpt">
                    <Textarea
                      rows={3}
                      value={article.excerpt}
                      onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
                    />
                  </Field>
                  {article.suggested_tags?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {article.suggested_tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {article.suggested_category ? (
                    <p className="text-xs text-muted-foreground">
                      Suggested category: {article.suggested_category}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 rounded-xl border bg-card p-4">
                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      saveDraft.mutate(undefined, {
                        onSuccess: () => {
                          toast.success("Saved to Posts → Drafts");
                          void queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
                        },
                      })
                    }
                    disabled={saveDraft.isPending}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {saveDraft.isPending ? "Saving…" : "Save as draft"}
                  </Button>
                  <Button className="w-full" size="sm" onClick={saveAndOpen} disabled={saveDraft.isPending}>
                    Open in post editor
                  </Button>
                  <Button
                    className="w-full"
                    size="sm"
                    variant="ghost"
                    onClick={() => generation.mutate()}
                    disabled={generation.isPending}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Regenerate
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Publishing happens in the post editor, so every AI draft passes an editorial review
                    first.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* ---------------- History ---------------- */}
        <TabsContent value="history" className="mt-5">
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Words</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Created</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                      No AI generations yet.
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="p-3">
                        <p className="font-medium">{entry.title || entry.prompt}</p>
                        <p className="text-xs text-muted-foreground">{entry.status}</p>
                      </td>
                      <td className="p-3 text-xs">{entry.article_type ?? "—"}</td>
                      <td className="p-3 text-xs">{entry.word_count ?? "—"}</td>
                      <td className="p-3 text-xs">{entry.model ?? "—"}</td>
                      <td className="p-3 text-xs">{formatDateTime(entry.created_at)}</td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => loadHistory(entry)}>
                            Continue editing
                          </Button>
                          {entry.post_id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                navigate({
                                  to: "/admin/posts/$id",
                                  params: { id: entry.post_id as string },
                                })
                              }
                            >
                              Open post
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Delete history entry"
                            onClick={() => deleteGeneration.mutate(entry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
