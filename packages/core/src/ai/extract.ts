import { prisma } from "../db/client";
import { aiComplete } from "./provider";
import { parseJsonResponse } from "./utils";

const EXTRACTION_SYSTEM_PROMPT = `You are a data extraction assistant. You extract structured business information from website content.

You MUST return ONLY valid JSON — no markdown, no explanation, no code fences.

Return a JSON object with these fields (use null for any field you cannot find):

{
  "businessName": string | null,
  "phone": string | null,
  "email": string | null,
  "address": string | null,
  "businessDescription": string | null,
  "servicesOffered": string[] | null,
  "locationsServed": string[] | null,
  "teamMembers": { "name": string, "role": string }[] | null,
  "testimonials": { "text": string, "author": string }[] | null,
  "existingCTAs": string[] | null,
  "officeHours": string | null,
  "logoUrl": string | null,
  "socialLinks": { "platform": string, "url": string }[] | null
}

Be thorough. Extract ALL available data. If a field has partial info, include what you found.`;

/**
 * Extract structured business data from scraped pages using an LLM.
 */
export async function extractBusinessData(projectId: string): Promise<void> {
  const pages = await prisma.scrapedPage.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  if (pages.length === 0) {
    throw new Error("No scraped pages found. Run scraping first.");
  }

  // Combine scraped content (truncated to fit context)
  const combinedContent = pages
    .map((p) => `--- PAGE: ${p.url} ---\nTitle: ${p.title}\n\n${p.rawContent}`)
    .join("\n\n")
    .slice(0, 30000);

  const result = await aiComplete(
    EXTRACTION_SYSTEM_PROMPT,
    `Extract business information from this website content:\n\n${combinedContent}`
  );

  // Parse the JSON response
  const extractedData = parseJsonResponse(result);

  // Upsert project data
  await prisma.projectData.upsert({
    where: { projectId },
    create: {
      projectId,
      extractedJson: extractedData as any,
    },
    update: {
      extractedJson: extractedData as any,
    },
  });
}

