import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { FeaturedImageField } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { slugify, uniqueSlug } from "@/lib/admin/utils";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: CategoriesPage,
});

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
};

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  parent_id: "none",
  image_url: null as string | null,
  sort_order: 0,
};

function CategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [term, setTerm] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, parent_id, image_url, sort_order")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["admin-category-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("category_id").is("trashed_at", null);
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as { category_id: string | null }[]) {
        if (row.category_id) map[row.category_id] = (map[row.category_id] ?? 0) + 1;
      }
      return map;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("Category name is required.");
      const slug = await uniqueSlug(supabase, "categories", form.slug || name, editing?.id ?? null);
      const payload = {
        name,
        slug,
        description: form.description.trim() || null,
        parent_id: form.parent_id === "none" ? null : form.parent_id,
        image_url: form.image_url,
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Category updated" : "Category created successfully");
      setForm(EMPTY);
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Order parents first, children indented underneath.
  const tree = categories
    .filter((c) => !c.parent_id)
    .flatMap((parent) => [
      { row: parent, depth: 0 },
      ...categories.filter((c) => c.parent_id === parent.id).map((child) => ({ row: child, depth: 1 })),
    ]);
  const orphans = categories
    .filter((c) => c.parent_id && !categories.some((p) => p.id === c.parent_id))
    .map((row) => ({ row, depth: 0 }));
  const visible = [...tree, ...orphans].filter((entry) =>
    entry.row.name.toLowerCase().includes(term.toLowerCase()),
  );

  return (
    <AdminShell title="Categories" description="Organise your content into a clear hierarchy.">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">{editing ? "Edit category" : "Add new category"}</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder={slugify(form.name)}
              />
            </div>
            <div className="space-y-1">
              <Label>Parent category</Label>
              <Select
                value={form.parent_id}
                onValueChange={(value) => setForm({ ...form, parent_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {categories
                    .filter((c) => c.id !== editing?.id && !c.parent_id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-order">Sort order</Label>
              <Input
                id="cat-order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Category image</Label>
              <FeaturedImageField
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {editing ? "Update" : "Add category"}
              </Button>
              {editing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setForm(EMPTY);
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search categories…"
            className="max-w-xs"
            aria-label="Search categories"
          />
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ row, depth }) => (
                  <TableRow key={row.id}>
                    <TableCell style={{ paddingLeft: depth ? 28 : undefined }}>
                      <button
                        type="button"
                        className="font-medium hover:text-primary"
                        onClick={() => {
                          setEditing(row);
                          setForm({
                            name: row.name,
                            slug: row.slug,
                            description: row.description ?? "",
                            parent_id: row.parent_id ?? "none",
                            image_url: row.image_url,
                            sort_order: row.sort_order,
                          });
                        }}
                      >
                        {depth ? "— " : ""}
                        {row.name}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.slug}</TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                      {row.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{counts[row.id] ?? 0}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" title="View on site">
                          <Link to="/search" search={{ category: row.slug }}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${row.name}`}
                          onClick={() => {
                            if (confirm(`Delete “${row.name}”? Posts stay but lose this category.`)) {
                              remove.mutate(row.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
