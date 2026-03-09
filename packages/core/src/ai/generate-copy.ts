import { prisma } from "../db/client";
import { aiComplete } from "./provider";

const COPY_GENERATION_SYSTEM_PROMPT = `You are a professional website copywriter specializing in insurance agencies and local service businesses.

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
 * Generate website copy from extracted business data.
 * Incorporates rawContent (including regeneration notes) as additional context.
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
  });

  const extractedData = projectData.extractedJson as Record<string, unknown>;

  // Check for existing generated copy (for regeneration context)
  const previousCopy = projectData.generatedCopyJson
    ? `\n\nPREVIOUS GENERATED COPY (improve upon this):\n${JSON.stringify(projectData.generatedCopyJson, null, 2)}`
    : "";

  // Check for regeneration notes or manual content
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

  const result = await aiComplete(COPY_GENERATION_SYSTEM_PROMPT, userPrompt);

  const generatedCopy = parseJsonResponse(result);

  await prisma.projectData.update({
    where: { projectId },
    data: { generatedCopyJson: generatedCopy as any },
  });
}

function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse generated copy as JSON");
  }
}
