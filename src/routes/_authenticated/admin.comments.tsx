import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  head: () => ({ meta: [{ title: "Comments — Vistora Admin" }, { name: "robots", content: "noindex" }] }),
  component: Comments,
});

type Row = {
  id: string;
  author_name: string;
  author_email: string | null;
  content: string;
  created_at: string;
  is_approved: boolean;
  posts: { title: string; slug: string } | null;
};

function Comments() {
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, author_name, author_email, content, created_at, is_approved, posts(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const setApproved = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("comments").update({ is_approved: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment updated.");
      void queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment deleted.");
      void queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AdminShell title="Comments" description="Approve, unapprove or remove reader comments.">
      {comments.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {c.author_name}
                    {c.author_email ? (
                      <span className="ml-2 text-xs text-muted-foreground">{c.author_email}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(c.created_at)}
                    {c.posts ? ` · on “${c.posts.title}”` : ""}
                  </p>
                </div>
                <Badge variant={c.is_approved ? "default" : "secondary"}>
                  {c.is_approved ? "approved" : "pending"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{c.content}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant={c.is_approved ? "outline" : "default"}
                  onClick={() => setApproved.mutate({ id: c.id, value: !c.is_approved })}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  {c.is_approved ? "Unapprove" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this comment?")) remove.mutate(c.id);
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
