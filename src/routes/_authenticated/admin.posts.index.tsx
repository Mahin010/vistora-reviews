import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/site";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  post_type: string;
  author_name: string;
  published_at: string | null;
  updated_at: string;
  view_count: number;
};

const FILTERS = ["all", "published", "draft", "scheduled"] as const;

export const Route = createFileRoute("/_authenticated/admin/posts/")({
  head: () => ({ meta: [{ title: "Posts — Vistora Admin" }, { name: "robots", content: "noindex" }] }),
  component: PostsList,
});

function PostsList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [term, setTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-posts", filter],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select("id, title, slug, status, post_type, author_name, published_at, updated_at, view_count")
        .order("updated_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted.");
      void queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: () => toast.error("You don't have permission to delete this post."),
  });

  const visible = posts.filter((p) => p.title.toLowerCase().includes(term.toLowerCase()));

  return (
    <AdminShell
      title="Posts"
      description="Create, edit, schedule and publish editorial content."
      actions={
        <Button asChild>
          <Link to="/admin/posts/$id" params={{ id: "new" }}>
            <Plus className="mr-1 h-4 w-4" /> New post
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Filter by title…"
          className="max-w-xs"
          aria-label="Filter posts"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No posts here yet.
                </td>
              </tr>
            ) : (
              visible.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/posts/$id"
                      params={{ id: post.id }}
                      className="font-medium hover:text-primary"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      /{post.slug} · {post.author_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{post.post_type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(post.published_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{post.view_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {post.status === "published" ? (
                        <Button asChild variant="ghost" size="icon" title="View on site">
                          <Link to="/reviews/$slug" params={{ slug: post.slug }}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete post"
                        onClick={() => {
                          if (confirm(`Delete “${post.title}”? This cannot be undone.`)) {
                            remove.mutate(post.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
