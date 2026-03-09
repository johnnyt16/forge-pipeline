import { NextRequest, NextResponse } from "next/server";
import { prisma, transitionStatus, ProjectStatus } from "@forge/core";

// GET /api/projects — list all projects
export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      site: true,
      _count: { select: { scrapedPages: true } },
    },
  });
  return NextResponse.json(projects);
}

// POST /api/projects — create a new project (and its linked Site)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientName, websiteUrl, contactEmail, rawContent, siteType, templateFamily, features, notes } = body;

    if (!clientName || !contactEmail) {
      return NextResponse.json(
        { error: "clientName and contactEmail are required" },
        { status: 400 }
      );
    }

    if (!websiteUrl && !rawContent) {
      return NextResponse.json(
        { error: "Provide either a website URL or raw content" },
        { status: 400 }
      );
    }

    // Validate URL if provided
    if (websiteUrl) {
      try {
        new URL(websiteUrl);
      } catch {
        return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
      }
    }

    // Generate slug
    const baseSlug = clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 0;
    while (await prisma.site.findUnique({ where: { slug } })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Create Site + Project
    const site = await prisma.site.create({
      data: {
        name: clientName,
        slug,
        siteType: siteType || "STATIC",
        templateFamily: templateFamily || "INSURANCE_AGENCY",
        features: features || {},
        notes: notes || null,
        projects: {
          create: {
            clientName,
            websiteUrl: websiteUrl || null,
            contactEmail,
            rawContent: rawContent || null,
            templateType: templateFamily || "INSURANCE_AGENCY",
          },
        },
      },
      include: {
        projects: true,
      },
    });

    // If only manual input (no URL), inject rawContent as a ScrapedPage
    // so the extraction step has something to work with
    const project = site.projects[0];
    if (rawContent && !websiteUrl) {
      await prisma.scrapedPage.create({
        data: {
          projectId: project.id,
          url: "manual-input",
          title: `Manual input for ${clientName}`,
          rawContent: rawContent,
        },
      });
      // Skip scraping — go straight to EXTRACTED
      await transitionStatus(project.id, ProjectStatus.EXTRACTED);
    }

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("Failed to create project:", err);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
