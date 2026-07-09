import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "catalog";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Upload a catalog image to Supabase Storage and return its public URL.
 * Runs server-side with the service-role key. Returns null for an empty file
 * input (so "no new image" leaves the existing URL untouched by callers).
 */
export async function uploadCatalogImage(
  file: File | null,
  folder: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  if (!ALLOWED.includes(file.type)) {
    throw new Error("Image must be a JPEG, PNG, WebP, or AVIF file.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const admin = createAdminClient();
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
