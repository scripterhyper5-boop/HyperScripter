"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DataError, DataLoading } from "@/components/ui/data-state";
import type { SiteSettingsView } from "@/lib/site-settings/types";
import { cn } from "@/lib/utils";

import "highlight.js/styles/github-dark.css";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 animate-pulse items-center justify-center rounded-xl bg-white text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  }
);

const HEAD_EXAMPLES = [
  "Google AdSense verification",
  "Search Console verification",
  "Google Analytics",
  "Meta Pixel",
];

interface CodeSectionProps {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  examples?: string[];
}

function CodeSection({ title, description, value, onChange, examples }: CodeSectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-white p-5">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {examples && examples.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-gray-50">
        <CodeEditor
          value={value}
          language="html"
          placeholder="<!-- Paste HTML snippets here -->"
          onChange={(e) => onChange(e.target.value)}
          padding={16}
          data-color-mode="dark"
          style={{
            fontSize: 13,
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            backgroundColor: "transparent",
            minHeight: "180px",
          }}
          className="site-settings-editor !min-h-[180px] w-full !bg-transparent"
        />
      </div>
    </section>
  );
}

export default function AdminSiteSettingsPage() {
  const [saved, setSaved] = useState<SiteSettingsView | null>(null);
  const [headCode, setHeadCode] = useState("");
  const [bodyStartCode, setBodyStartCode] = useState("");
  const [bodyEndCode, setBodyEndCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/site-settings", { credentials: "include" });
      const data = (await res.json()) as SiteSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load site settings");

      setSaved(data);
      setHeadCode(data.headCode);
      setBodyStartCode(data.bodyStartCode);
      setBodyEndCode(data.bodyEndCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load site settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const isDirty =
    saved !== null &&
    (headCode !== saved.headCode ||
      bodyStartCode !== saved.bodyStartCode ||
      bodyEndCode !== saved.bodyEndCode);

  function handleReset() {
    if (!saved) return;
    setHeadCode(saved.headCode);
    setBodyStartCode(saved.bodyStartCode);
    setBodyEndCode(saved.bodyEndCode);
    toast.message("Changes discarded");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headCode, bodyStartCode, bodyEndCode }),
      });
      const data = (await res.json()) as SiteSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save site settings");

      setSaved(data);
      setHeadCode(data.headCode);
      setBodyStartCode(data.bodyStartCode);
      setBodyEndCode(data.bodyEndCode);
      toast.success("Site settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save site settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Site Settings"
          description="Manage global HTML snippets injected across the site"
        />
        <DataLoading message="Loading site settings…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Site Settings"
          description="Manage global HTML snippets injected across the site"
        />
        <DataError message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site Settings"
        description="Manage global HTML snippets injected across the site"
      >
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
        <CodeSection
          title="Head Code"
          description="Injected inside the document <head>. Use for verification meta tags and analytics loaders."
          value={headCode}
          onChange={setHeadCode}
          examples={HEAD_EXAMPLES}
        />

        <CodeSection
          title="Body Start Code"
          description="Injected immediately after the opening <body> tag."
          value={bodyStartCode}
          onChange={setBodyStartCode}
        />

        <CodeSection
          title="Body End Code"
          description="Injected immediately before the closing </body> tag."
          value={bodyEndCode}
          onChange={setBodyEndCode}
        />
      </div>
    </div>
  );
}
