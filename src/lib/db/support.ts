import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AdminSupportTicketListParams,
  AdminSupportTicketListResult,
  AdminSupportTicketRow,
  AdminSupportTicketSortField,
  CreateSupportTicketInput,
  SupportMessage,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketWithMessages,
} from "@/lib/support/types";

interface DbSupportTicket {
  id: string;
  user_id: string;
  name: string;
  email: string;
  subject: string;
  status: SupportTicketStatus;
  user_unread_count: number;
  admin_unread_count: number;
  created_at: string;
  updated_at: string;
}

interface DbSupportMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "admin";
  sender_id: string;
  body: string;
  read_by_user: boolean;
  read_by_admin: boolean;
  created_at: string;
}

const SORT_COLUMN_MAP: Record<AdminSupportTicketSortField, string> = {
  subject: "subject",
  status: "status",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

function mapTicket(row: DbSupportTicket): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    status: row.status,
    userUnreadCount: row.user_unread_count,
    adminUnreadCount: row.admin_unread_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getSenderNames(
  senderIds: string[]
): Promise<Map<string, string>> {
  const supabase = createServerSupabaseClient();
  const map = new Map<string, string>();
  if (!supabase || senderIds.length === 0) return map;

  const unique = [...new Set(senderIds)];
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", unique);

  if (error) throw new Error(error.message);
  for (const row of data ?? []) {
    map.set(row.id as string, row.full_name as string);
  }
  return map;
}

function mapMessage(
  row: DbSupportMessage,
  senderNames: Map<string, string>
): SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    senderName: senderNames.get(row.sender_id) ?? "Unknown",
    body: row.body,
    readByUser: row.read_by_user,
    readByAdmin: row.read_by_admin,
    createdAt: row.created_at,
  };
}

export async function createSupportTicket(
  userId: string,
  input: CreateSupportTicketInput
): Promise<SupportTicketWithMessages> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!name || !email || !subject || !message) {
    throw new Error("All fields are required");
  }

  const { data: ticketRow, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      user_id: userId,
      name,
      email,
      subject,
      status: "open",
      user_unread_count: 0,
      admin_unread_count: 1,
    })
    .select("*")
    .single();

  if (ticketError) throw new Error(ticketError.message);

  const ticket = mapTicket(ticketRow as DbSupportTicket);

  const { data: messageRow, error: messageError } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: ticket.id,
      sender_type: "user",
      sender_id: userId,
      body: message,
      read_by_user: true,
      read_by_admin: false,
    })
    .select("*")
    .single();

  if (messageError) throw new Error(messageError.message);

  const senderNames = await getSenderNames([userId]);
  return {
    ticket,
    messages: [mapMessage(messageRow as DbSupportMessage, senderNames)],
  };
}

export async function listUserSupportTickets(
  userId: string
): Promise<SupportTicket[]> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapTicket(row as DbSupportTicket));
}

export async function getSupportTicketById(
  ticketId: string
): Promise<SupportTicket | null> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapTicket(data as DbSupportTicket);
}

export async function getSupportTicketWithMessages(
  ticketId: string
): Promise<SupportTicketWithMessages | null> {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket) return null;

  const supabase = createServerSupabaseClient();
  if (!supabase) return { ticket, messages: [] };

  const { data, error } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const senderIds = (data ?? []).map((m) => m.sender_id as string);
  const senderNames = await getSenderNames(senderIds);

  return {
    ticket,
    messages: (data ?? []).map((row) =>
      mapMessage(row as DbSupportMessage, senderNames)
    ),
  };
}

export async function markSupportTicketReadByUser(
  ticketId: string
): Promise<void> {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket || ticket.userUnreadCount === 0) return;

  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error: ticketError } = await supabase
    .from("support_tickets")
    .update({ user_unread_count: 0 })
    .eq("id", ticketId)
    .gt("user_unread_count", 0);

  if (ticketError) throw new Error(ticketError.message);

  const { error: msgError } = await supabase
    .from("support_messages")
    .update({ read_by_user: true })
    .eq("ticket_id", ticketId)
    .eq("read_by_user", false);

  if (msgError) throw new Error(msgError.message);
}

