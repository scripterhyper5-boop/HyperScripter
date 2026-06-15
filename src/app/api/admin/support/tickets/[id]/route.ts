import { NextResponse } from "next/server";
import { getAdminServerSession } from "@/lib/auth/session";
import {
  addSupportMessage,
  getSupportTicketWithMessages,
  markSupportTicketReadByAdmin,
  updateSupportTicketStatus,
} from "@/lib/db/support";
import type { SupportTicketStatus } from "@/lib/support/types";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES = new Set<SupportTicketStatus>([
  "open",
  "in_progress",
  "answered",
  "closed",
]);

export async function GET(_request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const data = await getSupportTicketWithMessages(id);

    if (!data) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await markSupportTicketReadByAdmin(id);
    const refreshed = await getSupportTicketWithMessages(id);
    return NextResponse.json(refreshed ?? data);
  } catch (error) {
    console.error("[GET /api/admin/support/tickets/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: SupportTicketStatus;
      message?: string;
    };

    const data = await getSupportTicketWithMessages(id);
    if (!data) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    let ticket = data.ticket;
    let newMessage = null;

    if (body.status && VALID_STATUSES.has(body.status)) {
      ticket = await updateSupportTicketStatus(id, body.status);
    }

    const reply = body.message?.trim();
    if (reply) {
      newMessage = await addSupportMessage({
        ticketId: id,
        senderType: "admin",
        senderId: session.user.id,
        body: reply,
      });
      const refreshed = await getSupportTicketWithMessages(id);
      if (refreshed) ticket = refreshed.ticket;

      const { fireAndForgetEmail } = await import("@/lib/email/notify");
      const { sendSupportReplyEmail } = await import("@/lib/email/send-emails");
      fireAndForgetEmail(
        sendSupportReplyEmail({
          recipientEmail: data.ticket.email,
          recipientName: data.ticket.name,
          ticketSubject: data.ticket.subject,
          ticketId: id,
          messagePreview: reply,
          fromAdmin: true,
        }),
        "support-admin-reply"
      );
    }

    return NextResponse.json({ ticket, message: newMessage });
  } catch (error) {
    console.error("[PATCH /api/admin/support/tickets/[id]]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update ticket" },
      { status: 500 }
    );
  }
}
