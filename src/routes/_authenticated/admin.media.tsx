import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import {
  MediaDetailsDialog,
  MediaGrid,
  MediaUploadButton,
  useDeleteMedia,
  useMediaLibrary,
} from "@/components/admin/media-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MediaItem } from "@/lib/admin/media";
import { formatBytes } from "@/lib/admin/media";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({ meta: [{ title: "Media — Vistora CMS" }, { name: "robots", content: "noindex" }] }),
  component: MediaPage,
});

function MediaPage() {
  const [term, setTerm] = useState("");
  const [folder, setFolder] = useState("all");
  const [active, setActive] = useState<MediaItem | null>(null);
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useMediaLibrary(term);
  const remove = useDeleteMedia();

  const visible = folder === "all" ? items : items.filter((item) => (item.folder ?? "content") === folder);
  const totalBytes = items.reduce((sum, item) => sum + (item.size_bytes ?? 0), 0);

  return (
    <AdminShell
      title="Media library"
      description={`${items.length} file${items.length === 1 ? "" : "s"} · ${formatBytes(totalBytes)} stored`}
      actions={
        <MediaUploadButton
          folder="content"
          onUploaded={() => {
            void queryClient.invalidateQueries({ queryKey: ["admin-media"] });
          }}
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by file name, title or alt text…"
          className="max-w-sm"
          aria-label="Search media"
        />
        <Select value={folder} onValueChange={setFolder}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="All folders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All folders</SelectItem>
            <SelectItem value="featured">Featured images</SelectItem>
            <SelectItem value="content">In-content</SelectItem>
            <SelectItem value="authors">Authors</SelectItem>
            <SelectItem value="site">Site branding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading library…</p>
        ) : visible.length === 0 ? (
          <p className="rounded-xl border bg-card py-14 text-center text-sm text-muted-foreground">
            No images yet — upload your first one.
          </p>
        ) : (
          <MediaGrid
            items={visible}
            onSelect={(item) => setActive(item)}
            onDelete={(item) => {
              if (confirm(`Delete “${item.file_name}”? Posts using it will lose the image.`)) {
                remove.mutate(item);
              }
            }}
          />
        )}
      </div>

      <MediaDetailsDialog item={active} onClose={() => setActive(null)} />
    </AdminShell>
  );
}
