import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  EmailLogListParams,
  EmailLogListResult,
  EmailLogRow,
  EmailLogStatus,
} from "@/lib/email/types";

interface DbEmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  error_message: string | null;
  created_at: string;
}

function mapLog(row: DbEmailLog): EmailLogRow {
  return {
    id: row.id,
    recipient: row.recipient,
    subject: row.subject,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function createEmailLog(input: {
  recipient: string;
  subject: string;
  status: EmailLogStatus;
  errorMessage?: string | null;
}): Promise<void> {
  const supabase = createServerSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.from("email_logs").insert({
      recipient: input.recipient,
      subject: input.subject,
      status: input.status,
      error_message: input.errorMessage ?? null,
      created_at: new Date().toISOString(),
    });

    if (error && error.code !== "PGRST205" && error.code !== "42P01") {
      console.error("[createEmailLog]", error.message);
    }
  } catch (error) {
    console.error("[createEmailLog]", error);
  }
}

export async function listEmailLogs(
  params: EmailLogListParams = {}
): Promise<EmailLogListResult> {
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return { logs: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, params.pageSize ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("email_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    logs: (data ?? []).map((row) => mapLog(row as DbEmailLog)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
