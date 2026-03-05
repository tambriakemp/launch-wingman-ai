import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads a base64 image string to the ai-studio storage bucket
 * and returns the public URL.
 */
export async function uploadBase64ToStorage(
  base64: string,
  folder: string
): Promise<string> {
  // If it's already a URL, return as-is
  if (base64.startsWith("http://") || base64.startsWith("https://")) {
    return base64;
  }

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
 * Skips images that are already URLs.
 */
export async function uploadImagesToStorage(
  images: string[],
  folder: string
): Promise<string[]> {
  return Promise.all(images.map((img) => uploadBase64ToStorage(img, folder)));
}

/**
 * Uploads a File object directly to the ai-studio storage bucket
 * and returns the public URL. No base64 conversion needed — keeps
 * memory usage minimal.
 */
export async function uploadFileToStorage(
  file: File,
  folder: string
): Promise<string> {
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop() || 'jpg'}`;

  const { error } = await supabase.storage
    .from("ai-studio")
    .upload(fileName, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from("ai-studio").getPublicUrl(fileName);
  return data.publicUrl;
}
