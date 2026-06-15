"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, RotateCcw, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import type { EmailLogListResult, EmailLogStatus, EmailSettingsView } from "@/lib/email/types";
import { cn } from "@/lib/utils";

export default function AdminEmailSettingsPage() {
  const [saved, setSaved] = useState<EmailSettingsView | null>(null);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [senderName, setSenderName] = useState("HyperScripter");
  const [senderEmail, setSenderEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logFilter, setLogFilter] = useState<"" | EmailLogStatus>("");
  const [logs, setLogs] = useState<EmailLogListResult | null>(null);
  const [logsLoading, setLogsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/email-settings", { credentials: "include" });
      const data = (await res.json()) as EmailSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load email settings");

      setSaved(data);
      setSmtpHost(data.smtpHost);
      setSmtpPort(String(data.smtpPort || 587));
      setSmtpUsername(data.smtpUsername);
      setSenderName(data.senderName);
      setSenderEmail(data.senderEmail);
      setSmtpPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "20" });
      if (logFilter) params.set("status", logFilter);
      const res = await fetch(`/api/admin/email-logs?${params}`, { credentials: "include" });
      const data = (await res.json()) as EmailLogListResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load email logs");
      setLogs(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load email logs");
    } finally {
      setLogsLoading(false);
    }
  }, [logFilter]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const isDirty =
    saved !== null &&
    (smtpHost !== saved.smtpHost ||
      smtpPort !== String(saved.smtpPort) ||
      smtpUsername !== saved.smtpUsername ||
      senderName !== saved.senderName ||
      senderEmail !== saved.senderEmail ||
      smtpPassword.trim().length > 0);

  function handleReset() {
    if (!saved) return;
    setSmtpHost(saved.smtpHost);
    setSmtpPort(String(saved.smtpPort || 587));
    setSmtpUsername(saved.smtpUsername);
    setSenderName(saved.senderName);
    setSenderEmail(saved.senderEmail);
    setSmtpPassword("");
    toast.message("Changes discarded");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost,
          smtpPort: Number.parseInt(smtpPort, 10) || 587,
          smtpUsername,
          smtpPassword: smtpPassword.trim() || undefined,
          senderName,
          senderEmail,
        }),
      });
      const data = (await res.json()) as EmailSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save email settings");

      setSaved(data);
      setSmtpPassword("");
      toast.success("Email settings saved");
      void loadLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save email settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/email-settings/test", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmail.trim() || undefined }),
      });
      const data = (await res.json()) as { error?: string; sentTo?: string };
      if (!res.ok) throw new Error(data.error ?? "Test email failed");
      toast.success(`Test email sent to ${data.sentTo}`);
      void loadLogs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test email failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Email Settings" description="Configure SMTP and view delivery logs" />
        <DataLoading message="Loading email settings…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Email Settings" description="Configure SMTP and view delivery logs" />
        <DataError message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Email Settings" description="Configure SMTP and view delivery logs">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handleReset}
            disabled={!isDirty || saving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={saving || !isDirty}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </AdminPageHeader>

      <div
        className={cn(
          "space-y-5 rounded-xl border border-border p-5",
          isDirty && "ring-1 ring-violet/30"
        )}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input
              id="smtpHost"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.example.com"
              className="border-border bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPort">SMTP Port</Label>
            <Input
              id="smtpPort"
              type="number"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
              className="border-border bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpUsername">SMTP Username</Label>
            <Input
              id="smtpUsername"
              value={smtpUsername}
              onChange={(e) => setSmtpUsername(e.target.value)}
              className="border-border bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPassword">SMTP Password</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              placeholder={
                saved?.smtpPasswordConfigured ? "•••••••• (leave blank to keep)" : "Enter password"
              }
              className="border-border bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderName">Sender Name</Label>
            <Input
              id="senderName"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="border-border bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senderEmail">Sender Email</Label>
            <Input
              id="senderEmail"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="noreply@hyperscripter.com"
              className="border-border bg-white"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-violet" />
            Test Email
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Send a test message to verify SMTP settings. Leave blank to send to your admin email.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com (optional)"
              className="max-w-sm border-border bg-white"
            />
            <Button
              variant="outline"
              className="border-border"
              onClick={() => void handleTestEmail()}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Test Email
            </Button>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Email Logs</h2>
            <p className="text-sm text-muted-foreground">Recent delivery attempts</p>
          </div>
          <div className="flex gap-2">
            {(["", "sent", "failed"] as const).map((status) => (
              <Button
                key={status || "all"}
                size="sm"
                variant={logFilter === status ? "default" : "outline"}
                className={logFilter !== status ? "border-border" : undefined}
                onClick={() => setLogFilter(status)}
              >
                {status === "" ? "All" : status === "sent" ? "Sent" : "Failed"}
              </Button>
            ))}
          </div>
        </div>

        {logsLoading ? (
          <DataLoading message="Loading email logs…" />
        ) : !logs?.logs.length ? (
          <DataEmpty title="No email logs yet" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-white text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{log.recipient}</td>
                    <td className="px-4 py-3">{log.subject}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          log.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-600"
                        )}
                      >
                        {log.status}
                      </span>
                      {log.errorMessage && (
                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                          {log.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
