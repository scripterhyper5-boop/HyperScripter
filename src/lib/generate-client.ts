import type { GeneratorInput, GeneratorOutput } from "@/lib/generator";

export interface GenerateScriptResponse {
  output: GeneratorOutput;
  model?: string;
  scriptId?: string;
}

export interface GenerateScriptError {
  error: string;
  code?: string;
}

export class GenerateApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "GenerateApiError";
  }
}

export async function requestScriptGeneration(
  input: GeneratorInput,
  options?: { signal?: AbortSignal }
): Promise<GenerateScriptResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    signal: options?.signal,
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as GenerateScriptResponse & GenerateScriptError;

  if (!res.ok) {
    throw new GenerateApiError(
      data.error ?? "Generation failed",
      res.status,
      data.code
    );
  }

  if (!data.output?.hook) {
    throw new GenerateApiError("Invalid response from server", res.status);
  }

  return { output: data.output, model: data.model, scriptId: data.scriptId };
}

export async function requestScriptGenerationWithRetry(
  input: GeneratorInput,
  options?: {
    maxAttempts?: number;
    signal?: AbortSignal;
    onRetry?: (attempt: number, error: Error) => void;
  }
): Promise<GenerateScriptResponse> {
  const maxAttempts = options?.maxAttempts ?? 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestScriptGeneration(input, { signal: options?.signal });
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Generation failed");
      lastError = err;

      const isRetryable =
        error instanceof GenerateApiError &&
        (error.status >= 500 || error.status === 429) &&
        error.code !== "LIMIT_REACHED" &&
        error.code !== "RATE_LIMITED";

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      options?.onRetry?.(attempt, err);
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }

  throw lastError ?? new Error("Generation failed");
}

export function scriptHistoryToInput(item: {
  topic: string;
  niche?: string;
  videoType?: string;
  videoLength: string;
  audience: string;
  tone: string;
  hookStyle?: string;
  keywords?: string;
  callToAction?: string;
}): GeneratorInput {
  return {
    topic: item.topic,
    niche: (item.niche ?? "other") as GeneratorInput["niche"],
    videoType: (item.videoType ?? "tutorial") as GeneratorInput["videoType"],
    videoLength: (item.videoLength ?? "30s") as GeneratorInput["videoLength"],
    audience: item.audience,
    tone: (item.tone ?? "casual") as GeneratorInput["tone"],
    hookStyle: (item.hookStyle ?? "curiosity") as GeneratorInput["hookStyle"],
    keywords: item.keywords,
    callToAction: item.callToAction,
  };
}
