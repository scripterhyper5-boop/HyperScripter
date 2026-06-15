import "server-only";

import { Type } from "@google/genai";
import { createGeminiClient } from "@/lib/gemini-client";
import { GEMINI_MODELS, type GeminiModelId } from "@/lib/gemini-models";
import type { PlanId } from "@/lib/plans";
import {
  getOptionLabel,
  hookStyleOptions,
  lengthOptions,
  nicheOptions,
  normalizeScriptOutput,
  toneOptions,
  videoTypeOptions,
  type GeneratorInput,
  type GeneratorOutput,
  type HookStyle,
  type Niche,
  type Tone,
  type VideoLength,
  type VideoType,
} from "@/lib/generator";

export { GEMINI_MODELS, type GeminiModelId } from "@/lib/gemini-models";

export function getGeminiModelForPlan(plan: PlanId): GeminiModelId {
  switch (plan) {
    case "team":
      return GEMINI_MODELS.pro;
    case "free":
    case "pro":
    default:
      return GEMINI_MODELS.flash;
  }
}

export interface GeminiScriptJson {
  hook: string;
  intro: string;
  script: string;
  cta: string;
  caption: string;
  hashtags: string[];
}

const SCRIPT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    hook: {
      type: Type.STRING,
      description: "Scroll-stopping opening line for the first 1-3 seconds",
    },
    intro: {
      type: Type.STRING,
      description: "Brief setup after the hook that bridges into the main content",
    },
    script: {
      type: Type.STRING,
      description: "Main spoken script body for the TikTok video",
    },
    cta: {
      type: Type.STRING,
      description: "Call to action closing the video",
    },
    caption: {
      type: Type.STRING,
      description: "TikTok post caption with emojis where appropriate",
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5-10 relevant hashtags including # prefix",
    },
  },
  required: ["hook", "intro", "script", "cta", "caption", "hashtags"],
} as const;

const NICHE_VALUES = new Set(nicheOptions.map((o) => o.value));
const VIDEO_TYPE_VALUES = new Set(videoTypeOptions.map((o) => o.value));
const LENGTH_VALUES = new Set(lengthOptions.map((o) => o.value));
const TONE_VALUES = new Set(toneOptions.map((o) => o.value));
const HOOK_STYLE_VALUES = new Set(hookStyleOptions.map((o) => o.value));

export class GeminiConfigError extends Error {
  constructor(message = "GEMINI_API_KEY is not configured") {
    super(message);
    this.name = "GeminiConfigError";
  }
}

export class GeminiValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiValidationError";
  }
}

export class GeminiGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "GeminiGenerationError";
  }
}

export function validateGeneratorInput(input: GeneratorInput): GeneratorInput {
  const topic = input.topic?.trim();
  if (!topic) {
    throw new GeminiValidationError("Video title / topic is required");
  }

  const niche = input.niche ?? "other";
  if (!NICHE_VALUES.has(niche)) {
    throw new GeminiValidationError("Invalid niche selection");
  }

  const videoType = input.videoType ?? "tutorial";
  if (!VIDEO_TYPE_VALUES.has(videoType)) {
    throw new GeminiValidationError("Invalid video type");
  }

  const videoLength = input.videoLength ?? "30s";
  if (!LENGTH_VALUES.has(videoLength)) {
    throw new GeminiValidationError("Invalid video length");
  }

  const tone = input.tone ?? "casual";
  if (!TONE_VALUES.has(tone)) {
    throw new GeminiValidationError("Invalid tone");
  }

  const hookStyle = input.hookStyle ?? "curiosity";
  if (!HOOK_STYLE_VALUES.has(hookStyle)) {
    throw new GeminiValidationError("Invalid hook style");
  }

  return {
    topic,
    niche,
    videoType,
    videoLength,
    tone,
    hookStyle,
    audience: input.audience?.trim() ?? "",
    keywords: input.keywords?.trim() ?? "",
    callToAction: input.callToAction?.trim() ?? "",
  };
}

async function getClient() {
  return createGeminiClient();
}

