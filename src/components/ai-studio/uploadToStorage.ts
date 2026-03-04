import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a base64 image string to the ai-studio storage bucket
 * and returns the public URL. This offloads large image data from
 * edge function request bodies, preventing memory limit errors.
 */
export async function uploadBase64ToStorage(
  base64: string,
  folder: string
): Promise<string> {
  // Strip data URL prefix if present
  const raw = base64.includes(",") ? base64.split(",")[1] : base64;
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));

  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await supabase.storage
    .from("ai-studio")
    .upload(fileName, bytes, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from("ai-studio").getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Uploads an array of base64 images in parallel and returns their public URLs.
 */
export async function uploadImagesToStorage(
  images: string[],
  folder: string
): Promise<string[]> {
  return Promise.all(images.map((img) => uploadBase64ToStorage(img, folder)));
}
