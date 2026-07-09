import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Upload a design thumbnail (a data: URL captured from the studio canvas) to
 * the public `designs` bucket and return its public URL. Overwrites the
 * existing thumbnail for the same design id (upsert) and cache-busts.
 */
export async function uploadDesignThumbnail(
  dataUrl: string,
  designId: string
): Promise<string | null> {
  if (!dataUrl.startsWith("data:image/")) return null;
  const base64 = dataUrl.split(",")[1];
  if (!base64) return null;

  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > 3 * 1024 * 1024) {
    throw new Error("Thumbnail too large.");
  }

  const admin = createAdminClient();
  const path = `${designId}.png`;
  const { error } = await admin.storage
    .from("designs")
    .upload(path, buffer, { contentType: "image/png", upsert: true });
  if (error) throw new Error(`Thumbnail upload failed: ${error.message}`);

  const { data } = admin.storage.from("designs").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
