import { NextRequest, NextResponse } from "next/server";
import {
  prisma,
  enqueueScrape,
  enqueueExtract,
  enqueueDetectMissing,
  enqueueGenerateCopy,
  enqueueGenerateConfig,
  forceStatus,
  publishToSite,
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
        await enqueueScrape(projectId);
        return NextResponse.json({ message: "Scrape job queued" });

      case "extract":
        // Allow re-extraction from any post-scrape state
        if (project.status !== "EXTRACTED") {
          await forceStatus(projectId, ProjectStatus.EXTRACTED);
        }
        await enqueueExtract(projectId);
        return NextResponse.json({ message: "Extraction job queued" });

      case "detect-missing":
        await enqueueDetectMissing(projectId);
        return NextResponse.json({ message: "Missing info detection queued" });

      case "generate-copy":
        // Allow regeneration from any state that has extracted data
        await forceStatus(projectId, ProjectStatus.READY_TO_GENERATE);

        // If notes were provided, append them to the project's rawContent
        // so the AI copy generator can incorporate feedback
        if (notes) {
          const existing = project.rawContent || "";
          const updated = existing
            ? `${existing}\n\n--- REGENERATION NOTES ---\n${notes}`
            : `--- REGENERATION NOTES ---\n${notes}`;
          await prisma.project.update({
            where: { id: projectId },
            data: { rawContent: updated },
          });
        }

        await enqueueGenerateCopy(projectId);
        return NextResponse.json({ message: "Copy generation queued" });

      case "generate-config":
        await enqueueGenerateConfig(projectId);
        return NextResponse.json({ message: "Config generation queued" });

      case "skip-missing":
        await forceStatus(projectId, ProjectStatus.READY_TO_GENERATE);
        return NextResponse.json({ message: "Skipped missing info" });

      case "approve":
        await publishToSite(projectId);
        return NextResponse.json({ message: "Site published to production" });

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
