import { v2 as cloudinary } from "cloudinary";
import { env } from "@/env";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    env;
  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export type UploadFolder = "avatars" | "teams" | "announcements";

export async function uploadImageBuffer(
  buffer: Buffer,
  opts: {
    folder: UploadFolder;
    publicId?: string;
    maxEdge?: number;
  },
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  const maxEdge = opts.maxEdge ?? 1024;

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `devtrack/${opts.folder}`,
        public_id: opts.publicId,
        overwrite: true,
        resource_type: "image",
        format: "jpg",
        transformation: [
          {
            width: maxEdge,
            height: maxEdge,
            crop: "limit",
            quality: "auto:good",
            fetch_format: "auto",
          },
        ],
      },
      (err, res) => {
        if (err || !res?.secure_url) {
          reject(err ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          secure_url: res.secure_url,
          public_id: res.public_id,
        });
      },
    );
    stream.end(buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}
