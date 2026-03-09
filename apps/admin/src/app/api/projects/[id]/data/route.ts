import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@forge/core";

/**
 * PATCH /api/projects/[id]/data — update any field on ProjectData.
 *
 * Accepts: { field: "extractedJson" | "generatedCopyJson" | "siteConfigJson", value: any }
 *
 * This is how the admin edits extracted data, generated copy, or site config
 * before re-generating or approving.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { field, value } = await req.json();

    const ALLOWED_FIELDS = ["extractedJson", "generatedCopyJson", "siteConfigJson"];
    if (!ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json(
        { error: `Invalid field. Allowed: ${ALLOWED_FIELDS.join(", ")}` },
        { status: 400 }
      );
    }

    // Upsert — create ProjectData if it doesn't exist yet
    const data = await prisma.projectData.upsert({
      where: { projectId: params.id },
      create: {
        projectId: params.id,
        [field]: value,
      },
      update: {
        [field]: value,
      },
    });

    // If editing siteConfigJson, also sync to the Site's previewConfig
    if (field === "siteConfigJson") {
      const project = await prisma.project.findUnique({
        where: { id: params.id },
      });
      if (project?.siteId) {
        await prisma.site.update({
          where: { id: project.siteId },
          data: { previewConfig: value, status: "PREVIEW" },
        });
      }
    }

    return NextResponse.json({ message: `${field} updated`, data });
  } catch (err) {
    console.error("Failed to update project data:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
