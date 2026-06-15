"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { SupportConversation } from "@/components/support/support-conversation";
import { SupportStatusBadge } from "@/components/support/support-status-badge";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createUserTicket,
  fetchUserTicket,
  fetchUserTickets,
  replyToUserTicket,
} from "@/lib/api/support-client";
import { useSupportTicketRealtime } from "@/hooks/use-support-realtime";
import { formatAdminDateShort } from "@/lib/admin/format";
import type { SupportTicket, SupportTicketWithMessages } from "@/lib/support/types";
import { cn } from "@/lib/utils";

export function SupportView() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<SupportTicketWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  const loadTickets = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetchUserTickets();
      setTickets(data);
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (ticketId: string, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoadingThread(true);
    try {
      const data = await fetchUserTicket(ticketId);
      setConversation(data);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, userUnreadCount: 0 } : t
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const result = await createUserTicket(form);
      toast.success("Ticket created");
      setShowCreate(false);
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
      await loadTickets();
      setSelectedId(result.ticket.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    setSending(true);
    try {
      await replyToUserTicket(selectedId, reply.trim());
      setReply("");
      await loadThread(selectedId);
      await loadTickets();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Support
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a ticket or view your conversation history
          </p>
        </div>
        <Button variant="violet-glow" onClick={() => setShowCreate(true)}>
          <MessageSquarePlus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {loading ? (
        <DataLoading message="Loading tickets..." />
      ) : error ? (
        <DataError message={error} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="saas-card border border-border p-3">
            {tickets.length === 0 ? (
              <DataEmpty
                title="No tickets yet"
                description="Create your first support ticket"
              />
            ) : (
              <ul className="space-y-1">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                        selectedId === ticket.id
                          ? "bg-violet/10 ring-1 ring-border"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {ticket.subject}
                        </p>
                        {ticket.userUnreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-[10px] font-semibold text-white">
                            {ticket.userUnreadCount}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <SupportStatusBadge status={ticket.status} />
                        <span className="text-[10px] text-muted-foreground">
                          {formatAdminDateShort(ticket.updatedAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="saas-card min-h-[420px] rounded-xl border border-border p-5">
            {!selectedId ? (
              <DataEmpty
                title="Select a ticket"
                description="Choose a ticket from the list to view the conversation"
              />
            ) : loadingThread || !conversation ? (
              <DataLoading message="Loading conversation..." />
            ) : (
              <div className="flex h-full flex-col">
                <div className="mb-4 border-b border-border pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {conversation.ticket.subject}
                    </h2>
                    <SupportStatusBadge status={conversation.ticket.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {conversation.ticket.email} · Created{" "}
                    {formatAdminDateShort(conversation.ticket.createdAt)}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  <SupportConversation messages={conversation.messages} />
                </div>

                {conversation.ticket.status !== "closed" && (
                  <form onSubmit={handleReply} className="mt-4 space-y-3 border-t border-border pt-4">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write your reply..."
                      rows={3}
                      required
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="violet-glow" disabled={sending}>
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send Reply
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/20 p-4 sm:items-center">
          <div
            className="saas-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-semibold">Create Support Ticket</h2>
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-name">Name</Label>
                <Input
                  id="support-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-subject">Subject</Label>
                <Input
                  id="support-subject"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-message">Message</Label>
                <Textarea
                  id="support-message"
                  value={form.message}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  rows={5}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="violet-glow" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
