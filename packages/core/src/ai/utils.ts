/**
 * Parse JSON from LLM response, handling common formatting issues
 * (markdown code fences, extra text before/after JSON).
 */
export function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find JSON object in the response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("Failed to parse LLM response as JSON");
  }
}
