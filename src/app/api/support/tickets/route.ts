import { NextResponse } from "next/server";
import { getUserServerSession } from "@/lib/auth/session";
import {
  createSupportTicket,
  getUserSupportUnreadCount,
  listUserSupportTickets,
} from "@/lib/db/support";
import {
  SUPPORT_TICKET_LIMIT,
  enforceRateLimit,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";
import type { CreateSupportTicketInput } from "@/lib/support/types";

export async function GET() {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await listUserSupportTickets(session.user.id);
    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[GET /api/support/tickets]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getUserServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rate = await enforceRateLimit(
      {
        route: "support:ticket",
        key: `user:${session.user.id}`,
        identifier: session.user.id,
      },
      SUPPORT_TICKET_LIMIT
    );
    if (!rate.success) {
      return rateLimitExceededResponse(SUPPORT_TICKET_LIMIT.message, rate);
    }

    const body = (await request.json()) as CreateSupportTicketInput;
    const result = await createSupportTicket(session.user.id, body);

    const { fireAndForgetEmail } = await import("@/lib/email/notify");
    const { sendSupportTicketCreatedEmail } = await import("@/lib/email/send-emails");
    fireAndForgetEmail(
      sendSupportTicketCreatedEmail({
        name: result.ticket.name,
        email: result.ticket.email,
        subject: result.ticket.subject,
        ticketId: result.ticket.id,
      }),
      "support-ticket-created"
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[POST /api/support/tickets]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create ticket" },
      { status: 500 }
    );
  }
}
