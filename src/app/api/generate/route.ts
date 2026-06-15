import { NextResponse } from "next/server";
import type { GeneratorInput } from "@/lib/generator";
import {
  GeminiConfigError,
  GeminiGenerationError,
  GeminiValidationError,
  generateScriptWithGemini,
} from "@/lib/gemini";
import { resolveUserPlan } from "@/lib/auth/resolve-plan";
import { getUserServerSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/users";
import { createScript, recordScriptUsage } from "@/lib/db/scripts";
import { getScriptUsageAllowanceForUser } from "@/lib/db/usage";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import {
  GENERATE_LIMITS,
  enforceRateLimit,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";
import type { PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeneratorInput;
    const session = await getUserServerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = session.user;
    if (isSupabaseServerConfigured()) {
      const account = await getUserById(session.user.id);
      if (account?.user) {
        user = {
          ...account.user,
          role: session.user.role ?? account.user.role,
          plan: resolveUserPlan(account.user),
        };
      }
    }

    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      const plan = (user.plan ?? "free") as PlanId;
      const generateLimit = GENERATE_LIMITS[plan] ?? GENERATE_LIMITS.free;
      const rate = await enforceRateLimit(
        {
          route: "generate",
          key: `user:${user.id}`,
          identifier: user.id,
        },
        generateLimit
      );
      if (!rate.success) {
        return rateLimitExceededResponse(generateLimit.message, rate);
      }
    }

    const allowance = await getScriptUsageAllowanceForUser(user);
    if (!allowance.allowed) {
      return NextResponse.json(
        { error: "Monthly limit reached", code: "LIMIT_REACHED" },
        { status: 429 }
      );
    }

    const plan = user.plan ?? "free";
    const { output, model } = await generateScriptWithGemini(body, { plan });

    let scriptId: string | undefined;
    if (isSupabaseServerConfigured()) {
      try {
        const saved = await createScript(user.id, body, output);
        scriptId = saved.id;
      } catch (dbError) {
        console.error("[/api/generate] Failed to save script:", dbError);
      }
    }

    await recordScriptUsage(user.id, scriptId);

    return NextResponse.json({ output, model, scriptId });
  } catch (error) {
    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        { error: error.message, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (error instanceof GeminiConfigError) {
      return NextResponse.json(
        {
          error: "AI generation is not configured. Add GEMINI_API_KEY to .env.local",
          code: "CONFIG_ERROR",
        },
        { status: 503 }
      );
    }

    if (error instanceof GeminiGenerationError) {
      return NextResponse.json(
        { error: error.message, code: "GENERATION_ERROR" },
        { status: 502 }
      );
    }

    console.error("[/api/generate]", error);
    return NextResponse.json(
      { error: "Failed to generate script", code: "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}
