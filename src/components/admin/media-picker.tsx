import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Search, Trash2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStaff } from "@/hooks/use-staff";
import { supabase } from "@/integrations/supabase/client";
import {
  MEDIA_FIELDS,
  deleteMedia,
  formatBytes,
  uploadMedia,
  type MediaFolder,
  type MediaItem,
} from "@/lib/admin/media";
import { formatDateTime } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";

export function useMediaLibrary(term = "") {
  return useQuery({
    queryKey: ["admin-media", term],
    queryFn: async () => {
      let query = supabase.from("media").select(MEDIA_FIELDS).order("created_at", { ascending: false });
      if (term.trim()) {
        const t = term.replace(/[%,()]/g, " ").trim();
        query = query.or(`file_name.ilike.%${t}%,title.ilike.%${t}%,alt_text.ilike.%${t}%`);
      }
      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data ?? []) as MediaItem[];
    },
  });
}

/** Upload button + progress used by the library and the picker. */
export function MediaUploadButton({
  folder,
  label = "Upload files",
  onUploaded,
}: {
  folder: MediaFolder;
  label?: string;
  onUploaded?: (item: MediaItem) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: staff } = useStaff();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  async function handleFiles(files: FileList) {
    setProgress(5);
    let done = 0;
    for (const file of Array.from(files)) {
      try {
        const item = await uploadMedia(file, folder, staff?.id ?? null);
        onUploaded?.(item);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to upload image");
      }
      done += 1;
      setProgress(Math.round((done / files.length) * 100));
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    setTimeout(() => setProgress(null), 600);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={progress !== null}>
        <UploadCloud className="mr-2 h-4 w-4" />
        {progress !== null ? "Uploading…" : label}
      </Button>
      {progress !== null ? <Progress value={progress} className="h-1.5" /> : null}
    </div>
  );
}

export function MediaGrid({
  items,
  selectedId,
  onSelect,
  onDelete,
}: {
  items: MediaItem[];
  selectedId?: string | null;
  onSelect?: (item: MediaItem) => void;
  onDelete?: (item: MediaItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        <ImageOff className="mx-auto mb-2 h-5 w-5" />
        No images here yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <figure
          key={item.id}
          className={cn(
            "group relative overflow-hidden rounded-lg border bg-card text-left transition",
            selectedId === item.id ? "ring-2 ring-primary" : "hover:border-primary/50",
          )}
        >
          <button type="button" className="block w-full" onClick={() => onSelect?.(item)}>
            <img
              src={item.url}
              alt={item.alt_text ?? item.file_name}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </button>
          <figcaption className="space-y-0.5 p-2">
            <p className="truncate text-xs font-medium">{item.title || item.file_name}</p>
            <p className="text-[11px] text-muted-foreground">{formatBytes(item.size_bytes)}</p>
          </figcaption>
          {onDelete ? (
            <button
              type="button"
              title="Delete image"
              aria-label={`Delete ${item.file_name}`}
              onClick={() => onDelete(item)}
              className="absolute right-1.5 top-1.5 rounded-md bg-background/90 p-1.5 opacity-0 transition group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </button>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  folder = "content",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  folder?: MediaFolder;
}) {
  const [term, setTerm] = useState("");
  const { data: items = [], isLoading } = useMediaLibrary(term);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select or upload an image</DialogTitle>
          <DialogDescription>
            Images are stored securely in your site storage and reusable anywhere.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Media library</TabsTrigger>
            <TabsTrigger value="upload">Upload new</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search images…"
                className="pl-9"
              />
            </div>
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : (
              <MediaGrid items={items} onSelect={onSelect} />
            )}
          </TabsContent>

          <TabsContent value="upload">
            <MediaUploadButton folder={folder} onUploaded={onSelect} label="Choose files" />
            <p className="mt-3 text-xs text-muted-foreground">JPG, PNG, WEBP or GIF up to 15 MB.</p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/** Featured image field: upload from device, pick from library, edit metadata, remove. */
export function FeaturedImageField({
  value,
  onChange,
  altText,
  onAltTextChange,
  folder = "featured",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  altText?: string;
  onAltTextChange?: (value: string) => void;
  folder?: MediaFolder;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img src={value} alt={altText || "Featured image"} className="aspect-[16/9] w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove featured image"
            aria-label="Remove featured image"
            className="absolute right-2 top-2 rounded-md bg-background/90 p-1.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          <UploadCloud className="h-6 w-6" />
          Set featured image
        </button>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          {value ? "Replace image" : "Upload or choose"}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            Remove
          </Button>
        ) : null}
      </div>

      {onAltTextChange ? (
        <div className="space-y-1">
          <Label htmlFor="featured-alt" className="text-xs">
            Alt text (accessibility & SEO)
          </Label>
          <Input
            id="featured-alt"
            value={altText ?? ""}
            onChange={(e) => onAltTextChange(e.target.value)}
            placeholder="Describe the image"
          />
        </div>
      ) : null}

      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        folder={folder}
        onSelect={(item) => {
          onChange(item.url);
          if (onAltTextChange && item.alt_text) onAltTextChange(item.alt_text);
          setOpen(false);
        }}
      />
    </div>
  );
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: MediaItem) => deleteMedia(item),
    onSuccess: () => {
      toast.success("Image deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function MediaDetailsDialog({
  item,
  onOpenChange,
}: {
  item: MediaItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<MediaItem | null>(item);
  if (item && draft?.id !== item.id) setDraft(item);

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return;
      const { error } = await supabase
        .from("media")
        .update({
          title: draft.title,
          alt_text: draft.alt_text,
          caption: draft.caption,
          description: draft.description,
        })
        .eq("id", draft.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Changes saved");
      void queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Image details</DialogTitle>
          <DialogDescription>{item ? formatDateTime(item.created_at) : ""}</DialogDescription>
        </DialogHeader>
        {draft ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <img
              src={draft.url}
              alt={draft.alt_text ?? draft.file_name}
              className="w-full rounded-lg border object-cover"
            />
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="m-title">Title</Label>
                <Input
                  id="m-title"
                  value={draft.title ?? ""}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-alt">Alt text</Label>
                <Input
                  id="m-alt"
                  value={draft.alt_text ?? ""}
                  onChange={(e) => setDraft({ ...draft, alt_text: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-caption">Caption</Label>
                <Input
                  id="m-caption"
                  value={draft.caption ?? ""}
                  onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="m-desc">Description</Label>
                <Input
                  id="m-desc"
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {draft.file_name} · {formatBytes(draft.size_bytes)} · {draft.mime_type}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
                  Save changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(draft.url);
                    toast.success("Image link copied");
                  }}
                >
                  Copy URL
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
