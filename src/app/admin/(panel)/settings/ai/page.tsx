"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataError, DataLoading } from "@/components/ui/data-state";
import type { AdminAiSettingsView, AiConnectionStatus } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

function StatusIndicator({ status }: { status: AiConnectionStatus }) {
  const config = {
    connected: {
      label: "Connected",
      icon: CheckCircle2,
      className: "text-emerald-600 bg-green-500/10 ring-green-500/20",
    },
    invalid: {
      label: "Invalid",
      icon: XCircle,
      className: "text-red-600 bg-red-500/10 ring-red-500/20",
    },
    not_configured: {
      label: "Not Configured",
      icon: AlertTriangle,
      className: "text-amber-600 bg-amber-500/10 ring-amber-500/20",
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ring-1",
        config.className
      )}
    >
      <Icon className="h-4 w-4" />
      {config.label}
    </div>
  );
}

export default function AdminAiSettingsPage() {
  const [settings, setSettings] = useState<AdminAiSettingsView | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<AiConnectionStatus | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai", { credentials: "include" });
      const data = (await res.json()) as AdminAiSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load AI settings");
      setSettings(data);
      setTestStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Enter a Gemini API key");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = (await res.json()) as AdminAiSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save API key");

      setSettings(data);
      setTestStatus("connected");
      setApiKey("");
      toast.success("Gemini API key saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save API key");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/ai/test", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as
        | { success: true; model: string }
        | { success: false; error: string };

      if (data.success) {
        setTestStatus("connected");
        toast.success(`Connected to ${data.model}`);
      } else {
        setTestStatus("invalid");
        toast.error(data.error ?? "Connection test failed");
      }
    } catch (err) {
      setTestStatus("invalid");
      toast.error(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="AI Settings"
          description="Manage Gemini API configuration"
        />
        <DataLoading message="Loading AI settings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="AI Settings"
          description="Manage Gemini API configuration"
        />
        <DataError message={error} />
      </div>
    );
  }

  const displayStatus = testStatus ?? settings?.status ?? "not_configured";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="AI Settings"
        description="Manage Gemini API configuration for script generation"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="saas-card border border-border p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/10 ring-1 ring-violet/20">
                <Sparkles className="h-5 w-5 text-violet" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Gemini API Key</h2>
                <p className="text-xs text-muted-foreground">
                  Stored encrypted in the database
                </p>
              </div>
            </div>
            <StatusIndicator status={displayStatus} />
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {settings?.maskedApiKey && (
              <div className="space-y-2">
                <Label>Current Key</Label>
                <p className="rounded-lg border border-border bg-white px-3 py-2 font-mono text-sm text-muted-foreground">
                  {settings.maskedApiKey}
                </p>
                {settings.source === "environment" && (
                  <p className="text-xs text-amber-600">
                    Currently loaded from environment variable. Save to store in database.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">
                {settings?.maskedApiKey ? "New API Key" : "Gemini API Key"}
              </Label>
              <div className="relative">
                <Input
                  id="gemini-api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="pr-10 font-mono"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="violet-glow" disabled={saving || !apiKey.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-border"
                disabled={testing || displayStatus === "not_configured"}
                onClick={() => void handleTest()}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
            </div>
          </form>
        </section>

        <section className="saas-card border border-border p-6">
          <h2 className="mb-4 text-base font-semibold">Configuration</h2>
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="font-medium capitalize">{settings?.provider ?? "gemini"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Active Model</dt>
              <dd className="font-mono text-xs">{settings?.model ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Storage</dt>
              <dd className="font-medium capitalize">
                {settings?.source === "database"
                  ? "Database (encrypted)"
                  : settings?.source === "environment"
                    ? "Environment fallback"
                    : "Not configured"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="text-muted-foreground">
                {settings?.updatedAt
                  ? new Date(settings.updatedAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg border border-border bg-white p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Priority order</p>
            <p className="mt-1">
              Database key → <code className="text-violet">GEMINI_API_KEY</code> in .env.local
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
