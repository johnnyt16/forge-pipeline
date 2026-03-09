import { prisma } from "../db/client";
import { aiComplete } from "./provider";
import { parseJsonResponse } from "./utils";
import {
  INSURANCE_COPY_SYSTEM_PROMPT,
  buildInsuranceCopyUserPrompt,
} from "./prompts/insurance";

const GENERIC_COPY_SYSTEM_PROMPT = `You are a professional website copywriter specializing in insurance agencies and local service businesses.

Generate website copy that is:
- Professional and trustworthy
- Modern and clear
- Action-oriented with strong CTAs
- Warm but not overly casual
- Focused on building trust and credibility

You MUST return ONLY valid JSON — no markdown, no explanation, no code fences.

Return a JSON object with this structure:

{
  "hero": {
    "headline": "string — compelling main headline",
    "subheadline": "string — supporting subheadline",
    "ctaText": "string — primary call to action button text",
    "ctaSecondaryText": "string — secondary CTA text"
  },
  "about": {
    "title": "string",
    "description": "string — 2-3 paragraphs about the business",
    "highlights": ["string — key differentiators or values"]
  },
  "services": {
    "title": "string",
    "subtitle": "string",
    "items": [
      {
        "name": "string",
        "description": "string — 1-2 sentences"
      }
    ]
  },
  "testimonials": {
    "title": "string",
    "items": [
      {
        "text": "string — testimonial quote",
        "author": "string",
        "role": "string | null"
      }
    ]
  },
  "faq": {
    "title": "string",
    "items": [
      {
        "question": "string",
        "answer": "string"
      }
    ]
  },
  "contact": {
    "title": "string",
    "subtitle": "string",
    "ctaText": "string"
  },
  "footer": {
    "tagline": "string",
    "copyright": "string"
  }
}`;

/**
 * Normalize template family to the canonical UPPER_SNAKE format.
 */
function normalizeTemplateFamily(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.toUpperCase().replace(/-/g, "_");
}

/**
 * Generate website copy from extracted business data.
 * Incorporates rawContent (including regeneration notes) as additional context.
 *
 * Uses specialized insurance prompts when templateFamily is INSURANCE_AGENCY,
 * otherwise falls back to the generic prompt.
 */
export async function generateCopy(projectId: string): Promise<void> {
  const projectData = await prisma.projectData.findUnique({
    where: { projectId },
  });

  if (!projectData?.extractedJson) {
    throw new Error("No extracted data found. Run extraction first.");
  }

  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { site: true },
  });

  const extractedData = projectData.extractedJson as Record<string, unknown>;
  const templateFamily = normalizeTemplateFamily(project.site?.templateFamily);
  const isInsurance = templateFamily === "INSURANCE_AGENCY";

  let result: string;

  if (isInsurance) {
    // ---- Insurance-specific path ----
    const userPrompt = buildInsuranceCopyUserPrompt({
      extractedData,
      clientName: project.clientName,
      templateType: project.templateType,
      contactEmail: project.contactEmail,
      rawContent: project.rawContent,
      previousCopy: projectData.generatedCopyJson as Record<string, unknown> | null,
    });

    result = await aiComplete(INSURANCE_COPY_SYSTEM_PROMPT, userPrompt, {
      maxTokens: 8000,
    });
  } else {
    // ---- Generic path (unchanged) ----
    const previousCopy = projectData.generatedCopyJson
      ? `\n\nPREVIOUS GENERATED COPY (improve upon this):\n${JSON.stringify(projectData.generatedCopyJson, null, 2)}`
      : "";

    const additionalContext = project.rawContent
      ? `\n\nADDITIONAL CONTEXT / NOTES FROM OPERATOR:\n${project.rawContent}`
      : "";

    const userPrompt = `Generate website copy for this business:

Business Name: ${extractedData.businessName || project.clientName}
Type: ${project.templateType}
Description: ${extractedData.businessDescription || "Insurance agency / local service business"}
Services: ${JSON.stringify(extractedData.servicesOffered || [])}
Locations: ${JSON.stringify(extractedData.locationsServed || [])}
Existing Testimonials: ${JSON.stringify(extractedData.testimonials || [])}
Phone: ${extractedData.phone || ""}
Email: ${extractedData.email || project.contactEmail}
Address: ${extractedData.address || ""}
${additionalContext}${previousCopy}

Generate professional, trust-building website copy for all sections.
If testimonials exist, use them. If not, create placeholder testimonials that can be replaced.
Generate 4-6 FAQ items relevant to the business type.
Make the copy specific to their business, not generic.
If regeneration notes are provided above, incorporate that feedback into the new copy.`;

    result = await aiComplete(GENERIC_COPY_SYSTEM_PROMPT, userPrompt);
  }

  const generatedCopy = parseJsonResponse(result);

  await prisma.projectData.update({
    where: { projectId },
    data: { generatedCopyJson: generatedCopy as any },
  });
}
