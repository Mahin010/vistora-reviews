import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, FolderTree, MessageSquare, PenLine, Plus } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Vistora Admin" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [all, published, drafts, scheduled, categories, comments, recent] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "scheduled"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase
          .from("comments")
          .select("id, author_name, content, created_at, is_approved, post_id")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("posts")
          .select("id, title, status, updated_at, author_name")
          .order("updated_at", { ascending: false })
          .limit(6),
      ]);

      return {
        total: all.count ?? 0,
        published: published.count ?? 0,
        drafts: drafts.count ?? 0,
        scheduled: scheduled.count ?? 0,
        categories: categories.count ?? 0,
        comments: (comments.data ?? []) as {
          id: string;
          author_name: string;
          content: string;
          created_at: string;
          is_approved: boolean;
        }[],
        recent: (recent.data ?? []) as {
          id: string;
          title: string;
          status: string;
          updated_at: string;
          author_name: string;
        }[],
      };
    },
  });

  const stats = [
    { label: "Total posts", value: data?.total ?? 0, icon: FileText },
    { label: "Published", value: data?.published ?? 0, icon: FileText },
    { label: "Drafts", value: data?.drafts ?? 0, icon: PenLine },
    { label: "Scheduled", value: data?.scheduled ?? 0, icon: PenLine },
    { label: "Categories", value: data?.categories ?? 0, icon: FolderTree },
  ];

  return (
    <AdminShell
      title="Dashboard"
      description="Editorial status at a glance."
      actions={
        <Button asChild>
          <Link to="/admin/posts/$id" params={{ id: "new" }}>
            <Plus className="mr-1 h-4 w-4" /> New post
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5">
            <s.icon className="h-4 w-4 text-muted-foreground" />
            <p className="mt-3 font-display text-3xl">{s.value}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-lg">Recently edited</h2>
          <ul className="mt-4 divide-y">
            {data?.recent.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to="/admin/posts/$id"
                    params={{ id: post.id }}
                    className="block truncate text-sm font-medium hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {post.author_name} · {formatDate(post.updated_at)}
                  </p>
                </div>
                <Badge variant={post.status === "published" ? "default" : "secondary"}>
                  {post.status}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Recent comments</h2>
            <Link to="/admin/comments" className="text-sm text-primary">
              Moderate
            </Link>
          </div>
          <ul className="mt-4 divide-y">
            {data?.comments.length ? (
              data.comments.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.author_name}</p>
                    <Badge variant={c.is_approved ? "default" : "secondary"}>
                      {c.is_approved ? "approved" : "pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.content}</p>
                </li>
              ))
            ) : (
              <li className="py-3 text-sm text-muted-foreground">
                <MessageSquare className="mb-1 h-4 w-4" /> No comments yet.
              </li>
            )}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}
