import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { listEmailLogs } from "@/lib/db/email-logs";
import type { EmailLogStatus } from "@/lib/email/types";

export async function GET(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status =
      statusParam === "sent" || statusParam === "failed"
        ? (statusParam as EmailLogStatus)
        : undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "20");

    const result = await listEmailLogs({ status, page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/admin/email-logs]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load email logs" },
      { status: 500 }
    );
  }
}
