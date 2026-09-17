import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/admin/utils";

const searchSchema = z.object({
  status: z.enum(["all", "pending", "approved", "spam", "trash"]).catch("pending"),
});

export const Route = createFileRoute("/_authenticated/admin/comments")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Comments — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: CommentsPage,
});

type CommentRow = {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string | null;
  content: string;
  status: string;
  created_at: string;
  posts: { title: string; slug: string } | null;
};

const TABS = ["pending", "approved", "spam", "trash", "all"] as const;

function CommentsPage() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState("none");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["admin-comments", search.status],
    queryFn: async () => {
      let query = supabase
        .from("comments")
        .select("id, post_id, author_name, author_email, content, status, created_at, posts(title, slug)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (search.status !== "all") query = query.eq("status", search.status);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["admin-comment-counts"],
    queryFn: async () => {
      const [pending, approved, spam, trash, all] = await Promise.all([
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "spam"),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("status", "trash"),
        supabase.from("comments").select("id", { count: "exact", head: true }),
      ]);
      return {
        pending: pending.count ?? 0,
        approved: approved.count ?? 0,
        spam: spam.count ?? 0,
        trash: trash.count ?? 0,
        all: all.count ?? 0,
      } as Record<string, number>;
    },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-comment-counts"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
  };

  const setStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("comments").update({ status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comments updated");
      setSelected([]);
      invalidate();
    },
    onError: () => toast.error("Could not update those comments."),
  });

  const destroy = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("comments").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted permanently");
      setSelected([]);
      invalidate();
    },
    onError: () => toast.error("Only editors and admins can delete comments."),
  });

  const visible = comments.filter(
    (c) =>
      c.author_name.toLowerCase().includes(term.toLowerCase()) ||
      c.content.toLowerCase().includes(term.toLowerCase()),
  );

  function runBulk() {
    if (!selected.length || bulk === "none") return;
    if (bulk === "delete") {
      if (confirm(`Permanently delete ${selected.length} comment(s)?`)) destroy.mutate(selected);
    } else {
      setStatus.mutate({ ids: selected, status: bulk });
    }
    setBulk("none");
  }

  return (
    <AdminShell title="Comments" description="Approve, reject or clean up reader discussion.">
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        {TABS.map((tab) => (
          <Link
            key={tab}
            to="/admin/comments"
            search={{ status: tab }}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
              search.status === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab} {counts ? `(${counts[tab] ?? 0})` : ""}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select value={bulk} onValueChange={setBulk}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Bulk actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Bulk actions</SelectItem>
            <SelectItem value="approved">Approve</SelectItem>
            <SelectItem value="pending">Unapprove</SelectItem>
            <SelectItem value="spam">Mark as spam</SelectItem>
            <SelectItem value="trash">Move to trash</SelectItem>
            <SelectItem value="delete">Delete permanently</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={runBulk} disabled={!selected.length}>
          Apply
        </Button>
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search comments…"
          className="ml-auto w-56"
          aria-label="Search comments"
        />
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">
            No comments in this view.
          </p>
        ) : (
          visible.map((comment) => (
            <article key={comment.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start gap-3">
                <Checkbox
                  className="mt-1"
                  checked={selected.includes(comment.id)}
                  onCheckedChange={(checked) =>
                    setSelected((prev) =>
                      checked ? [...prev, comment.id] : prev.filter((id) => id !== comment.id),
                    )
                  }
                  aria-label={`Select comment by ${comment.author_name}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{comment.author_name}</p>
                    {comment.author_email ? (
                      <span className="text-xs text-muted-foreground">{comment.author_email}</span>
                    ) : null}
                    <Badge
                      variant={comment.status === "approved" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {comment.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(comment.created_at)}
                    {comment.posts ? (
                      <>
                        {" · on "}
                        <Link
                          to="/reviews/$slug"
                          params={{ slug: comment.posts.slug }}
                          className="text-primary"
                        >
                          {comment.posts.title}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm">{comment.content}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {comment.status !== "approved" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ ids: [comment.id], status: "approved" })}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Approve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ ids: [comment.id], status: "pending" })}
                      >
                        <Undo2 className="mr-1 h-3.5 w-3.5" /> Unapprove
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus.mutate({ ids: [comment.id], status: "spam" })}
                    >
                      <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Spam
                    </Button>
                    {comment.status === "trash" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ ids: [comment.id], status: "pending" })}
                      >
                        <Undo2 className="mr-1 h-3.5 w-3.5" /> Restore
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus.mutate({ ids: [comment.id], status: "trash" })}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Trash
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm("Permanently delete this comment?")) destroy.mutate([comment.id]);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </AdminShell>
  );
}
