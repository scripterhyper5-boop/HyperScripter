import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import type { AdminUserSortField } from "@/lib/admin/types";
import { listUsersForAdminPaginated } from "@/lib/db/users";

const VALID_SORT_FIELDS = new Set<AdminUserSortField>([
  "name",
  "email",
  "plan",
  "role",
  "createdAt",
]);

export async function GET(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sortByParam = searchParams.get("sortBy") ?? "createdAt";
    const sortBy = VALID_SORT_FIELDS.has(sortByParam as AdminUserSortField)
      ? (sortByParam as AdminUserSortField)
      : "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const result = await listUsersForAdminPaginated({
      search: searchParams.get("search") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "10"),
      sortBy,
      sortDir,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load users" },
      { status: 500 }
    );
  }
}
