/**
 * Client helper: upload an image to Cloudinary via /api/uploads/image.
 */
export type UploadFolder = "avatars" | "teams" | "announcements";

export async function uploadImage(
  file: File,
  folder: UploadFolder = "avatars",
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be under 8MB");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);

  const res = await fetch("/api/uploads/image", {
    method: "POST",
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? `Upload failed (${res.status})`);
  }
  return data.url;
}