function buildPrompt(input: GeneratorInput): string {
  const niche = input.niche as Niche;
  const videoType = input.videoType as VideoType;
  const videoLength = input.videoLength as VideoLength;
  const tone = input.tone as Tone;
  const hookStyle = input.hookStyle as HookStyle;

  const audienceLine = input.audience
    ? `Target Audience: ${input.audience}`
    : "Target Audience: General TikTok viewers";
  const keywordsLine = input.keywords
    ? `Keywords to weave in naturally: ${input.keywords}`
    : "Keywords: none specified — use topic-relevant terms";
  const ctaLine = input.callToAction
    ? `Preferred Call To Action: ${input.callToAction}`
    : "Call To Action: create a compelling CTA suited to the tone and niche";

  return `You are an expert TikTok scriptwriter who creates viral, high-retention short-form video scripts.

Generate a complete TikTok script package as JSON with these fields: hook, intro, script, cta, caption, hashtags.

Video Title: ${input.topic}
Niche: ${getOptionLabel(nicheOptions, niche)}
Video Type: ${getOptionLabel(videoTypeOptions, videoType)}
Video Length: ${getOptionLabel(lengthOptions, videoLength)}
${audienceLine}
Tone: ${getOptionLabel(toneOptions, tone)}
Hook Style: ${getOptionLabel(hookStyleOptions, hookStyle)}
${keywordsLine}
${ctaLine}

Requirements:
- Write for spoken delivery on camera (natural, punchy, conversational).
- Match the target video length (${videoLength}) — keep the main script concise.
- Hook must stop the scroll in the first 1-3 seconds using the requested hook style.
- Intro bridges hook → main content in 1-2 sentences.
- Main script delivers clear value aligned with the video type and niche.
- CTA should drive follows, comments, saves, or the user's preferred action.
- Caption should be engaging for TikTok with light emoji use when appropriate.
- Provide 5-10 hashtags (each starting with #), mixing broad and niche tags.
- Do not include markdown, labels, or extra keys — only the JSON object.`;
}

function parseGeminiJson(text: string): GeminiScriptJson {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiGenerationError("Gemini returned invalid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new GeminiGenerationError("Gemini response was not a JSON object");
  }

  const record = parsed as Record<string, unknown>;
  const required = ["hook", "intro", "script", "cta", "caption", "hashtags"] as const;

  for (const key of required) {
    if (typeof record[key] !== "string" && key !== "hashtags") {
      throw new GeminiGenerationError(`Missing or invalid field: ${key}`);
    }
  }

  if (!Array.isArray(record.hashtags)) {
    throw new GeminiGenerationError("Missing or invalid hashtags array");
  }

  const hashtags = record.hashtags
    .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

  if (hashtags.length === 0) {
    throw new GeminiGenerationError("Hashtags array cannot be empty");
  }

  return {
    hook: (record.hook as string).trim(),
    intro: (record.intro as string).trim(),
    script: (record.script as string).trim(),
    cta: (record.cta as string).trim(),
    caption: (record.caption as string).trim(),
    hashtags,
  };
}

function mapGeminiToOutput(data: GeminiScriptJson): GeneratorOutput {
  const mainScript = data.script;
  const fullScript = [data.hook, data.intro, mainScript, data.cta]
    .filter(Boolean)
    .join("\n\n");

  return normalizeScriptOutput({
    hook: data.hook,
    intro: data.intro,
    mainScript,
    script: mainScript,
    fullScript,
    cta: data.cta,
    caption: data.caption,
    hashtags: data.hashtags,
  });
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export interface GenerateScriptOptions {
  plan?: PlanId;
  maxRetries?: number;
}

export async function generateScriptWithGemini(
  input: GeneratorInput,
  options: GenerateScriptOptions = {}
): Promise<{ output: GeneratorOutput; model: GeminiModelId }> {
  const validated = validateGeneratorInput(input);
  const plan = options.plan ?? "free";
  const model = getGeminiModelForPlan(plan);
  const maxRetries = options.maxRetries ?? 3;
  const client = await getClient();
  const prompt = buildPrompt(validated);

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: SCRIPT_RESPONSE_SCHEMA,
          temperature: 0.9,
          maxOutputTokens: 4096,
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new GeminiGenerationError("Gemini returned an empty response");
      }

      const parsed = parseGeminiJson(text);
      return { output: mapGeminiToOutput(parsed), model };
    } catch (error) {
      lastError = error;

      if (error instanceof GeminiValidationError || error instanceof GeminiConfigError) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        await sleep(1000 * 2 ** attempt);
      }
    }
  }

  const message =
    lastError instanceof Error
      ? lastError.message
      : "Failed to generate script with Gemini";

  throw new GeminiGenerationError(message, lastError);
}
