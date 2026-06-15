export type EmailLogStatus = "sent" | "failed";

export interface EmailSettingsView {
  id: string | null;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPasswordConfigured: boolean;
  senderName: string;
  senderEmail: string;
  updatedAt: string | null;
}

export interface EmailSettingsInput {
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  senderName?: string;
  senderEmail?: string;
}

export interface EmailLogRow {
  id: string;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  errorMessage: string | null;
  createdAt: string;
}

export interface EmailLogListParams {
  status?: EmailLogStatus;
  page?: number;
  pageSize?: number;
}

export interface EmailLogListResult {
  logs: EmailLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type BillingEmailType = "plan_changed" | "subscription_cancelled";
