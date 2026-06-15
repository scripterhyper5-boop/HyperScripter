import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import { isSupabaseServerConfigured } from "@/lib/supabase/server";
import {
  deleteScript,
  getScriptById as getDbScript,
  updateScript,
} from "@/lib/db/scripts";
import {
  deleteScriptFromHistory,
  getScriptById,
  updateScriptInHistory,
} from "@/lib/auth/script-history";
import type { GeneratorOutput } from "@/lib/generator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    if (isSupabaseServerConfigured()) {
      const script = await getDbScript(session.user.id, id);
      if (!script) {
        return NextResponse.json({ error: "Script not found" }, { status: 404 });
      }
      return NextResponse.json({ script });
    }

    const script = getScriptById(session.user.id, id);
    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }
    return NextResponse.json({ script });
  } catch (error) {
    console.error("[GET /api/scripts/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load script" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => null)) as {
      topic?: string;
      output?: Partial<GeneratorOutput>;
    } | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (isSupabaseServerConfigured()) {
      const script = await updateScript(session.user.id, id, body);
      if (!script) {
        return NextResponse.json({ error: "Script not found" }, { status: 404 });
      }
      return NextResponse.json({ script });
    }

    const script = updateScriptInHistory(session.user.id, id, body);
    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }
    return NextResponse.json({ script });
  } catch (error) {
    console.error("[PATCH /api/scripts/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update script" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    if (isSupabaseServerConfigured()) {
      await deleteScript(session.user.id, id);
      return NextResponse.json({ success: true });
    }

    deleteScriptFromHistory(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/scripts/:id]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete script" },
      { status: 500 }
    );
  }
}
