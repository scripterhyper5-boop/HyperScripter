import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import {
  addSupportMessage,
  getSupportTicketWithMessages,
  markSupportTicketReadByUser,
} from "@/lib/db/support";
import {
  SUPPORT_REPLY_LIMIT,
  enforceRateLimit,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const data = await getSupportTicketWithMessages(id);

    if (!data) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (data.ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await markSupportTicketReadByUser(id);
    const refreshed = await getSupportTicketWithMessages(id);
    return NextResponse.json(refreshed ?? data);
  } catch (error) {
    console.error("[GET /api/support/tickets/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load ticket" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { message?: string };
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const data = await getSupportTicketWithMessages(id);
    if (!data) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (data.ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (data.ticket.status === "closed") {
      return NextResponse.json(
        { error: "This ticket is closed" },
        { status: 400 }
      );
    }

    const rate = await enforceRateLimit(
      {
        route: "support:reply",
        key: `user:${session.user.id}`,
        identifier: session.user.id,
      },
      SUPPORT_REPLY_LIMIT
    );
    if (!rate.success) {
      return rateLimitExceededResponse(SUPPORT_REPLY_LIMIT.message, rate);
    }

    const newMessage = await addSupportMessage({
      ticketId: id,
      senderType: "user",
      senderId: session.user.id,
      body: message,
    });

    const { fireAndForgetEmail } = await import("@/lib/email/notify");
    const { sendSupportReplyEmail, getAdminNotificationEmails } = await import(
      "@/lib/email/send-emails"
    );
    fireAndForgetEmail(
      (async () => {
        const adminEmails = await getAdminNotificationEmails();
        await Promise.all(
          adminEmails.map((email) =>
            sendSupportReplyEmail({
              recipientEmail: email,
              recipientName: "Admin",
              ticketSubject: data.ticket.subject,
              ticketId: id,
              messagePreview: message,
              fromAdmin: false,
            })
          )
        );
      })(),
      "support-user-reply"
    );

    return NextResponse.json({ message: newMessage });
  } catch (error) {
    console.error("[POST /api/support/tickets/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send reply" },
      { status: 500 }
    );
  }
}
