import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import type { AdminUserUpdateInput } from "@/lib/admin/types";
import {
  countAdminUsers,
  deleteUserByAdmin,
  getUserById,
  updateUserByAdmin,
} from "@/lib/db/users";

type RouteContext = { params: Promise<{ id: string }> };

function parseUpdateInput(body: unknown): AdminUserUpdateInput | null {
  if (!body || typeof body !== "object") return null;
  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const role = data.role === "admin" ? "admin" : data.role === "user" ? "user" : null;
  const plan =
    data.plan === "free" || data.plan === "pro" || data.plan === "team"
      ? data.plan
      : null;

  if (!name || !email || !role || !plan) return null;
  return { name, email, role, plan };
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const input = parseUpdateInput(await request.json());
    if (!input) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    const target = await getUserById(id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      target.user.role === "admin" &&
      input.role === "user" &&
      session.user.id === id
    ) {
      return NextResponse.json(
        { error: "You cannot remove your own admin role" },
        { status: 400 }
      );
    }

    if (target.user.role === "admin" && input.role === "user") {
      const adminCount = await countAdminUsers();
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last admin account" },
          { status: 400 }
        );
      }
    }

    const user = await updateUserByAdmin(id, input);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[PATCH /api/admin/users/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    const target = await getUserById(id);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.user.role === "admin") {
      const adminCount = await countAdminUsers();
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the last admin account" },
          { status: 400 }
        );
      }
    }

    await deleteUserByAdmin(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/users/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
