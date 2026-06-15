export type SupportTicketStatus = "open" | "in_progress" | "answered" | "closed";

export type SupportSenderType = "user" | "admin";

export interface SupportTicket {
  id: string;
  userId: string;
  name: string;
  email: string;
  subject: string;
  status: SupportTicketStatus;
  userUnreadCount: number;
  adminUnreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderType: SupportSenderType;
  senderId: string;
  senderName: string;
  body: string;
  readByUser: boolean;
  readByAdmin: boolean;
  createdAt: string;
}

export interface SupportTicketWithMessages {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

export interface CreateSupportTicketInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface AdminSupportTicketRow extends SupportTicket {
  userName: string;
  lastMessageAt: string | null;
}

export type AdminSupportTicketSortField = "subject" | "status" | "createdAt" | "updatedAt";

export interface AdminSupportTicketListParams {
  search?: string;
  status?: SupportTicketStatus | "all";
  page?: number;
  pageSize?: number;
  sortBy?: AdminSupportTicketSortField;
  sortDir?: "asc" | "desc";
}

export interface AdminSupportTicketListResult {
  tickets: AdminSupportTicketRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  answered: "Answered",
  closed: "Closed",
};

export const SUPPORT_STATUS_OPTIONS: SupportTicketStatus[] = [
  "open",
  "in_progress",
  "answered",
  "closed",
];
