import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import {
  hashPassword,
  validatePasswordConfirmation,
  validatePasswordStrength,
} from "@/lib/auth/password";
import { getUserById, resetUserPasswordByAdmin } from "@/lib/db/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      password?: string;
      confirmPassword?: string;
    };

    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return NextResponse.json({ error: strengthError }, { status: 400 });
    }

    const confirmError = validatePasswordConfirmation(password, confirmPassword);
    if (confirmError) {
      return NextResponse.json({ error: confirmError }, { status: 400 });
    }

    const target = await getUserById(id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await hashPassword(password);
    await resetUserPasswordByAdmin(id, passwordHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/users/[id]/password]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset password" },
      { status: 500 }
    );
  }
}
