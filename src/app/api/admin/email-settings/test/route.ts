import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { sendTestEmail, verifyEmailTransport } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { to?: string };
    const to = body.to?.trim() || session.user.email;

    const verify = await verifyEmailTransport();
    if (!verify.success) {
      return NextResponse.json(
        { error: verify.error ?? "SMTP verification failed" },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(to);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send test email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, sentTo: to });
  } catch (error) {
    console.error("[POST /api/admin/email-settings/test]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Test email failed" },
      { status: 500 }
    );
  }
}
