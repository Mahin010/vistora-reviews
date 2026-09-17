export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent: string | null;
  sort_order: number;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type PostStatus = "draft" | "published" | "scheduled";
export type PostType = "review" | "comparison" | "guide" | "article";

export type PostCardData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  post_type: PostType;
  published_at: string | null;
  reading_time: number;
  view_count: number;
  rating: number | null;
  product_name: string | null;
  category: { name: string; slug: string } | null;
};

export type Post = PostCardData & {
  content: string;
  author_title: string | null;
  author_bio: string | null;
  status: PostStatus;
  is_featured: boolean;
  seo_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  product_url: string | null;
  affiliate_url: string | null;
  affiliate_cta_label: string | null;
  pros: string[];
  cons: string[];
  key_features: string[];
  alternatives: string[];
  pricing_summary: string | null;
  who_is_it_for: string | null;
  how_it_works: string | null;
  verdict: string | null;
  category_id: string | null;
};

export type Comment = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
};
