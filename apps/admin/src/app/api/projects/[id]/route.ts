import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@forge/core";
import fs from "fs";
import path from "path";

// DELETE /api/projects/[id] — delete a project and its linked site
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { site: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If linked to a Site, delete the site first (cascades to domains + submissions).
    // The Project.siteId is set to NULL by the onDelete: SetNull rule,
    // so the project survives and we can delete it next.
    if (project.siteId) {
      // Also clean up any exported static files
      try {
        const sitesDir = process.env.SITES_DIR || path.join(process.cwd(), "..", "runtime", "public", "sites");
        const siteDir = path.join(sitesDir, project.site!.slug);
        if (fs.existsSync(siteDir)) {
          fs.rmSync(siteDir, { recursive: true, force: true });
        }
      } catch {
        // Non-critical — exported files may not exist
      }

      await prisma.site.delete({ where: { id: project.siteId } });
    }

    // Now delete the project (cascades to ScrapedPages + ProjectData)
    await prisma.project.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Project and site deleted" });
  } catch (err) {
    console.error("Delete failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
