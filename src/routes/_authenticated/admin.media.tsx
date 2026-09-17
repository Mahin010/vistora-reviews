import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({ meta: [{ title: "Media — Vistora Admin" }, { name: "robots", content: "noindex" }] }),
  component: Media,
});

type MediaRow = {
  id: string;
  file_name: string;
  file_path: string;
  alt_text: string | null;
  mime_type: string | null;
  created_at: string;
};

function Media() {
  const queryClient = useQueryClient();
  const { data: staff } = useStaff();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("id, file_name, file_path, alt_text, mime_type, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as MediaRow[];
      const signed = await Promise.all(
        rows.map(async (row) => {
          const { data: url } = await supabase.storage
            .from("media")
            .createSignedUrl(row.file_path, 60 * 60);
          return { ...row, url: url?.signedUrl ?? "" };
        }),
      );
      return signed;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const path = `${new Date().getFullYear()}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "-")}`;
      const { error: storageError } = await supabase.storage.from("media").upload(path, file);
      if (storageError) throw storageError;
      const { error } = await supabase.from("media").insert({
        file_name: file.name,
        file_path: path,
        mime_type: file.type,
        file_size: file.size,
        uploaded_by: staff?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Image uploaded.");
      void queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (row: MediaRow) => {
      await supabase.storage.from("media").remove([row.file_path]);
      const { error } = await supabase.from("media").delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted.");
      void queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const visible = items.filter((item) =>
    item.file_name.toLowerCase().includes(term.toLowerCase()),
  );

  return (
    <AdminShell
      title="Media library"
      description="Upload and reuse images across articles."
      actions={
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload.mutate(file);
              e.target.value = "";
            }}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            <Upload className="mr-1 h-4 w-4" /> {upload.isPending ? "Uploading…" : "Upload image"}
          </Button>
        </>
      }
    >
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search file names…"
        className="max-w-xs"
        aria-label="Search media"
      />

      {visible.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No images yet. Upload one to get started.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-xl border bg-card">
              {item.url ? (
                <img src={item.url} alt={item.alt_text ?? item.file_name} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] w-full bg-muted" />
              )}
              <figcaption className="space-y-2 p-3">
                <p className="truncate text-xs font-medium">{item.file_name}</p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(item.url);
                      toast.success("Link copied (valid for one hour).");
                    }}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy link
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete ${item.file_name}?`)) remove.mutate(item);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
