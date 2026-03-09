import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Unified AI completion interface.
 * Supports both OpenAI and Anthropic based on AI_PROVIDER env var.
 */
export async function aiComplete(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const provider = process.env.AI_PROVIDER || "openai";

  if (provider === "anthropic") {
    return anthropicComplete(systemPrompt, userPrompt);
  }

  return openaiComplete(systemPrompt, userPrompt);
}

async function openaiComplete(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || "";
}

async function anthropicComplete(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
