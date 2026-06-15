import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { listAdminSupportTickets } from "@/lib/db/support";
import type { SupportTicketStatus } from "@/lib/support/types";

const VALID_STATUSES = new Set<SupportTicketStatus | "all">([
  "all",
  "open",
  "in_progress",
  "answered",
  "closed",
]);

export async function GET(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "all";
    const status = VALID_STATUSES.has(statusParam as SupportTicketStatus | "all")
      ? (statusParam as SupportTicketStatus | "all")
      : "all";

    const result = await listAdminSupportTickets({
      search: searchParams.get("search") ?? undefined,
      status,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "10"),
      sortBy:
        (searchParams.get("sortBy") as
          | "subject"
          | "status"
          | "createdAt"
          | "updatedAt"
          | null) ?? "updatedAt",
      sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/support/tickets]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load tickets" },
      { status: 500 }
    );
  }
}
