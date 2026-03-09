import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@forge/core";

// GET /api/sites/[id]/submissions — list form submissions for a site
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const submissions = await prisma.formSubmission.findMany({
    where: { siteId: params.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(submissions);
}
