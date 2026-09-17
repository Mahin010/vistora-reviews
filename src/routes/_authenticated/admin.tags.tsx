import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { slugify, uniqueSlug } from "@/lib/admin/utils";

export const Route = createFileRoute("/_authenticated/admin/tags")({
  head: () => ({ meta: [{ title: "Tags — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: TagsPage,
});

type TagRow = { id: string; name: string; slug: string; description: string | null };

function TagsPage() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [editing, setEditing] = useState<TagRow | null>(null);

  const { data: tags = [] } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as TagRow[];
    },
  });

  const { data: counts = {} } = useQuery({
    queryKey: ["admin-tag-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("post_tags").select("tag_id");
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as { tag_id: string }[]) {
        map[row.tag_id] = (map[row.tag_id] ?? 0) + 1;
      }
      return map;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("Tag name is required.");
      const duplicate = tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase() && t.id !== editing?.id,
      );
      if (duplicate) throw new Error("A tag with that name already exists.");
      const slug = await uniqueSlug(supabase, "tags", form.slug || name, editing?.id ?? null);
      const payload = { name, slug, description: form.description.trim() || null };
      if (editing) {
        const { error } = await supabase.from("tags").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tags").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Tag updated" : "Tag created successfully");
      setForm({ name: "", slug: "", description: "" });
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tag deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-tags"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const visible = tags.filter((t) => t.name.toLowerCase().includes(term.toLowerCase()));

  return (
    <AdminShell title="Tags" description="Group posts by topic with reusable tags.">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="text-base font-semibold">{editing ? "Edit tag" : "Add new tag"}</h2>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tag-slug">Slug</Label>
              <Input
                id="tag-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder={slugify(form.name)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tag-desc">Description</Label>
              <Textarea
                id="tag-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {editing ? "Update tag" : "Add tag"}
              </Button>
              {editing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setForm({ name: "", slug: "", description: "" });
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
            placeholder="Search tags…"
            className="max-w-xs"
            aria-label="Search tags"
          />
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="font-medium hover:text-primary"
                        onClick={() => {
                          setEditing(tag);
                          setForm({
                            name: tag.name,
                            slug: tag.slug,
                            description: tag.description ?? "",
                          });
                        }}
                      >
                        {tag.name}
                      </button>
                      {tag.description ? (
                        <p className="text-xs text-muted-foreground">{tag.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                    <TableCell className="text-muted-foreground">{counts[tag.id] ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${tag.name}`}
                        onClick={() => {
                          if (confirm(`Delete the tag “${tag.name}”?`)) remove.mutate(tag.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No tags yet.
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
