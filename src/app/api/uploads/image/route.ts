/**
 * POST /api/uploads/image
 * Multipart form: file (image), folder (avatars|teams|announcements)
 * Returns { url } hosted on Cloudinary.
 */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { uploadImageBuffer, type UploadFolder } from "@/server/cloudinary";

export const runtime = "nodejs";
export const maxDuration = 60;

const FOLDERS = new Set<UploadFolder>(["avatars", "teams", "announcements"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const folderRaw = String(form.get("folder") ?? "avatars");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are allowed" },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be under 8MB" },
        { status: 400 },
      );
    }
    if (!FOLDERS.has(folderRaw as UploadFolder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const folder = folderRaw as UploadFolder;
    const buffer = Buffer.from(await file.arrayBuffer());
    const maxEdge = folder === "announcements" ? 1600 : 1024;
    const publicId = `${session.user.id}-${Date.now().toString(36)}`;

    const uploaded = await uploadImageBuffer(buffer, {
      folder,
      publicId,
      maxEdge,
    });

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      publicId: uploaded.publicId,
    });
  } catch (err: unknown) {
    console.error("[POST /api/uploads/image]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to upload image",
      },
      { status: 500 },
    );
  }
}
