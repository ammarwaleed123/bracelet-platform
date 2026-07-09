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
  const match = /^data:(image\/(png|jpeg|webp));base64,(.+)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1]!;
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1]!;

  const buffer = Buffer.from(match[3]!, "base64");
  if (buffer.byteLength > 3 * 1024 * 1024) {
    throw new Error("Thumbnail too large.");
  }

  const admin = createAdminClient();
  const path = `${designId}.${ext}`;
  const { error } = await admin.storage
    .from("designs")
    .upload(path, buffer, { contentType: mime, upsert: true });
  if (error) throw new Error(`Thumbnail upload failed: ${error.message}`);

  const { data } = admin.storage.from("designs").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
