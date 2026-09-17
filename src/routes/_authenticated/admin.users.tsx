import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/admin/utils";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

type Row = {
  id: string;
  display_name: string;
  job_title: string | null;
  avatar_url: string | null;
  created_at: string;
  role: "admin" | "editor" | "author";
  posts: number;
};

function UsersPage() {
  const { data: staff } = useStaff();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const isAdmin = staff?.role === "admin";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [profiles, roles, posts] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, job_title, avatar_url, created_at")
          .order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("posts").select("author_id").is("trashed_at", null),
      ]);
      const roleMap = new Map<string, Row["role"]>();
      for (const r of (roles.data ?? []) as { user_id: string; role: Row["role"] }[]) {
        const current = roleMap.get(r.user_id);
        const rank = { admin: 3, editor: 2, author: 1 } as const;
        if (!current || rank[r.role] > rank[current]) roleMap.set(r.user_id, r.role);
      }
      const counts = new Map<string, number>();
      for (const p of (posts.data ?? []) as { author_id: string | null }[]) {
        if (p.author_id) counts.set(p.author_id, (counts.get(p.author_id) ?? 0) + 1);
      }
      return (profiles.data ?? []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) ?? "author",
        posts: counts.get(p.id) ?? 0,
      })) as Row[];
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Row["role"] }) => {
      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Only administrators can change roles."),
  });

  const visible = users.filter((u) => u.display_name.toLowerCase().includes(term.toLowerCase()));

  return (
    <AdminShell
      title="Users"
      description="Everyone with access to the CMS and what they're allowed to do."
    >
      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        New people join by signing up on the sign-in page; the first account becomes an administrator and
        everyone after that starts as an author.
        {isAdmin ? " You can promote them below." : " Only administrators can change roles."}
      </div>

      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search people…"
        className="mt-4 max-w-xs"
        aria-label="Search users"
      />

      <div className="mt-4 overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Title</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : (
              visible.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {user.display_name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium">
                        {user.display_name}
                        {user.id === staff?.id ? (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            You
                          </Badge>
                        ) : null}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {user.job_title ?? "—"}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Select
                        value={user.role}
                        onValueChange={(role) =>
                          setRole.mutate({ userId: user.id, role: role as Row["role"] })
                        }
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="author">Author</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.posts}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {formatDateTime(user.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { role: "Administrator", detail: "Full access: content, users, settings and deletion." },
          { role: "Editor", detail: "Manages and publishes everyone's content; no user or role changes." },
          { role: "Author", detail: "Writes and publishes only their own posts." },
        ].map((item) => (
          <div key={item.role} className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">{item.role}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>

      <Button asChild variant="outline" size="sm" className="mt-6">
        <a href="/auth">Invite someone via the sign-up page</a>
      </Button>
    </AdminShell>
  );
}
