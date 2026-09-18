import { createOpenAI } from "@ai-sdk/openai";
import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayRunIdFetch, lovableApiKey } from "@/lib/ai-gateway.server";
import { sanitizeHtml, slugify } from "@/lib/admin/utils";

const MODEL = "openai/gpt-6-astra";
const IMAGE_MODEL = "lovable/image-standard";

/** Server-side role check — frontend role checks are never trusted on their own. */
async function requireStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("Unable to verify your account permissions.");
  const roles = ((data ?? []) as { role: string }[]).map((r) => r.role);
  if (!roles.some((role) => role === "admin" || role === "editor" || role === "author")) {
    throw new Error("You do not have permission to use the AI writer.");
  }
  return { roles, canManageAll: roles.includes("admin") || roles.includes("editor") };
}

function gateway() {
  const key = lovableApiKey();
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch as unknown as typeof fetch,
  });
}

const REASONING = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

const SYSTEM_PROMPT = `You are the senior editorial writer for Vistora Reviews, a digital product review publication.

Write useful, original editorial content that a human editor will review before publishing.

Rules you must always follow:
- Understand the topic before writing; answer the reader's real question.
- Never invent facts. Never invent pricing, discounts, coupon codes, ratings, customer counts, revenue figures, product features, integrations, money-back guarantees, company claims, performance results, statistics, quotes, or personal testing experiences.
- Only use product facts supplied in the brief. If a needed detail is missing, write around it or add an inline editor note in the form <p><em>[Editor note: confirm ...]</em></p>.
- Never claim you personally tested a product unless the brief explicitly says testing happened.
- Never say "as an AI". Never claim the text is human-written or undetectable.
- Avoid filler openings such as "In today's fast-paced world", "In the ever-evolving digital landscape", or "Whether you're a beginner or an expert" unless genuinely relevant.
- Avoid keyword stuffing, repetition, generic padding, robotic phrasing, and an excessive number of headings.
- Use varied sentence structure, concise paragraphs, natural transitions, specific examples and clear explanations of technical concepts.
- Use US English when the language is English; write fully in Bengali when the language is Bengali.
- Use the primary keyword naturally in the title, introduction, one or two headings, the body and the conclusion.

Output the article body as clean semantic HTML using only these tags: h2, h3, p, ul, ol, li, strong, em, blockquote, a, table, thead, tbody, tr, th, td, br.
Do not include the article title as a heading in the body, and do not wrap the HTML in code fences.
Choose the structure that fits the topic — do not force irrelevant sections.`;

const faqSchema = z.object({ question: z.string(), answer: z.string() });

const articleSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  content_html: z.string(),
  seo_title: z.string(),
  meta_description: z.string(),
  focus_keyword: z.string(),
  secondary_keywords: z.array(z.string()),
  suggested_tags: z.array(z.string()),
  suggested_category: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  key_features: z.array(z.string()),
  alternatives: z.array(z.string()),
  who_is_it_for: z.string(),
  how_it_works: z.string(),
  verdict: z.string(),
  faq: z.array(faqSchema),
  editor_notes: z.array(z.string()),
});

const briefSchema = z.object({
  topic: z.string().min(3),
  audience: z.string().default("US audience"),
  language: z.enum(["English", "Bengali"]).default("English"),
  tone: z.string().default("Natural"),
  articleType: z.string().default("Informational Article"),
  wordCount: z.number().int().min(300).max(6000).default(1500),
  primaryKeyword: z.string().default(""),
  secondaryKeywords: z.string().default(""),
  categoryName: z.string().default(""),
  authorName: z.string().default(""),
  instructions: z.string().default(""),
  product: z
    .object({
      name: z.string().default(""),
      website: z.string().default(""),
      productUrl: z.string().default(""),
      affiliateUrl: z.string().default(""),
      productType: z.string().default(""),
      pricing: z.string().default(""),
      rating: z.string().default(""),
      guarantee: z.string().default(""),
      coupon: z.string().default(""),
      pros: z.string().default(""),
      cons: z.string().default(""),
      keyFeatures: z.string().default(""),
      alternatives: z.string().default(""),
      whoIsItFor: z.string().default(""),
      extraInfo: z.string().default(""),
    })
    .default({}),
});

export type ArticleBrief = z.infer<typeof briefSchema>;

