import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatDateTime, relativeTime, slugify } from "@/lib/admin/utils";

const searchSchema = z.object({
  status: z.enum(["all", "published", "draft", "scheduled", "trash"]).catch("all"),
  q: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  type: z.string().optional().catch(undefined),
  page: z.number().catch(1),
});

export const Route = createFileRoute("/_authenticated/admin/posts/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Posts — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: PostsList,
});

type Row = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "scheduled";
  post_type: string;
  author_name: string;
  author_id: string | null;
  category_id: string | null;
  published_at: string | null;
  updated_at: string;
  view_count: number;
  trashed_at: string | null;
  excerpt: string | null;
  is_featured: boolean;
};

const PER_PAGE = 20;
const TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "trash", label: "Trash" },
] as const;

function PostsList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();
  const [selected, setSelected] = useState<string[]>([]);
  const [quickEdit, setQuickEdit] = useState<Row | null>(null);
  const [quickForm, setQuickForm] = useState({ title: "", slug: "", status: "draft", excerpt: "" });
  const [bulkAction, setBulkAction] = useState("none");
  const [termDraft, setTermDraft] = useState(search.q ?? "");

  const setSearch = (next: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, page: 1, ...next }) });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-posts", search],
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(
          "id, title, slug, status, post_type, author_name, author_id, category_id, published_at, updated_at, view_count, trashed_at, excerpt, is_featured",
          { count: "exact" },
        )
        .order("updated_at", { ascending: false });

      query =
        search.status === "trash"
          ? query.not("trashed_at", "is", null)
          : query.is("trashed_at", null);
      if (search.status !== "all" && search.status !== "trash") {
        query = query.eq("status", search.status);
      }
      if (search.category) query = query.eq("category_id", search.category);
      if (search.type) {
        query = query.eq("post_type", search.type as "review" | "comparison" | "guide" | "article");
      }
      if (search.q) query = query.or(`title.ilike.%${search.q}%,product_name.ilike.%${search.q}%`);

      const from = (search.page - 1) * PER_PAGE;
      const { data: rows, error, count } = await query.range(from, from + PER_PAGE - 1);
      if (error) throw error;
      return { rows: (rows ?? []) as Row[], count: count ?? 0 };
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const canEdit = (row: Row) => staff?.canManageAll || row.author_id === staff?.id;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  };

  const trash = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("posts")
        .update({ trashed_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, ids) => {
      toast.success(`${ids.length} post${ids.length > 1 ? "s" : ""} moved to trash`);
      setSelected([]);
      invalidate();
    },
    onError: () => toast.error("You don't have permission to trash that post."),
  });

  const restore = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("posts").update({ trashed_at: null }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Restored");
      setSelected([]);
      invalidate();
    },
    onError: () => toast.error("Could not restore that post."),
  });

  const destroy = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("posts").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted permanently");
      setSelected([]);
      invalidate();
    },
    onError: () => toast.error("You don't have permission to delete that post."),
  });

  const setStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: Row["status"] }) => {
      const { error } = await supabase
        .from("posts")
        .update({
          status,
          ...(status === "published" ? { published_at: new Date().toISOString() } : {}),
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status updated");
      setSelected([]);
      invalidate();
    },
    onError: () => toast.error("Could not update those posts."),
  });

  const duplicate = useMutation({
    mutationFn: async (id: string) => {
      const { data: original, error } = await supabase.from("posts").select("*").eq("id", id).single();
      if (error) throw error;
      const { id: _id, created_at: _created, updated_at: _updated, ...rest } = original;
      const copy = {
        ...rest,
        title: `${original.title} (copy)`,
        slug: `${original.slug}-copy-${Date.now().toString(36)}`,
        status: "draft" as const,
        published_at: null,
        trashed_at: null,
        view_count: 0,
        is_featured: false,
        ...(staff?.canManageAll
          ? {}
          : { author_id: staff?.id ?? null, author_name: staff?.fullName ?? "Vistora Editorial" }),
      };
      const { data: created, error: insertError } = await supabase
        .from("posts")
        .insert(copy)
        .select("id")
        .single();
      if (insertError) throw insertError;
      return created.id as string;
    },
    onSuccess: () => {
      toast.success("Post duplicated as a draft");
      invalidate();
    },
    onError: () => toast.error("Could not duplicate that post."),
  });

  const saveQuick = useMutation({
    mutationFn: async () => {
      if (!quickEdit) return;
      const { error } = await supabase
        .from("posts")
        .update({
          title: quickForm.title.trim(),
          slug: slugify(quickForm.slug) || quickEdit.slug,
          status: quickForm.status as Row["status"],
          excerpt: quickForm.excerpt.trim() || null,
          ...(quickForm.status === "published" && !quickEdit.published_at
            ? { published_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", quickEdit.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post updated");
      setQuickEdit(null);
      invalidate();
    },
    onError: () => toast.error("Could not save those changes."),
  });

  function runBulk() {
    if (!selected.length || bulkAction === "none") return;
    if (bulkAction === "trash") trash.mutate(selected);
    if (bulkAction === "restore") restore.mutate(selected);
    if (bulkAction === "delete") {
      if (confirm(`Permanently delete ${selected.length} post(s)? This cannot be undone.`)) {
        destroy.mutate(selected);
      }
    }
    if (["published", "draft", "scheduled"].includes(bulkAction)) {
      setStatus.mutate({ ids: selected, status: bulkAction as Row["status"] });
    }
    setBulkAction("none");
  }

  return (
    <AdminShell
      title="Posts"
      description="Create, schedule and publish reviews, comparisons and guides."
      actions={
        <Button asChild size="sm">
          <Link to="/admin/posts/$id" params={{ id: "new" }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add new
          </Link>
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSearch({ status: tab.key })}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              search.status === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Bulk actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Bulk actions</SelectItem>
              {search.status === "trash" ? (
                <>
                  <SelectItem value="restore">Restore</SelectItem>
                  <SelectItem value="delete">Delete permanently</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="published">Publish</SelectItem>
                  <SelectItem value="draft">Move to draft</SelectItem>
                  <SelectItem value="trash">Move to trash</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={runBulk} disabled={!selected.length}>
            Apply
          </Button>
        </div>

        <Select
          value={search.category ?? "all"}
          onValueChange={(value) => setSearch({ category: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={search.type ?? "all"}
          onValueChange={(value) => setSearch({ type: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="comparison">Comparison</SelectItem>
            <SelectItem value="guide">Guide</SelectItem>
            <SelectItem value="article">Article</SelectItem>
          </SelectContent>
        </Select>

        <form
          className="ml-auto flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch({ q: termDraft.trim() || undefined });
          }}
        >
          <Input
            value={termDraft}
            onChange={(e) => setTermDraft(e.target.value)}
            placeholder="Search posts…"
            className="w-52"
            aria-label="Search posts"
          />
          <Button size="sm" variant="outline" type="submit">
            Search
          </Button>
        </form>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {total} item{total === 1 ? "" : "s"}
        {selected.length ? ` · ${selected.length} selected` : ""}
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={rows.length > 0 && selected.length === rows.length}
                  onCheckedChange={(checked) => setSelected(checked ? rows.map((r) => r.id) : [])}
                  aria-label="Select all posts"
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Author</TableHead>
              <TableHead className="hidden lg:table-cell">Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden lg:table-cell">Views</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nothing here yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((post) => (
                <TableRow key={post.id} className="align-top">
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(post.id)}
                      onCheckedChange={(checked) =>
                        setSelected((prev) =>
                          checked ? [...prev, post.id] : prev.filter((id) => id !== post.id),
                        )
                      }
                      aria-label={`Select ${post.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/admin/posts/$id"
                      params={{ id: post.id }}
                      className="font-medium hover:text-primary"
                    >
                      {post.title}
                    </Link>
                    {post.is_featured ? (
                      <Badge variant="outline" className="ml-2 align-middle text-[10px]">
                        Featured
                      </Badge>
                    ) : null}
                    <p className="text-xs text-muted-foreground">/{post.slug}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {search.status === "trash" ? (
                        <>
                          <button className="text-primary" onClick={() => restore.mutate([post.id])}>
                            Restore
                          </button>
                          <button
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Permanently delete “${post.title}”?`)) {
                                destroy.mutate([post.id]);
                              }
                            }}
                          >
                            Delete permanently
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="text-primary disabled:opacity-40"
                            disabled={!canEdit(post)}
                            onClick={() => {
                              setQuickEdit(post);
                              setQuickForm({
                                title: post.title,
                                slug: post.slug,
                                status: post.status,
                                excerpt: post.excerpt ?? "",
                              });
                            }}
                          >
                            Quick edit
                          </button>
                          <button className="text-primary" onClick={() => duplicate.mutate(post.id)}>
                            Duplicate
                          </button>
                          <button
                            className="text-destructive disabled:opacity-40"
                            disabled={!canEdit(post)}
                            onClick={() => trash.mutate([post.id])}
                          >
                            Trash
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {post.author_name}
                  </TableCell>
                  <TableCell className="hidden capitalize text-muted-foreground lg:table-cell">
                    {post.post_type}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={post.status === "published" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {post.status === "published" || post.status === "scheduled"
                      ? formatDateTime(post.published_at)
                      : `Updated ${relativeTime(post.updated_at)}`}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {post.view_count}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" title="Edit">
                        <Link to="/admin/posts/$id" params={{ id: post.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Duplicate"
                        onClick={() => duplicate.mutate(post.id)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {post.status === "published" && !post.trashed_at ? (
                        <Button asChild size="icon" variant="ghost" title="View on site">
                          <Link to="/reviews/$slug" params={{ slug: post.slug }}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                      {search.status === "trash" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Restore"
                          onClick={() => restore.mutate([post.id])}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Move to trash"
                          disabled={!canEdit(post)}
                          onClick={() => trash.mutate([post.id])}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {search.page} of {pages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={search.page <= 1}
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page - 1 }) })}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={search.page >= pages}
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {quickEdit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Quick edit</h2>
              <Button size="icon" variant="ghost" onClick={() => setQuickEdit(null)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <Label htmlFor="qe-title">Title</Label>
                <Input
                  id="qe-title"
                  value={quickForm.title}
                  onChange={(e) => setQuickForm({ ...quickForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qe-slug">Slug</Label>
                <Input
                  id="qe-slug"
                  value={quickForm.slug}
                  onChange={(e) => setQuickForm({ ...quickForm, slug: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={quickForm.status}
                  onValueChange={(value) => setQuickForm({ ...quickForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="qe-excerpt">Excerpt</Label>
                <Input
                  id="qe-excerpt"
                  value={quickForm.excerpt}
                  onChange={(e) => setQuickForm({ ...quickForm, excerpt: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setQuickEdit(null)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => saveQuick.mutate()} disabled={saveQuick.isPending}>
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
