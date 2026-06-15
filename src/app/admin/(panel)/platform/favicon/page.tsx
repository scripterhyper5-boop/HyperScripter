"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DataError, DataLoading } from "@/components/ui/data-state";
import {
  DEFAULT_FAVICON,
  type FaviconSettings,
  isFaviconConfigured,
} from "@/lib/favicon/types";
import { validateFaviconFile } from "@/lib/favicon/validation";
import { cn } from "@/lib/utils";

interface FaviconResponse {
  favicon: FaviconSettings | null;
  active: FaviconSettings;
  isCustom: boolean;
  error?: string;
  message?: string;
}

function previewSrc(settings: FaviconSettings, size: number): string {
  if (size === 16 && settings.icon16Url) return settings.icon16Url;
  if (size === 32 && settings.icon32Url) return settings.icon32Url;
  if (size === 180 && settings.appleTouchIconUrl) return settings.appleTouchIconUrl;
  return settings.url;
}

function SizePreview({
  label,
  size,
  src,
}: {
  label: string;
  size: number;
  src: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-4">
      <div
        className="flex items-center justify-center overflow-hidden rounded-lg border border-border bg-gray-50"
        style={{ width: Math.max(size, 32), height: Math.max(size, 32) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${label} favicon preview`}
          width={size}
          height={size}
          className="object-contain"
        />
      </div>
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{size}×{size}</p>
    </div>
  );
}

function BrowserTabPreview({ src, title }: { src: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-gray-100 px-3 py-2">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-white px-2 py-1 text-xs text-muted-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" width={14} height={14} className="shrink-0 object-contain" />
          <span className="truncate">{title} — HyperScripter</span>
        </div>
      </div>
      <div className="h-24 bg-gradient-to-b from-gray-50 to-white" />
    </div>
  );
}

export default function AdminFaviconPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<FaviconSettings | null>(null);
  const [active, setActive] = useState<FaviconSettings>(DEFAULT_FAVICON);
  const [isCustom, setIsCustom] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/favicon", { credentials: "include" });
      const data = (await res.json()) as FaviconResponse;
      if (!res.ok) throw new Error(data.error ?? "Failed to load favicon settings");

      setSaved(data.favicon);
      setActive(data.active);
      setIsCustom(data.isCustom);
      setPendingFile(null);
      setPendingPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load favicon settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!pendingFile) {
      setPendingPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const displaySettings = useMemo<FaviconSettings>(() => {
    if (pendingPreviewUrl) {
      const ext = pendingFile?.name.toLowerCase() ?? "";
      const type = ext.endsWith(".svg") ? "svg" : ext.endsWith(".ico") ? "ico" : "png";
      return {
        url: pendingPreviewUrl,
        type,
        updatedAt: new Date().toISOString(),
      };
    }
    return active;
  }, [active, pendingFile, pendingPreviewUrl]);

  const isDirty = Boolean(pendingFile);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateFaviconFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setPendingFile(file);
  }

  function handleDiscard() {
    setPendingFile(null);
    toast.message("Upload discarded");
  }

  async function handleSave() {
    if (!pendingFile) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("favicon", pendingFile);

      const res = await fetch("/api/admin/favicon", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json()) as FaviconResponse;
      if (!res.ok) throw new Error(data.error ?? "Failed to upload favicon");

      setSaved(data.favicon);
      setActive(data.favicon ?? DEFAULT_FAVICON);
      setIsCustom(Boolean(data.favicon));
      setPendingFile(null);
      toast.success("Favicon updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload favicon");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove custom favicon and revert to the default?")) return;

    setRemoving(true);
    try {
      const res = await fetch("/api/admin/favicon", {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as FaviconResponse;
      if (!res.ok) throw new Error(data.error ?? "Failed to remove favicon");

      setSaved(null);
      setActive(DEFAULT_FAVICON);
      setIsCustom(false);
      setPendingFile(null);
      toast.success("Favicon updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove favicon");
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Favicon Settings"
          description="Upload and manage the website favicon"
        />
        <DataLoading message="Loading favicon settings…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Favicon Settings"
          description="Upload and manage the website favicon"
        />
        <DataError message={error} />
      </div>
    );
  }

  const tabPreviewSrc = previewSrc(displaySettings, 16);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Favicon Settings"
        description="Upload and manage the website favicon (.png, .svg, .ico — max 2MB)"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handleDiscard}
            disabled={!isDirty || saving || removing}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Discard
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSave()}
            disabled={!isDirty || saving || removing}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </AdminPageHeader>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.svg,.ico,image/png,image/svg+xml,image/x-icon"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className={cn("space-y-6", isDirty && "rounded-xl ring-1 ring-violet/30")}>
        <section className="rounded-xl border border-border bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Current favicon</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isCustom || pendingFile
                  ? "Custom favicon is active on the public site after saving."
                  : "Using default favicon (/logo.svg)."}
              </p>
              {saved?.updatedAt && !pendingFile && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Last updated: {new Date(saved.updatedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="border-border" onClick={openFilePicker}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <Button variant="outline" size="sm" className="border-border" onClick={openFilePicker}>
                <ImagePlus className="mr-2 h-4 w-4" />
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-destructive hover:text-destructive"
                onClick={() => void handleRemove()}
                disabled={(!isCustom && !pendingFile) || saving || removing}
              >
                {removing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove
              </Button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-gray-50 p-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displaySettings.url}
                alt="Current favicon"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-medium">
                {pendingFile ? pendingFile.name : isCustom ? "Custom favicon" : "Default favicon"}
              </p>
              <p className="text-muted-foreground">
                Type: {displaySettings.type.toUpperCase()}
                {pendingFile ? ` · ${(pendingFile.size / 1024).toFixed(1)} KB` : ""}
              </p>
              {!pendingFile && saved && isFaviconConfigured(saved) && (
                <p className="truncate text-xs text-muted-foreground">{saved.url}</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-white p-5">
          <div>
            <h2 className="text-sm font-semibold">Preview</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How the favicon appears in browser tabs and on devices.
            </p>
          </div>

          <BrowserTabPreview src={tabPreviewSrc} title="Home" />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SizePreview label="Small" size={16} src={previewSrc(displaySettings, 16)} />
            <SizePreview label="Standard" size={32} src={previewSrc(displaySettings, 32)} />
            <SizePreview label="Medium" size={48} src={previewSrc(displaySettings, 32)} />
            <SizePreview
              label="Apple Touch"
              size={180}
              src={previewSrc(displaySettings, 180)}
            />
          </div>

          {pendingFile && (
            <p className="text-xs text-violet">
              Previewing unsaved upload. Click Save Changes to apply to the live site.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-gray-50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Auto-generated sizes</p>
          <p className="mt-1">
            When you upload a PNG, SVG, or ICO file, the system automatically creates{" "}
            <code className="rounded bg-white px-1">favicon-16x16.png</code>,{" "}
            <code className="rounded bg-white px-1">favicon-32x32.png</code>, and{" "}
            <code className="rounded bg-white px-1">apple-touch-icon.png</code> in{" "}
            <code className="rounded bg-white px-1">public/uploads/favicon/</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
