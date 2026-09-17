import { supabase } from "@/integrations/supabase/client";

import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, slugify } from "./utils";

export type MediaFolder = "featured" | "content" | "authors" | "site";

export type MediaItem = {
  id: string;
  file_name: string;
  storage_path: string | null;
  url: string;
  alt_text: string | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  folder: string | null;
  created_at: string;
};

export const MEDIA_FIELDS =
  "id, file_name, storage_path, url, alt_text, title, caption, description, mime_type, size_bytes, folder, created_at";

/** Storage bucket is private, so we mint a long-lived signed URL for public rendering. */
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function signedUrl(path: string, expiresIn = TEN_YEARS) {
  const { data } = await supabase.storage.from("media").createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? "";
}

export function validateImage(file: File, maxBytes = MAX_UPLOAD_BYTES) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, WEBP or GIF images can be uploaded.";
  }
  if (file.size > maxBytes) {
    return `That file is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB.`;
  }
  return null;
}

export async function uploadMedia(
  file: File,
  folder: MediaFolder,
  uploadedBy?: string | null,
): Promise<MediaItem> {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);

  const ext = file.name.includes(".") ? file.name.split(".").pop()! : "jpg";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const path = `${folder}/${new Date().getFullYear()}/${Date.now()}-${base}.${ext.toLowerCase()}`;

  const { error: storageError } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (storageError) throw storageError;

  const url = await signedUrl(path);

  const { data, error } = await supabase
    .from("media")
    .insert({
      file_name: file.name,
      storage_path: path,
      url,
      title: file.name.replace(/\.[^.]+$/, ""),
      mime_type: file.type,
      size_bytes: file.size,
      folder,
      uploaded_by: uploadedBy ?? null,
    })
    .select(MEDIA_FIELDS)
    .single();
  if (error) throw error;
  return data as MediaItem;
}

export async function deleteMedia(item: MediaItem) {
  if (item.storage_path) {
    await supabase.storage.from("media").remove([item.storage_path]);
  }
  const { error } = await supabase.from("media").delete().eq("id", item.id);
  if (error) throw error;
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
