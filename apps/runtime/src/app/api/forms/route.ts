import { NextRequest, NextResponse } from "next/server";
import { prisma, getSiteFeatures } from "@forge/core";

/**
 * POST /api/forms — handle form submissions for STATIC_PLUS sites.
 * Stores submissions in the database, gated by feature flags.
 */
export async function POST(req: NextRequest) {
  try {
    const { siteId, formType, data } = await req.json();

    if (!siteId || !formType || !data) {
      return NextResponse.json(
        { error: "siteId, formType, and data are required" },
        { status: 400 }
      );
    }

    // Verify site exists and has the right feature enabled
    const site = await prisma.site.findUnique({ where: { id: siteId } });
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const features = getSiteFeatures(site);

    // Check feature flag for the form type
    const featureMap: Record<string, string> = {
      contact: "contactForm",
      quote: "quoteRequest",
      lead: "leadCapture",
    };

    const requiredFeature = featureMap[formType];
    if (requiredFeature && !features[requiredFeature]) {
      return NextResponse.json(
        { error: `${formType} form is not enabled for this site` },
        { status: 403 }
      );
    }

    // Store the submission
    const submission = await prisma.formSubmission.create({
      data: {
        siteId,
        formType,
        data,
      },
    });

    return NextResponse.json({ id: submission.id, message: "Submission received" }, { status: 201 });
  } catch (err) {
    console.error("Form submission failed:", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
