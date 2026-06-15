import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import { getEmailSettings, upsertEmailSettings } from "@/lib/db/email-settings";
import { invalidateEmailTransportCache } from "@/lib/email/transport";

export async function GET() {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getEmailSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[GET /api/admin/email-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load email settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      smtpHost?: unknown;
      smtpPort?: unknown;
      smtpUsername?: unknown;
      smtpPassword?: unknown;
      senderName?: unknown;
      senderEmail?: unknown;
    };

    const smtpPort =
      typeof body.smtpPort === "number"
        ? body.smtpPort
        : typeof body.smtpPort === "string"
          ? Number.parseInt(body.smtpPort, 10)
          : undefined;

    const settings = await upsertEmailSettings({
      smtpHost: typeof body.smtpHost === "string" ? body.smtpHost : "",
      smtpPort: Number.isFinite(smtpPort) ? smtpPort : 587,
      smtpUsername: typeof body.smtpUsername === "string" ? body.smtpUsername : "",
      smtpPassword: typeof body.smtpPassword === "string" ? body.smtpPassword : undefined,
      senderName: typeof body.senderName === "string" ? body.senderName : "HyperScripter",
      senderEmail: typeof body.senderEmail === "string" ? body.senderEmail : "",
    });

    invalidateEmailTransportCache();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[PUT /api/admin/email-settings]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save email settings" },
      { status: 500 }
    );
  }
}
