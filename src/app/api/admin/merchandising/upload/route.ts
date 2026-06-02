import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { ADMIN_ROLE, ForbiddenError, requireAdmin } from "@/lib/auth/admin";
import { checkSameOrigin } from "@/lib/security/origin";
import { detectImageMime, imageExtension } from "@/lib/security/image-type";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

/**
 * Admin-only image upload for storefront merchandising (hero banners, category
 * tiles, promo imagery). Validates the file by magic bytes and stores it in a
 * public Vercel Blob (these images are rendered directly in clinic browsers).
 * Returns the public URL for the caller to persist on a promotion.
 */
export async function POST(req: NextRequest) {
  try {
    if (!checkSameOrigin(req).ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await requireAdmin({ minRole: ADMIN_ROLE });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 8 MB." },
        { status: 400 },
      );
    }

    const verified = await detectImageMime(file);
    if (!verified) {
      return NextResponse.json(
        { error: "Image must be a PNG, JPEG, GIF, or WEBP." },
        { status: 400 },
      );
    }

    const pathname = `merchandising/${randomUUID()}.${imageExtension(verified)}`;
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: verified,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[api/admin/merchandising/upload] failed");
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
