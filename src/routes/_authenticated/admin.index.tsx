import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CalendarClock,
  FileText,
  FolderTree,
  Image as ImageIcon,
  MessageSquare,
  PenLine,
  Plus,
  Tags as TagsIcon,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";
import { autoExcerpt, relativeTime, slugify, uniqueSlug } from "@/lib/admin/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [{ title: "Dashboard — Vistora CMS" }, { name: "robots", content: "noindex" }],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  search,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
  to: string;
  search?: Record<string, string>;
}) {
  return (
    <Link
      to={to as never}
      search={(search ?? {}) as never}
      className="rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </Link>
  );
}

function Dashboard() {
  const { data: staff } = useStaff();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const live = () => supabase.from("posts").select("id", { count: "exact", head: true }).is("trashed_at", null);
      const [all, published, drafts, scheduled, trashed, categories, tags, comments, pending, media, authors, recent, recentComments] =
        await Promise.all([
          live(),
          live().eq("status", "published"),
          live().eq("status", "draft"),
          live().eq("status", "scheduled"),
          supabase.from("posts").select("id", { count: "exact", head: true }).not("trashed_at", "is", null),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("tags").select("id", { count: "exact", head: true }),
          supabase.from("comments").select("id", { count: "exact", head: true }),
          supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("media").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("posts")
            .select("id, title, status, updated_at, published_at, author_name")
            .is("trashed_at", null)
            .order("updated_at", { ascending: false })
            .limit(6),
          supabase
            .from("comments")
            .select("id, author_name, content, created_at, status, post_id")
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      return {
        total: all.count ?? 0,
        published: published.count ?? 0,
        drafts: drafts.count ?? 0,
        scheduled: scheduled.count ?? 0,
        trashed: trashed.count ?? 0,
        categories: categories.count ?? 0,
        tags: tags.count ?? 0,
        comments: comments.count ?? 0,
        pending: pending.count ?? 0,
        media: media.count ?? 0,
        authors: authors.count ?? 0,
        recent: recent.data ?? [],
        recentComments: recentComments.data ?? [],
      };
    },
  });

  const quickDraft = useMutation({
    mutationFn: async () => {
      const title = draftTitle.trim();
      if (!title) throw new Error("Give your draft a title first.");
      const slug = await uniqueSlug(supabase, "posts", slugify(title));
      const content = draftBody.trim() ? `<p>${draftBody.trim().replace(/\n+/g, "</p><p>")}</p>` : "";
      const { data: row, error } = await supabase
        .from("posts")
        .insert({
          title,
          slug,
          content,
          excerpt: content ? autoExcerpt(content) : null,
          status: "draft",
          author_id: staff?.id ?? null,
          author_name: staff?.fullName || "Vistora Editorial",
        })
        .select("id")
        .single();
      if (error) throw error;
      return row.id as string;
    },
    onSuccess: (id) => {
      toast.success("Draft saved successfully");
      setDraftTitle("");
      setDraftBody("");
      void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      void navigate({ to: "/admin/posts/$id", params: { id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AdminShell
      title={`Welcome back, ${staff?.fullName?.split(" ")[0] ?? "there"}`}
      description="Everything happening across your publication right now."
      actions={
        <>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/media">
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload media
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/posts/$id" params={{ id: "new" }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New post
            </Link>
          </Button>
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Total posts" value={data?.total ?? 0} icon={FileText} to="/admin/posts" search={{ status: "all" }} />
          <StatCard label="Published" value={data?.published ?? 0} icon={FileText} to="/admin/posts" search={{ status: "published" }} />
          <StatCard label="Drafts" value={data?.drafts ?? 0} icon={PenLine} to="/admin/posts" search={{ status: "draft" }} />
          <StatCard label="Scheduled" value={data?.scheduled ?? 0} icon={CalendarClock} to="/admin/posts" search={{ status: "scheduled" }} />
          <StatCard label="Categories" value={data?.categories ?? 0} icon={FolderTree} to="/admin/categories" />
          <StatCard label="Tags" value={data?.tags ?? 0} icon={TagsIcon} to="/admin/tags" />
          <StatCard label="Comments" value={data?.comments ?? 0} icon={MessageSquare} to="/admin/comments" search={{ status: "all" }} />
          <StatCard label="Authors" value={data?.authors ?? 0} icon={Users} to="/admin/users" />
          <StatCard label="Media files" value={data?.media ?? 0} icon={ImageIcon} to="/admin/media" />
          <StatCard label="In trash" value={data?.trashed ?? 0} icon={FileText} to="/admin/posts" search={{ status: "trash" }} />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">Quick draft</h2>
          <p className="text-xs text-muted-foreground">Capture an idea now, flesh it out later.</p>
          <div className="mt-4 space-y-3">
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Post title"
              aria-label="Draft title"
            />
            <Textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              aria-label="Draft content"
            />
            <Button size="sm" onClick={() => quickDraft.mutate()} disabled={quickDraft.isPending}>
              {quickDraft.isPending ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recently edited</h2>
            <Link to="/admin/posts" search={{ status: "all" }} className="text-xs text-primary">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y">
            {data?.recent.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    to="/admin/posts/$id"
                    params={{ id: post.id }}
                    className="block truncate text-sm font-medium hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {post.author_name} · {relativeTime(post.updated_at)}
                  </p>
                </div>
                <Badge variant={post.status === "published" ? "default" : "secondary"} className="capitalize">
                  {post.status}
                </Badge>
              </li>
            ))}
            {!data?.recent.length ? (
              <li className="py-3 text-sm text-muted-foreground">No posts yet.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent comments</h2>
            <Link to="/admin/comments" search={{ status: "pending" }} className="text-xs text-primary">
              Moderate {data?.pending ? `(${data.pending})` : ""}
            </Link>
          </div>
          <ul className="mt-3 divide-y">
            {data?.recentComments.length ? (
              data.recentComments.map((c) => (
                <li key={c.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.author_name}</p>
                    <Badge variant={c.status === "approved" ? "default" : "secondary"} className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.content}</p>
                </li>
              ))
            ) : (
              <li className="py-3 text-sm text-muted-foreground">No comments yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4" /> Site activity
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.recent ?? []).slice(0, 5).map((post) => (
              <li key={`act-${post.id}`} className="text-muted-foreground">
                <span className="text-foreground">{post.author_name}</span>{" "}
                {post.status === "published" ? "published" : "updated"}{" "}
                <Link
                  to="/admin/posts/$id"
                  params={{ id: post.id }}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  {post.title}
                </Link>{" "}
                · {relativeTime(post.updated_at)}
              </li>
            ))}
            {!data?.recent.length ? <li className="text-muted-foreground">Nothing yet.</li> : null}
          </ul>

          <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/posts/$id" params={{ id: "new" }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add post
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/categories">
                <FolderTree className="mr-1 h-3.5 w-3.5" /> Categories
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/media">
                <ImageIcon className="mr-1 h-3.5 w-3.5" /> Media
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/">View site</Link>
            </Button>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
