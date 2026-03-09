import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  scrapeWebsite,
  extractBusinessData,
  detectMissingInfo,
  generateCopy,
  generateSiteConfig,
  transitionStatus,
  forceStatus,
  publishToSite,
  writeSite,
  ProjectStatus,
} from "@forge/core";

// POST /api/projects/[id]/actions — run a pipeline action
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action, notes } = body;
    const projectId = params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    switch (action) {
      case "scrape":
        // Allow re-scraping from any state
        if (project.status !== "CREATED" && project.status !== "FAILED") {
          await forceStatus(projectId, ProjectStatus.CREATED);
        }
        await scrapeWebsite(projectId);
        return NextResponse.json({ message: "Scrape complete" });

      case "extract":
        // Allow re-extraction from any post-scrape state
        if (project.status !== "EXTRACTED") {
          await forceStatus(projectId, ProjectStatus.EXTRACTED);
        }
        await extractBusinessData(projectId);
        return NextResponse.json({ message: "Extraction complete" });

      case "detect-missing":
        await detectMissingInfo(projectId);
        return NextResponse.json({ message: "Missing info detection complete" });

      case "generate-copy":
        // Allow regeneration from any state that has extracted data
        await forceStatus(projectId, ProjectStatus.READY_TO_GENERATE);

        // If notes were provided, store them in rawContent for the AI copy generator.
        // Previous regeneration notes are replaced (not accumulated).
        if (notes) {
          const existing = project.rawContent || "";
          // Strip any previous regeneration notes
          const base = existing.split("\n--- REGENERATION NOTES ---")[0].trimEnd();
          const updated = base
            ? `${base}\n\n--- REGENERATION NOTES ---\n${notes}`
            : `--- REGENERATION NOTES ---\n${notes}`;
          await prisma.project.update({
            where: { id: projectId },
            data: { rawContent: updated },
          });
        }

        await transitionStatus(projectId, ProjectStatus.GENERATING);
        await generateCopy(projectId);
        return NextResponse.json({ message: "Copy generation complete" });

      case "generate-config":
        await generateSiteConfig(projectId);
        return NextResponse.json({ message: "Config generation complete" });

      case "skip-missing":
        await forceStatus(projectId, ProjectStatus.READY_TO_GENERATE);
        return NextResponse.json({ message: "Skipped missing info" });

      case "approve":
        await publishToSite(projectId);
        return NextResponse.json({ message: "Site published to production" });

      case "export": {
        if (!project.siteId) {
          return NextResponse.json({ error: "Project is not linked to a Site" }, { status: 400 });
        }
        const projectData = await prisma.projectData.findUnique({ where: { projectId } });
        if (!projectData?.siteConfigJson) {
          return NextResponse.json({ error: "No site config. Build the config first." }, { status: 400 });
        }
        const site = await prisma.site.findUnique({ where: { id: project.siteId } });
        if (!site) {
          return NextResponse.json({ error: "Site not found" }, { status: 404 });
        }
        const config = projectData.siteConfigJson as Record<string, any>;
        const features = (site.features || {}) as Record<string, boolean>;
        const outputDir = await writeSite({
          slug: site.slug,
          config,
          siteId: site.id,
          showForm: features.contactForm === true,
        });
        return NextResponse.json({ message: "Files exported", path: outputDir });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("Action failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}
