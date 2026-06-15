import type {
  CreateSupportTicketInput,
  SupportMessage,
  SupportTicket,
  SupportTicketWithMessages,
} from "@/lib/support/types";

async function supportFetch<T>(path: string, init?: RequestInit): Promise<T> {
  console.log("[support-api] fetch", { path, method: init?.method ?? "GET" });
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    code?: string;
    retryAfter?: number;
  };

  if (!res.ok) {
    const message =
      data.code === "RATE_LIMITED" && data.error
        ? data.error
        : data.error ?? "Request failed";
    throw new Error(message);
  }

  return data;
}

export async function fetchUserTickets(): Promise<SupportTicket[]> {
  const data = await supportFetch<{ tickets: SupportTicket[] }>(
    "/api/support/tickets"
  );
  return data.tickets;
}

export async function createUserTicket(
  input: CreateSupportTicketInput
): Promise<SupportTicketWithMessages> {
  return supportFetch<SupportTicketWithMessages>("/api/support/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchUserTicket(
  ticketId: string
): Promise<SupportTicketWithMessages> {
  return supportFetch<SupportTicketWithMessages>(
    `/api/support/tickets/${ticketId}`
  );
}

export async function replyToUserTicket(
  ticketId: string,
  message: string
): Promise<{ message: SupportMessage }> {
  return supportFetch<{ message: SupportMessage }>(
    `/api/support/tickets/${ticketId}`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    }
  );
}

export async function fetchUserSupportUnread(): Promise<number> {
  const data = await supportFetch<{ count: number }>("/api/support/unread");
  return data.count;
}