export async function markSupportTicketReadByAdmin(
  ticketId: string
): Promise<void> {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket || ticket.adminUnreadCount === 0) return;

  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { error: ticketError } = await supabase
    .from("support_tickets")
    .update({ admin_unread_count: 0 })
    .eq("id", ticketId)
    .gt("admin_unread_count", 0);

  if (ticketError) throw new Error(ticketError.message);

  const { error: msgError } = await supabase
    .from("support_messages")
    .update({ read_by_admin: true })
    .eq("ticket_id", ticketId)
    .eq("read_by_admin", false);

  if (msgError) throw new Error(msgError.message);
}

export async function addSupportMessage(input: {
  ticketId: string;
  senderType: "user" | "admin";
  senderId: string;
  body: string;
}): Promise<SupportMessage> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const body = input.body.trim();
  if (!body) throw new Error("Message is required");

  const ticket = await getSupportTicketById(input.ticketId);
  if (!ticket) throw new Error("Ticket not found");

  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      ticket_id: input.ticketId,
      sender_type: input.senderType,
      sender_id: input.senderId,
      body,
      read_by_user: input.senderType === "user",
      read_by_admin: input.senderType === "admin",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.senderType === "user") {
    updates.admin_unread_count = ticket.adminUnreadCount + 1;
    if (ticket.status === "answered" || ticket.status === "closed") {
      updates.status = "open";
    }
  } else {
    updates.user_unread_count = ticket.userUnreadCount + 1;
    updates.status = "answered";
  }

  const { error: updateError } = await supabase
    .from("support_tickets")
    .update(updates)
    .eq("id", input.ticketId);

  if (updateError) throw new Error(updateError.message);

  const senderNames = await getSenderNames([input.senderId]);
  return mapMessage(data as DbSupportMessage, senderNames);
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: SupportTicketStatus
): Promise<SupportTicket> {
  const supabase = createServerSupabaseClient();
  if (!supabase) throw new Error("Database not configured");

  const { data, error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapTicket(data as DbSupportTicket);
}

export async function getUserSupportUnreadCount(userId: string): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from("support_tickets")
    .select("user_unread_count")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (data ?? []).reduce(
    (sum, row) => sum + (row.user_unread_count as number),
    0
  );
}

export async function getAdminSupportUnreadCount(): Promise<number> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from("support_tickets")
    .select("admin_unread_count");

  if (error) throw new Error(error.message);
  return (data ?? []).reduce(
    (sum, row) => sum + (row.admin_unread_count as number),
    0
  );
}

export async function listAdminSupportTickets(
  params: AdminSupportTicketListParams = {}
): Promise<AdminSupportTicketListResult> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { tickets: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 10));
  const sortBy = params.sortBy ?? "updatedAt";
  const sortDir = params.sortDir ?? "desc";
  const search = params.search?.trim() ?? "";
  const status = params.status ?? "all";

  let query = supabase.from("support_tickets").select("*", { count: "exact" });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `subject.ilike.${term},email.ilike.${term},name.ilike.${term}`
    );
  }

  query = query.order(SORT_COLUMN_MAP[sortBy], { ascending: sortDir === "asc" });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(error.message);

  const tickets = (data ?? []).map((row) => mapTicket(row as DbSupportTicket));
  const userIds = [...new Set(tickets.map((t) => t.userId))];
  const userNames = await getSenderNames(userIds);

  const ticketIds = tickets.map((t) => t.id);
  const lastMessageMap = new Map<string, string>();

  if (ticketIds.length > 0) {
    const { data: messages, error: msgError } = await supabase
      .from("support_messages")
      .select("ticket_id, created_at")
      .in("ticket_id", ticketIds)
      .order("created_at", { ascending: false });

    if (msgError) throw new Error(msgError.message);

    for (const msg of messages ?? []) {
      const tid = msg.ticket_id as string;
      if (!lastMessageMap.has(tid)) {
        lastMessageMap.set(tid, msg.created_at as string);
      }
    }
  }

  const rows: AdminSupportTicketRow[] = tickets.map((ticket) => ({
    ...ticket,
    userName: userNames.get(ticket.userId) ?? ticket.name,
    lastMessageAt: lastMessageMap.get(ticket.id) ?? null,
  }));

  const total = count ?? 0;
  return {
    tickets: rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
