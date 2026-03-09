import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@forge/core";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// GET /api/sites/[id]/assets — list assets (no binary data)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const assets = await prisma.asset.findMany({
    where: { siteId: params.id },
    select: { id: true, filename: true, mimeType: true, purpose: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assets);
}

// POST /api/sites/[id]/assets — upload asset via FormData
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const siteId = params.id;

    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const purpose = (formData.get("purpose") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: png, jpeg, svg, webp, ico` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // If purpose is "logo", delete prior logo so there's only one
    if (purpose === "logo") {
      await prisma.asset.deleteMany({ where: { siteId, purpose: "logo" } });
    }
    if (purpose === "favicon") {
      await prisma.asset.deleteMany({ where: { siteId, purpose: "favicon" } });
    }

    const asset = await prisma.asset.create({
      data: {
        siteId,
        filename: file.name,
        mimeType: file.type,
        data: buffer,
        purpose,
      },
    });

    // If uploading a logo, auto-update previewConfig.branding.logoUrl
    if (purpose === "logo") {
      const logoUrl = `/api/assets/${asset.id}`;
      const previewConfig = (site.previewConfig as Record<string, any>) || {};
      const branding = previewConfig.branding || {};
      await prisma.site.update({
        where: { id: siteId },
        data: {
          previewConfig: {
            ...previewConfig,
            branding: { ...branding, logoUrl },
          },
        },
      });
    }

    return NextResponse.json({
      id: asset.id,
      filename: asset.filename,
      mimeType: asset.mimeType,
      purpose: asset.purpose,
      createdAt: asset.createdAt,
    });
  } catch (err) {
    console.error("Asset upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
