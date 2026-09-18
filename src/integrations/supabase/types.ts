export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_generations: {
        Row: {
          article_type: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          input_tokens: number | null
          language: string | null
          model: string | null
          output_tokens: number | null
          post_id: string | null
          prompt: string
          result: Json | null
          settings: Json
          status: string
          target_word_count: number | null
          title: string | null
          tone: string | null
          user_id: string | null
          user_name: string | null
          word_count: number | null
        }
        Insert: {
          article_type?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          language?: string | null
          model?: string | null
          output_tokens?: number | null
          post_id?: string | null
          prompt: string
          result?: Json | null
          settings?: Json
          status?: string
          target_word_count?: number | null
          title?: string | null
          tone?: string | null
          user_id?: string | null
          user_name?: string | null
          word_count?: number | null
        }
        Update: {
          article_type?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          language?: string | null
          model?: string | null
          output_tokens?: number | null
          post_id?: string | null
          prompt?: string
          result?: Json | null
          settings?: Json
          status?: string
          target_word_count?: number | null
          title?: string | null
          tone?: string | null
          user_id?: string | null
          user_name?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          accent: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_email: string | null
          author_name: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          post_id: string
          status: string
        }
        Insert: {
          author_email?: string | null
          author_name: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_id: string
          status?: string
        }
        Update: {
          author_email?: string | null
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          post_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_handled: boolean
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_handled?: boolean
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_handled?: boolean
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          description: string | null
          file_name: string
          folder: string | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string | null
          title: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          title?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          title?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      post_revisions: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          excerpt: string | null
          id: string
          post_id: string
          snapshot: Json
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          excerpt?: string | null
          id?: string
          post_id: string
          snapshot?: Json
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          excerpt?: string | null
          id?: string
          post_id?: string
          snapshot?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          affiliate_cta_label: string | null
          affiliate_url: string | null
          alternatives: string[]
          author_bio: string | null
          author_id: string | null
          author_name: string
          author_title: string | null
          canonical_url: string | null
          category_id: string | null
          cons: string[]
          content: string
          coupon_code: string | null
          coupon_url: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          focus_keyword: string | null
          how_it_works: string | null
          id: string
          is_featured: boolean
          key_features: string[]
          meta_description: string | null
          money_back_guarantee: string | null
          og_description: string | null
          og_title: string | null
          post_type: Database["public"]["Enums"]["post_type"]
          pricing_summary: string | null
          product_name: string | null
          product_type: string | null
          product_url: string | null
          pros: string[]
          published_at: string | null
          rating: number | null
          reading_time: number
          robots_meta: string | null
          seo_title: string | null
          slug: string
          social_image: string | null
          status: Database["public"]["Enums"]["post_status"]
          title: string
          trashed_at: string | null
          updated_at: string
          verdict: string | null
          view_count: number
          who_is_it_for: string | null
        }
        Insert: {
          affiliate_cta_label?: string | null
          affiliate_url?: string | null
          alternatives?: string[]
          author_bio?: string | null
          author_id?: string | null
          author_name?: string
          author_title?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cons?: string[]
          content?: string
          coupon_code?: string | null
          coupon_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          how_it_works?: string | null
          id?: string
          is_featured?: boolean
          key_features?: string[]
          meta_description?: string | null
          money_back_guarantee?: string | null
          og_description?: string | null
          og_title?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          pricing_summary?: string | null
          product_name?: string | null
          product_type?: string | null
          product_url?: string | null
          pros?: string[]
          published_at?: string | null
          rating?: number | null
          reading_time?: number
          robots_meta?: string | null
          seo_title?: string | null
          slug: string
          social_image?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          trashed_at?: string | null
          updated_at?: string
          verdict?: string | null
          view_count?: number
          who_is_it_for?: string | null
        }
        Update: {
          affiliate_cta_label?: string | null
          affiliate_url?: string | null
          alternatives?: string[]
          author_bio?: string | null
          author_id?: string | null
          author_name?: string
          author_title?: string | null
          canonical_url?: string | null
          category_id?: string | null
          cons?: string[]
          content?: string
          coupon_code?: string | null
          coupon_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          how_it_works?: string | null
          id?: string
          is_featured?: boolean
          key_features?: string[]
          meta_description?: string | null
          money_back_guarantee?: string | null
          og_description?: string | null
          og_title?: string | null
          post_type?: Database["public"]["Enums"]["post_type"]
          pricing_summary?: string | null
          product_name?: string | null
          product_type?: string | null
          product_url?: string | null
          pros?: string[]
          published_at?: string | null
          rating?: number | null
          reading_time?: number
          robots_meta?: string | null
          seo_title?: string | null
          slug?: string
          social_image?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          trashed_at?: string | null
          updated_at?: string
          verdict?: string | null
          view_count?: number
          who_is_it_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          admin_email: string | null
          affiliate_disclosure: string | null
          ai_default_audience: string | null
          ai_default_language: string | null
          ai_default_tone: string | null
          ai_default_word_count: number | null
          ai_images_enabled: boolean | null
          ai_max_words: number | null
          ai_model: string | null
          ai_provider: string | null
          ai_tools_enabled: boolean | null
          comments_enabled: boolean
          comments_require_approval: boolean
          contact_email: string | null
          default_affiliate_cta: string | null
          default_category_id: string | null
          default_meta_description: string | null
          default_post_type: string | null
          default_robots: string | null
          default_seo_title: string | null
          favicon_url: string | null
          footer_text: string | null
          id: number
          linkedin_url: string | null
          logo_url: string | null
          max_upload_mb: number
          posts_per_page: number
          site_name: string
          site_url: string | null
          sitemap_enabled: boolean
          social_image: string | null
          tagline: string | null
          timezone: string | null
          twitter_handle: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          admin_email?: string | null
          affiliate_disclosure?: string | null
          ai_default_audience?: string | null
          ai_default_language?: string | null
          ai_default_tone?: string | null
          ai_default_word_count?: number | null
          ai_images_enabled?: boolean | null
          ai_max_words?: number | null
          ai_model?: string | null
          ai_provider?: string | null
          ai_tools_enabled?: boolean | null
          comments_enabled?: boolean
          comments_require_approval?: boolean
          contact_email?: string | null
          default_affiliate_cta?: string | null
          default_category_id?: string | null
          default_meta_description?: string | null
          default_post_type?: string | null
          default_robots?: string | null
          default_seo_title?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id?: number
          linkedin_url?: string | null
          logo_url?: string | null
          max_upload_mb?: number
          posts_per_page?: number
          site_name?: string
          site_url?: string | null
          sitemap_enabled?: boolean
          social_image?: string | null
          tagline?: string | null
          timezone?: string | null
          twitter_handle?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          admin_email?: string | null
          affiliate_disclosure?: string | null
          ai_default_audience?: string | null
          ai_default_language?: string | null
          ai_default_tone?: string | null
          ai_default_word_count?: number | null
          ai_images_enabled?: boolean | null
          ai_max_words?: number | null
          ai_model?: string | null
          ai_provider?: string | null
          ai_tools_enabled?: boolean | null
          comments_enabled?: boolean
          comments_require_approval?: boolean
          contact_email?: string | null
          default_affiliate_cta?: string | null
          default_category_id?: string | null
          default_meta_description?: string | null
          default_post_type?: string | null
          default_robots?: string | null
          default_seo_title?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          id?: number
          linkedin_url?: string | null
          logo_url?: string | null
          max_upload_mb?: number
          posts_per_page?: number
          site_name?: string
          site_url?: string | null
          sitemap_enabled?: boolean
          social_image?: string | null
          tagline?: string | null
          timezone?: string | null
          twitter_handle?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_all: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "author"
      post_status: "draft" | "published" | "scheduled"
      post_type: "review" | "comparison" | "guide" | "article"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "author"],
      post_status: ["draft", "published", "scheduled"],
      post_type: ["review", "comparison", "guide", "article"],
    },
  },
} as const
