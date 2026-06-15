"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SupportConversation } from "@/components/support/support-conversation";
import { SupportStatusBadge } from "@/components/support/support-status-badge";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAdminTicket,
  fetchAdminTickets,
  updateAdminTicket,
} from "@/lib/api/admin-support-client";
import { useSupportTicketRealtime } from "@/hooks/use-support-realtime";
import { formatAdminDateShort } from "@/lib/admin/format";
import type {
  AdminSupportTicketRow,
  SupportTicketStatus,
  SupportTicketWithMessages,
} from "@/lib/support/types";
import { SUPPORT_STATUS_OPTIONS, SUPPORT_STATUS_LABELS } from "@/lib/support/types";

const PAGE_SIZE = 10;

export default function AdminSupportPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<SupportTicketStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<AdminSupportTicketRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<SupportTicketWithMessages | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [ticketStatus, setTicketStatus] = useState<SupportTicketStatus>("open");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadTickets = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        sortBy: "updatedAt",
        sortDir: "desc",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (status !== "all") params.set("status", status);

      const result = await fetchAdminTickets(params);
      setTickets(result.tickets);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [debouncedSearch, page, status]);

  const loadThread = useCallback(async (ticketId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoadingThread(true);
    try {
      const data = await fetchAdminTicket(ticketId);
      setConversation(data);
      setTicketStatus(data.ticket.status);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, adminUnreadCount: 0 } : t
        )
      );
    } catch (err) {
      if (!options?.silent) {
        toast.error(err instanceof Error ? err.message : "Failed to load ticket");
      }
    } finally {
      if (!options?.silent) setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
    else setConversation(null);
  }, [selectedId, loadThread]);

  const handleRealtimeUpdate = useCallback(() => {
    if (selectedId) void loadThread(selectedId, { silent: true });
    void loadTickets({ silent: true });
  }, [loadThread, loadTickets, selectedId]);

  useSupportTicketRealtime(selectedId, handleRealtimeUpdate);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateAdminTicket({
        ticketId: selectedId,
        status: ticketStatus,
        message: reply.trim() || undefined,
      });
      toast.success("Ticket updated");
      setReply("");
      await loadThread(selectedId);
      await loadTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setSaving(false);
    }
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support"
        description="Manage user support tickets and replies"
      />

      <div className="saas-card flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subject, email, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as SupportTicketStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SUPPORT_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SUPPORT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <DataLoading message="Loading tickets..." />
      ) : error ? (
        <DataError message={error} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <DataEmpty title="No tickets found" />
            ) : (
              <div className="saas-card overflow-hidden border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Unread</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(ticket.id)}
                      >
                        <TableCell className="font-medium">
                          {ticket.subject}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div>{ticket.userName}</div>
                          <div className="text-xs">{ticket.email}</div>
                        </TableCell>
                        <TableCell>
                          <SupportStatusBadge status={ticket.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatAdminDateShort(ticket.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {ticket.adminUnreadCount > 0 ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-[10px] font-semibold text-white">
                              {ticket.adminUnreadCount}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {from}–{to} of {total}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="saas-card min-h-[500px] rounded-xl border border-border p-5">
            {!selectedId ? (
              <DataEmpty
                title="Select a ticket"
                description="Click a row to view details and reply"
              />
            ) : loadingThread || !conversation ? (
              <DataLoading message="Loading ticket..." />
            ) : (
              <div className="flex h-full flex-col">
                <div className="mb-4 border-b border-border pb-4">
                  <h2 className="text-lg font-semibold">
                    {conversation.ticket.subject}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {conversation.ticket.name} · {conversation.ticket.email}
                  </p>
                </div>

                <div className="mb-4 max-h-64 overflow-y-auto">
                  <SupportConversation messages={conversation.messages} />
                </div>

                <form onSubmit={handleSave} className="mt-auto space-y-3 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={ticketStatus}
                      onValueChange={(v) =>
                        setTicketStatus(v as SupportTicketStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {SUPPORT_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reply to user</Label>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write your reply (optional)..."
                      rows={4}
                    />
                  </div>
                  <Button type="submit" variant="violet-glow" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Save & Reply
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
