import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Category, Comment, Post, PostCardData } from "./types";

const CARD_FIELDS =
  "id, title, slug, excerpt, featured_image, author_name, post_type, published_at, reading_time, view_count, rating, product_name, category:categories(name, slug)";

const PAGE_SIZE = 9;

function publicClient(): SupabaseClient {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input as RequestInfo, { ...init, headers });
      },
    },
  });
}

function publishedQuery(db: SupabaseClient) {
  return db
    .from("posts")
    .select(CARD_FIELDS)
    .in("status", ["published", "scheduled"])
    .lte("published_at", new Date().toISOString())
    .is("trashed_at", null);
}

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();

  const [featured, latestReviews, popular, latestArticles, comparisons, categories] =
    await Promise.all([
      publishedQuery(db).eq("is_featured", true).order("published_at", { ascending: false }).limit(1),
      publishedQuery(db).eq("post_type", "review").order("published_at", { ascending: false }).limit(6),
      publishedQuery(db).order("view_count", { ascending: false }).limit(5),
      publishedQuery(db).order("published_at", { ascending: false }).limit(6),
      publishedQuery(db).eq("post_type", "comparison").order("published_at", { ascending: false }).limit(3),
      db.from("categories").select("*").order("sort_order"),
    ]);

  return {
    featured: (featured.data?.[0] ?? null) as PostCardData | null,
    latestReviews: (latestReviews.data ?? []) as unknown as PostCardData[],
    popular: (popular.data ?? []) as unknown as PostCardData[],
    latestArticles: (latestArticles.data ?? []) as unknown as PostCardData[],
    comparisons: (comparisons.data ?? []) as unknown as PostCardData[],
    categories: (categories.data ?? []) as Category[],
  };
});

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      categorySlug?: string | undefined;
      postType?: string | undefined;
      page?: number | undefined;
      pageSize?: number | undefined;
    }) => input,
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const page = Math.max(1, data.page ?? 1);
    const size = data.pageSize ?? PAGE_SIZE;
    const from = (page - 1) * size;

    let categoryId: string | null = null;
    let category: Category | null = null;
    if (data.categorySlug) {
      const res = await db.from("categories").select("*").eq("slug", data.categorySlug).maybeSingle();
      category = (res.data ?? null) as Category | null;
      categoryId = category?.id ?? null;
    }

    let query = db
      .from("posts")
      .select(CARD_FIELDS, { count: "exact" })
      .in("status", ["published", "scheduled"])
      .lte("published_at", new Date().toISOString())
    .is("trashed_at", null);

    if (categoryId) query = query.eq("category_id", categoryId);
    if (data.postType) query = query.eq("post_type", data.postType);

    const { data: rows, count } = await query
      .order("published_at", { ascending: false })
      .range(from, from + size - 1);

    return {
      posts: (rows ?? []) as unknown as PostCardData[],
      total: count ?? 0,
      page,
      pageSize: size,
      category,
    };
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: post } = await db
      .from("posts")
      .select(`*, category:categories(name, slug)`)
      .eq("slug", data.slug)
      .in("status", ["published", "scheduled"])
      .lte("published_at", new Date().toISOString())
    .is("trashed_at", null)
      .maybeSingle();

    if (!post) return { post: null, related: [] as PostCardData[], comments: [] as Comment[] };

    const typed = post as unknown as Post & { category_id: string | null };

    const [related, comments] = await Promise.all([
      typed.category_id
        ? publishedQuery(db)
            .eq("category_id", typed.category_id)
            .neq("id", typed.id)
            .order("published_at", { ascending: false })
            .limit(3)
        : publishedQuery(db).neq("id", typed.id).order("published_at", { ascending: false }).limit(3),
      db
        .from("comments")
        .select("id, author_name, content, created_at")
        .eq("post_id", typed.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false }),
    ]);

    return {
      post: typed as Post,
      related: (related.data ?? []) as unknown as PostCardData[],
      comments: (comments.data ?? []) as Comment[],
    };
  });

export const searchPosts = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      q?: string | undefined;
      categorySlug?: string | undefined;
      product?: string | undefined;
      page?: number | undefined;
    }) => input,
  )
  .handler(async ({ data }) => {
    const db = publicClient();
    const page = Math.max(1, data.page ?? 1);
    const size = 10;
    const from = (page - 1) * size;

    let query = db
      .from("posts")
      .select(CARD_FIELDS, { count: "exact" })
      .in("status", ["published", "scheduled"])
      .lte("published_at", new Date().toISOString())
    .is("trashed_at", null);

    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) {
        query = query.or(
          `title.ilike.%${term}%,excerpt.ilike.%${term}%,product_name.ilike.%${term}%,focus_keyword.ilike.%${term}%`,
        );
      }
    }
    if (data.product) query = query.ilike("product_name", `%${data.product}%`);

    if (data.categorySlug) {
      const res = await db.from("categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      const id = (res.data as { id: string } | null)?.id;
      if (id) query = query.eq("category_id", id);
    }

    const { data: rows, count } = await query
      .order("published_at", { ascending: false })
      .range(from, from + size - 1);

    const categories = await db.from("categories").select("*").order("sort_order");

    return {
      posts: (rows ?? []) as unknown as PostCardData[],
      total: count ?? 0,
      page,
      pageSize: size,
      categories: (categories.data ?? []) as Category[],
    };
  });

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const { data } = await db.from("categories").select("*").order("sort_order");
  return (data ?? []) as Category[];
});

export const listAllSlugs = createServerFn({ method: "GET" }).handler(async () => {
  const db = publicClient();
  const { data } = await db
    .from("posts")
    .select("slug, updated_at")
    .in("status", ["published", "scheduled"])
    .lte("published_at", new Date().toISOString())
    .is("trashed_at", null);
  return (data ?? []) as { slug: string; updated_at: string }[];
});