function briefToPrompt(brief: ArticleBrief) {
  const p = brief.product;
  const supplied = Object.entries({
    "Product name": p.name,
    "Product website": p.website,
    "Product page URL": p.productUrl,
    "Affiliate URL": p.affiliateUrl,
    "Product type": p.productType,
    Pricing: p.pricing,
    Rating: p.rating,
    "Money-back guarantee": p.guarantee,
    "Coupon code": p.coupon,
    Pros: p.pros,
    Cons: p.cons,
    "Key features": p.keyFeatures,
    Alternatives: p.alternatives,
    "Who is it for": p.whoIsItFor,
    "Additional product information": p.extraInfo,
  })
    .filter(([, value]) => value && String(value).trim())
    .map(([label, value]) => `- ${label}: ${String(value).trim()}`)
    .join("\n");

  const isReview = /review|comparison|buying guide/i.test(brief.articleType);

  return [
    `Topic or working title: ${brief.topic}`,
    `Article type: ${brief.articleType}`,
    `Language: ${brief.language}`,
    `Target audience: ${brief.audience || "US audience"}`,
    `Writing tone: ${brief.tone}`,
    `Target length: about ${brief.wordCount} words (stay within ±10%).`,
    brief.primaryKeyword ? `Primary keyword: ${brief.primaryKeyword}` : "",
    brief.secondaryKeywords ? `Secondary keywords: ${brief.secondaryKeywords}` : "",
    brief.categoryName ? `Site category: ${brief.categoryName}` : "",
    brief.authorName ? `Byline: ${brief.authorName}` : "",
    brief.instructions ? `Additional instructions from the editor: ${brief.instructions}` : "",
    supplied ? `Verified product facts supplied by the editor (the ONLY product facts you may state):\n${supplied}` : "",
    isReview
      ? `Use a review structure where relevant: introduction, what the product is, key features, how it works, main benefits, pros, cons, pricing, who should use it, who should avoid it, alternatives, final verdict, FAQs. Skip any section you have no supplied facts for, or mark it with an editor note.`
      : `Choose a structure that fits the topic: introduction, key points, detailed sections with H2/H3, examples, practical advice, conclusion, and an FAQ section when it genuinely helps.`,
    `Return arrays empty and strings empty for fields that do not apply. Never fabricate values for pros, cons, features, pricing, ratings or alternatives that were not supplied.`,
    `Slug: short, lowercase, hyphenated, SEO friendly.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function friendlyAiError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (/not configured|LOVABLE_API_KEY/i.test(message)) throw new Error("AI service is not configured.");
  if (/402|credit/i.test(message))
    throw new Error("AI credits are exhausted. Add credits in workspace settings and try again.");
  if (/401|403|unauthor/i.test(message)) throw new Error("Invalid AI configuration.");
  if (/429|rate/i.test(message)) throw new Error("Too many AI requests right now. Please retry in a moment.");
  if (/abort|timeout|timed out/i.test(message)) throw new Error("Your AI request timed out. Please try again.");
  console.error("[ai-writer]", message);
  throw new Error("Unable to generate the article right now.");
}

export const generateArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => briefSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const started = Date.now();

    try {
      const lovable = gateway();
      const result = streamText({
        model: lovable.responses(MODEL),
        system: SYSTEM_PROMPT,
        prompt: briefToPrompt(data),
        output: Output.object({ schema: articleSchema }),
        providerOptions: REASONING as never,
      });

      const article = await result.output;
      const usage = await result.usage;

      const content = sanitizeHtml(article.content_html ?? "");
      const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      const payload = {
        ...article,
        content_html: content,
        slug: slugify(article.slug || article.title),
      };

      const { data: row } = await (context as never as { supabase: any }).supabase
        .from("ai_generations")
        .insert({
          user_id: (context as never as { userId: string }).userId,
          prompt: data.topic,
          title: payload.title,
          article_type: data.articleType,
          language: data.language,
          tone: data.tone,
          target_word_count: data.wordCount,
          word_count: words,
          model: MODEL,
          status: "completed",
          settings: data as never,
          result: payload as never,
          input_tokens: usage?.inputTokens ?? null,
          output_tokens: usage?.outputTokens ?? null,
          duration_ms: Date.now() - started,
        })
        .select("id")
        .single();

      return {
        generationId: (row?.id as string) ?? null,
        article: payload,
        wordCount: words,
        model: MODEL,
        durationMs: Date.now() - started,
        inputTokens: usage?.inputTokens ?? null,
        outputTokens: usage?.outputTokens ?? null,
      };
    } catch (error) {
      friendlyAiError(error);
    }
  });

const REFINE_ACTIONS: Record<string, string> = {
  improve: "Improve the writing: sharper phrasing, better flow, same meaning and facts.",
  natural: "Make the writing sound more natural and human, less formulaic.",
  shorten: "Shorten it by roughly 30% without losing substance.",
  expand: "Expand it with genuinely useful detail and specifics — no filler, no invented facts.",
  rewrite: "Rewrite it from scratch with the same meaning, structure and facts.",
  grammar: "Fix grammar, spelling and punctuation only. Keep the wording otherwise intact.",
  intro: "Improve only the introduction so it is specific and compelling; leave the rest unchanged.",
  conclusion: "Improve only the conclusion so it is concrete and useful; leave the rest unchanged.",
  examples: "Add practical, realistic examples where they help. Do not invent statistics or product facts.",
  simplify: "Simplify the language so it is easy to read, without dumbing down the substance.",
  conversational: "Make the tone more conversational while staying professional.",
  seo: "Improve on-page SEO naturally: headings, keyword placement, scannability. No keyword stuffing.",
  faq: "Append a concise FAQ section as an H2 with question H3s answering real reader questions.",
  repetition: "Remove repetition and redundant sentences.",
  tone: "Rewrite in the requested tone.",
};

export const refineContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        action: z.string(),
        html: z.string().min(1).max(120000),
        tone: z.string().default(""),
        language: z.string().default("English"),
        keyword: z.string().default(""),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const instruction = REFINE_ACTIONS[data.action] ?? REFINE_ACTIONS["improve"]!;

    try {
      const lovable = gateway();
      const result = streamText({
        model: lovable.responses(MODEL),
        system: `${SYSTEM_PROMPT}\n\nYou are now editing existing HTML content. Return ONLY the edited HTML fragment, with no commentary and no code fences. Preserve all supplied facts, links and existing structure unless the instruction requires changing it.`,
        prompt: [
          `Instruction: ${instruction}`,
          data.tone ? `Requested tone: ${data.tone}` : "",
          `Language: ${data.language}`,
          data.keyword ? `Primary keyword: ${data.keyword}` : "",
          "",
          "HTML to edit:",
          data.html,
        ]
          .filter(Boolean)
          .join("\n"),
        providerOptions: REASONING as never,
      });

      const text = await result.text;
      const cleaned = text
        .replace(/^```[a-z]*\n?/i, "")
        .replace(/```$/i, "")
        .trim();
      if (!cleaned) throw new Error("empty");
      return { html: sanitizeHtml(cleaned) };
    } catch (error) {
      friendlyAiError(error);
    }
  });

export const generateFeaturedImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ title: z.string().min(3), hint: z.string().default("") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as never as { supabase: any; userId: string };
    await requireStaff(ctx);
    const key = lovableApiKey();

    const prompt = [
      `Professional editorial blog featured image for an article titled "${data.title}".`,
      data.hint,
      "Clean modern tech-publication style, abstract or conceptual illustration, balanced composition, soft lighting, no text, no logos, no watermarks, no misleading screenshots.",
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1, size: "1536x1024" }),
      });

      if (!response.ok) {
        const status = response.status;
        console.error("[ai-writer:image]", status, await response.text().catch(() => ""));
        if (status === 402) throw new Error("AI credits are exhausted. Add credits and try again.");
        if (status === 401 || status === 403) throw new Error("Invalid AI configuration.");
        if (status === 404) throw new Error("AI image generation is not available for this project.");
        throw new Error("Unable to generate an image right now.");
      }

      const payload = (await response.json()) as {
        data?: { b64_json?: string; url?: string }[];
      };
      const first = payload.data?.[0];
      let bytes: Uint8Array;
      if (first?.b64_json) {
        const binary = atob(first.b64_json);
        bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      } else if (first?.url) {
        bytes = new Uint8Array(await (await fetch(first.url)).arrayBuffer());
      } else {
        throw new Error("Unable to generate an image right now.");
      }

      const path = `featured/${new Date().getFullYear()}/${Date.now()}-${slugify(data.title) || "ai-image"}.png`;
      const upload = await ctx.supabase.storage
        .from("media")
        .upload(path, bytes, { contentType: "image/png", upsert: false });
      if (upload.error) throw new Error("The generated image could not be saved to your media library.");

      const signed = await ctx.supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      const url = signed.data?.signedUrl ?? "";

      await ctx.supabase.from("media").insert({
        file_name: `${slugify(data.title) || "ai-image"}.png`,
        storage_path: path,
        url,
        title: data.title,
        alt_text: data.title,
        mime_type: "image/png",
        size_bytes: bytes.byteLength,
        folder: "featured",
        uploaded_by: ctx.userId,
      });

      return { url, path };
    } catch (error) {
      friendlyAiError(error);
    }
  });
