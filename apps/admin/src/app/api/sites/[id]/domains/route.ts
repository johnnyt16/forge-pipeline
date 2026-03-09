import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@forge/core";

// GET /api/sites/[id]/domains — list domains for a site
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const domains = await prisma.domain.findMany({
    where: { siteId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(domains);
}

// POST /api/sites/[id]/domains — add a custom domain to a site
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { hostname, isPrimary } = await req.json();

    if (!hostname) {
      return NextResponse.json({ error: "hostname is required" }, { status: 400 });
    }

    // Verify site exists
    const site = await prisma.site.findUnique({ where: { id: params.id } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Check hostname isn't already used
    const existing = await prisma.domain.findUnique({ where: { hostname } });
    if (existing) {
      return NextResponse.json({ error: "Domain already in use" }, { status: 409 });
    }

    // If setting as primary, unset other primary domains
    if (isPrimary) {
      await prisma.domain.updateMany({
        where: { siteId: params.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const domain = await prisma.domain.create({
      data: {
        siteId: params.id,
        hostname: hostname.toLowerCase(),
        isPrimary: isPrimary || false,
      },
    });

    return NextResponse.json(domain, { status: 201 });
  } catch (err) {
    console.error("Failed to add domain:", err);
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 });
  }
}
