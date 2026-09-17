import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [{ title: "Categories & tags — Vistora Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: Taxonomy,
});

type Term = { id: string; name: string; slug: string; description: string | null };

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function TermManager({ table, label }: { table: "categories" | "tags"; label: string }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ name: "", slug: "", description: "" });

  const { data: terms = [] } = useQuery({
    queryKey: ["admin-terms", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("id, name, slug, description").order("name");
      if (error) throw error;
      return (data ?? []) as Term[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from(table).insert({
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugify(draft.name),
        description: draft.description.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft({ name: "", slug: "", description: "" });
      toast.success(`${label} created.`);
      void queryClient.invalidateQueries({ queryKey: ["admin-terms", table] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async (term: Term) => {
      const { error } = await supabase
        .from(table)
        .update({ name: term.name, slug: term.slug, description: term.description })
        .eq("id", term.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved.");
      void queryClient.invalidateQueries({ queryKey: ["admin-terms", table] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted.");
      void queryClient.invalidateQueries({ queryKey: ["admin-terms", table] });
    },
    onError: () => toast.error("Could not delete — it may still be in use."),
  });

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-lg">{label}s</h2>

      <div className="mt-4 space-y-3">
        {terms.map((term) => (
          <TermRow key={term.id} term={term} onSave={update.mutate} onDelete={remove.mutate} />
        ))}
      </div>

      <div className="mt-6 grid gap-3 border-t pt-5 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          placeholder={`New ${label.toLowerCase()} name`}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: slugify(e.target.value) })}
        />
        <Input
          placeholder="slug"
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
        />
        <Button onClick={() => create.mutate()} disabled={!draft.name.trim() || create.isPending}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
        <Input
          className="sm:col-span-3"
          placeholder="Description (optional)"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>
    </section>
  );
}

function TermRow({
  term,
  onSave,
  onDelete,
}: {
  term: Term;
  onSave: (term: Term) => void;
  onDelete: (id: string) => void;
}) {
  const [value, setValue] = useState(term);
  const dirty =
    value.name !== term.name || value.slug !== term.slug || value.description !== term.description;

  return (
    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
      <Input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} />
      <Input value={value.slug} onChange={(e) => setValue({ ...value, slug: slugify(e.target.value) })} />
      <div className="flex gap-1">
        <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty} onClick={() => onSave(value)}>
          Save
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (confirm(`Delete “${term.name}”?`)) onDelete(term.id);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <Input
        className="sm:col-span-3"
        placeholder="Description"
        value={value.description ?? ""}
        onChange={(e) => setValue({ ...value, description: e.target.value })}
      />
    </div>
  );
}

function Taxonomy() {
  return (
    <AdminShell title="Categories & tags" description="Organise the publication's taxonomy.">
      <div className="grid gap-6 lg:grid-cols-2">
        <TermManager table="categories" label="Category" />
        <TermManager table="tags" label="Tag" />
      </div>
    </AdminShell>
  );
}
