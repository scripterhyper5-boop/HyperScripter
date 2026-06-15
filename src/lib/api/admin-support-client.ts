import type {
  AdminSupportTicketListResult,
  SupportMessage,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketWithMessages,
} from "@/lib/support/types";

async function adminSupportFetch<T>(path: string, init?: RequestInit): Promise<T> {
  console.log("[support-api] fetch", { path, method: init?.method ?? "GET" });
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export async function fetchAdminTickets(
  params: URLSearchParams
): Promise<AdminSupportTicketListResult> {
  return adminSupportFetch<AdminSupportTicketListResult>(
    `/api/admin/support/tickets?${params}`
  );
}

export async function fetchAdminTicket(
  ticketId: string
): Promise<SupportTicketWithMessages> {
  return adminSupportFetch<SupportTicketWithMessages>(
    `/api/admin/support/tickets/${ticketId}`
  );
}

export async function updateAdminTicket(input: {
  ticketId: string;
  status?: SupportTicketStatus;
  message?: string;
}): Promise<{ ticket: SupportTicket; message: SupportMessage | null }> {
  return adminSupportFetch<{ ticket: SupportTicket; message: SupportMessage | null }>(
    `/api/admin/support/tickets/${input.ticketId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
        message: input.message,
      }),
    }
  );
}

export async function fetchAdminSupportUnread(): Promise<number> {
  const data = await adminSupportFetch<{ count: number }>(
    "/api/admin/support/unread"
  );
  return data.count;
}
