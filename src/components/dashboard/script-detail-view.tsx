"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  FileDown,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScriptSectionCard } from "@/components/dashboard/script-section-card";
import { LockedLabel } from "@/components/dashboard/upgrade-prompt";
import { LimitReachedModal } from "@/components/dashboard/limit-reached-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { usePlan } from "@/hooks/use-plan";
import {
  deleteScriptFromHistory,
  getScriptById,
  updateScriptInHistory,
  type ScriptHistoryItem,
} from "@/lib/auth/script-history";
import {
  deleteScriptApi,
  fetchScriptById,
  updateScriptApi,
} from "@/lib/api/scripts-client";
import {
  fetchScriptShareStatus,
  setScriptShare,
} from "@/lib/api/team-client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getOptionLabel,
  nicheOptions,
  toneOptions,
  videoTypeOptions,
} from "@/lib/generator";
import { buildFullScriptText, downloadScriptExport } from "@/lib/scripts/export";
import {
  requestScriptGenerationWithRetry,
  scriptHistoryToInput,
  GenerateApiError,
} from "@/lib/generate-client";

interface ScriptDetailViewProps {
  scriptId: string;
}

export function ScriptDetailView({ scriptId }: ScriptDetailViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { hasFeature, allowance, nextPlan, refreshUsage, planId } = usePlan();
  const [script, setScript] = useState<ScriptHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState("");
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ScriptHistoryItem | null>(null);
  const [sharedWithWorkspace, setSharedWithWorkspace] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const isTeamPlan = planId === "team";

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadScript() {
      setLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const item = await fetchScriptById(scriptId);
          setScript(item);
          setDraft(item);
        } else {
          const item = getScriptById(user!.id, scriptId);
          setScript(item);
          setDraft(item);
        }
      } catch {
        const item = getScriptById(user!.id, scriptId);
        setScript(item);
        setDraft(item);
      } finally {
        setLoading(false);
      }
    }

    void loadScript();
  }, [user, scriptId]);

  useEffect(() => {
    if (!user || !isTeamPlan || !isSupabaseConfigured()) return;

    async function loadShareStatus() {
      try {
        const status = await fetchScriptShareStatus(scriptId);
        setSharedWithWorkspace(status.shared);
      } catch {
        setSharedWithWorkspace(false);
      }
    }

    void loadShareStatus();
  }, [user, scriptId, isTeamPlan]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border border-violet/20" />
          <div className="absolute inset-0 animate-spin rounded-full border-t border-violet" />
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-sm font-medium">Script not found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted or the link is invalid.
        </p>
        <Button variant="violet-glow" className="mt-6" asChild>
          <Link href="/dashboard/scripts">Back to Scripts</Link>
        </Button>
      </div>
    );
  }

  const activeScript = script;

  async function handleCopyAll() {
    if (!hasFeature("copyToClipboard")) return;
    await navigator.clipboard.writeText(buildFullScriptText(activeScript));
    setCopied(true);
    toast.success("Full script copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!user) return;
    if (!window.confirm("Delete this script permanently?")) return;

    try {
      if (isSupabaseConfigured()) {
        await deleteScriptApi(activeScript.id);
      } else {
        deleteScriptFromHistory(user.id, activeScript.id);
      }
      toast.success("Script deleted");
      router.push("/dashboard/scripts");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete script");
    }
  }

  function openEdit() {
    setDraft(activeScript);
    setEditing(true);
  }

  function closeEdit() {
    setEditing(false);
    setDraft(activeScript);
  }

  async function saveEdit() {
    if (!user || !draft) return;

    try {
      let updated: ScriptHistoryItem | null = null;
      if (isSupabaseConfigured()) {
        updated = await updateScriptApi(activeScript.id, {
          topic: draft.topic,
          output: draft.output,
        });
      } else {
        updated = updateScriptInHistory(user.id, activeScript.id, {
          topic: draft.topic,
          output: draft.output,
        });
      }

      if (updated) {
        setScript(updated);
        setDraft(updated);
        setEditing(false);
        toast.success("Script updated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update script");
    }
  }

  async function handleRegenerate() {
    if (!user) return;

    if (!allowance.allowed) {
      setLimitModalOpen(true);
      toast.error("Monthly limit reached");
      return;
    }

    setRegenerateError("");
    setRegenerating(true);

    try {
      const { output } = await requestScriptGenerationWithRetry(
        scriptHistoryToInput(activeScript),
        {
          onRetry: (attempt) => {
            toast.message(`Retrying generation (${attempt}/3)...`);
          },
        }
      );

      await refreshUsage();

      let updated: ScriptHistoryItem | null = null;
      if (isSupabaseConfigured()) {
        updated = await updateScriptApi(activeScript.id, { output });
      } else {
        updated = updateScriptInHistory(user.id, activeScript.id, { output });
      }

      if (updated) {
        setScript(updated);
        setDraft(updated);
        toast.success("Script regenerated with Gemini");
      }
    } catch (err) {
      if (err instanceof GenerateApiError && err.code === "LIMIT_REACHED") {
        setLimitModalOpen(true);
        setRegenerateError("Monthly limit reached");
        toast.error("Monthly limit reached");
      } else {
        const message =
          err instanceof Error ? err.message : "Failed to regenerate script";
        setRegenerateError(message);
        toast.error(message);
      }
    } finally {
      setRegenerating(false);
    }
  }

  async function handleShareToggle() {
    if (!isTeamPlan) return;

    setShareLoading(true);
    try {
      const next = !sharedWithWorkspace;
      await setScriptShare(activeScript.id, next);
      setSharedWithWorkspace(next);
      toast.success(
        next ? "Script shared with workspace" : "Script removed from workspace"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update sharing");
    } finally {
      setShareLoading(false);
    }
  }

  const formattedDate = new Date(activeScript.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-6">
        <Link
          href="/dashboard/scripts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Scripts
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-4">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {activeScript.topic}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="font-normal">
                {getOptionLabel(videoTypeOptions, activeScript.videoType)}
              </Badge>
              <Badge variant="muted" className="font-normal">
                {getOptionLabel(toneOptions, activeScript.tone)}
              </Badge>
              <Badge variant="muted" className="font-normal">
                {getOptionLabel(nicheOptions, activeScript.niche)}
              </Badge>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasFeature("copyToClipboard") ? (
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            ) : (
              <LockedLabel feature="copyToClipboard" />
            )}

            {hasFeature("exportTxt") ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadScriptExport(activeScript, "txt")}
              >
                <FileDown className="h-4 w-4" />
                Export TXT
              </Button>
            ) : (
              <LockedLabel feature="exportTxt" />
            )}

            {hasFeature("exportDocx") ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadScriptExport(activeScript, "docx")}
              >
                <FileDown className="h-4 w-4" />
                Export DOCX
              </Button>
            ) : (
              <LockedLabel feature="exportDocx" />
            )}

            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleRegenerate()}
              disabled={regenerating}
            >
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-300"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {regenerateError && (
        <p className="text-sm text-red-600" role="alert">
          {regenerateError}
        </p>
      )}

      {isTeamPlan && isSupabaseConfigured() && (
        <div className="saas-card flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10 ring-1 ring-violet/20">
              <Users className="h-4 w-4 text-violet" />
            </div>
            <div>
              <p className="text-sm font-medium">Share with workspace</p>
              <p className="text-xs text-muted-foreground">
                Make this script visible to your team
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sharedWithWorkspace}
            disabled={shareLoading}
            onClick={() => void handleShareToggle()}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
              sharedWithWorkspace ? "bg-violet" : "bg-white/10"
            } ${shareLoading ? "opacity-50" : ""}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                sharedWithWorkspace ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}

      <div className="grid gap-4">
        <ScriptSectionCard title="Hook" content={activeScript.output.hook} />
        <ScriptSectionCard title="Intro" content={activeScript.output.intro} />
        <ScriptSectionCard title="Main Script" content={activeScript.output.mainScript} />
        <ScriptSectionCard title="CTA" content={activeScript.output.cta} />
        <ScriptSectionCard title="Caption" content={activeScript.output.caption} />
        <ScriptSectionCard
          title="Hashtags"
          content={activeScript.output.hashtags}
          variant="tags"
        />
      </div>

      {editing && draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/20 p-4 sm:items-center">
          <div
            className="saas-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-script-title"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="edit-script-title" className="text-lg font-semibold">
                Edit Script
              </h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
                aria-label="Close edit dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={draft.topic}
                  onChange={(e) =>
                    setDraft({ ...draft, topic: e.target.value })
                  }
                />
              </div>
              {(
                [
                  ["edit-hook", "Hook", "hook"],
                  ["edit-intro", "Intro", "intro"],
                  ["edit-main", "Main Script", "mainScript"],
                  ["edit-cta", "CTA", "cta"],
                  ["edit-caption", "Caption", "caption"],
                ] as const
              ).map(([id, label, key]) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <Textarea
                    id={id}
                    rows={3}
                    value={draft.output[key]}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        output: { ...draft.output, [key]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="edit-hashtags">Hashtags</Label>
                <Textarea
                  id="edit-hashtags"
                  rows={2}
                  value={draft.output.hashtags.join(" ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      output: {
                        ...draft.output,
                        hashtags: e.target.value
                          .split(/\s+/)
                          .filter(Boolean)
                          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeEdit}>
                Cancel
              </Button>
              <Button variant="violet-glow" onClick={saveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <LimitReachedModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        currentPlan={planId}
        nextPlan={nextPlan}
      />
    </div>
  );
}
