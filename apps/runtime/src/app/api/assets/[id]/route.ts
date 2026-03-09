import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@forge/core";

// GET /api/assets/[id] — serve asset binary
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const asset = await prisma.asset.findUnique({ where: { id: params.id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${asset.filename}"`,
    },
  });
}
