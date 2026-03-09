import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Singleton clients — reuse across calls
let _openai: OpenAI | null = null;
let _anthropic: Anthropic | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

export interface AiCompleteOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Unified AI completion interface.
 * Supports both OpenAI and Anthropic based on AI_PROVIDER env var.
 * Model can be overridden via OPENAI_MODEL / ANTHROPIC_MODEL env vars.
 */
export async function aiComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: AiCompleteOptions
): Promise<string> {
  const provider = process.env.AI_PROVIDER || "openai";

  if (provider === "anthropic") {
    return anthropicComplete(systemPrompt, userPrompt, options);
  }

  return openaiComplete(systemPrompt, userPrompt, options);
}

async function openaiComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: AiCompleteOptions
): Promise<string> {
  const client = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4000,
  });

  return response.choices[0]?.message?.content || "";
}

async function anthropicComplete(
  systemPrompt: string,
  userPrompt: string,
  options?: AiCompleteOptions
): Promise<string> {
  const client = getAnthropic();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20241022";

  const response = await client.messages.create({
    model,
    max_tokens: options?.maxTokens ?? 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
