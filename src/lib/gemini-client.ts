import "server-only";

import { GoogleGenAI } from "@google/genai";
import { getResolvedGeminiApiKey } from "@/lib/db/ai-settings";
import { GEMINI_MODELS } from "@/lib/gemini-models";
import { GeminiConfigError } from "@/lib/gemini";

export async function createGeminiClient(): Promise<GoogleGenAI> {
  const apiKey = await getResolvedGeminiApiKey();
  if (!apiKey) {
    throw new GeminiConfigError();
  }
  return new GoogleGenAI({ apiKey });
}

export async function testGeminiConnection(): Promise<
  | { success: true; model: string }
  | { success: false; error: string }
> {
  try {
    const client = await createGeminiClient();
    const model = GEMINI_MODELS.flash;

    const response = await client.models.generateContent({
      model,
      contents: "Reply with exactly: OK",
      config: {
        maxOutputTokens: 16,
        temperature: 0,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { success: false, error: "Empty response from Gemini" };
    }

    return { success: true, model };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to connect to Gemini";

    if (
      message.toLowerCase().includes("api key") ||
      message.toLowerCase().includes("permission") ||
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("401") ||
      message.toLowerCase().includes("403")
    ) {
      return { success: false, error: "Invalid API Key" };
    }

    return { success: false, error: message };
  }
}
