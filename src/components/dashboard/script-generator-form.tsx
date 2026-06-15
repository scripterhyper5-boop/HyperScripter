"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Wand2, Zap, RotateCcw } from "lucide-react";
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
import { useAuth } from "@/components/providers/auth-provider";
import { usePlan } from "@/hooks/use-plan";
import { LimitReachedModal } from "@/components/dashboard/limit-reached-modal";
import { LockedLabel } from "@/components/dashboard/upgrade-prompt";
import { toast } from "sonner";
import { saveScriptToHistory } from "@/lib/auth/script-history";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  requestScriptGenerationWithRetry,
  GenerateApiError,
} from "@/lib/generate-client";
import {
  type GeneratorInput,
  type HookStyle,
  type Niche,
  type Tone,
  type VideoLength,
  type VideoType,
  hookStyleOptions,
  lengthOptions,
  nicheOptions,
  toneOptions,
  videoTypeOptions,
} from "@/lib/generator";

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function ScriptGeneratorForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasFeature, allowance, nextPlan, refreshUsage, planId } = usePlan();

  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState<Niche>("business");
  const [videoType, setVideoType] = useState<VideoType>("tutorial");
  const [videoLength, setVideoLength] = useState<VideoLength>("30s");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<Tone>("casual");
  const [hookStyle, setHookStyle] = useState<HookStyle>("curiosity");
  const [keywords, setKeywords] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  function buildPayload(): GeneratorInput {
    return {
      topic: topic.trim(),
      niche,
      videoType,
      videoLength,
      audience: audience.trim(),
      tone,
      hookStyle,
      keywords: keywords.trim(),
      callToAction: callToAction.trim(),
    };
  }

  async function runGeneration() {
    setError("");
    setLoading(true);
    setRetrying(false);

    try {
      const { output, scriptId } = await requestScriptGenerationWithRetry(buildPayload(), {
        onRetry: (attempt) => {
          setRetrying(true);
          setError(`Generation failed. Retrying (${attempt}/3)...`);
        },
      });

      if (!user) {
        throw new Error("You must be signed in to save scripts.");
      }

      await refreshUsage();

      let targetId = scriptId;
      if (!targetId) {
        const entry = saveScriptToHistory(user.id, {
          topic: topic.trim(),
          niche,
          videoType,
          tone,
          hookStyle,
          audience: audience.trim(),
          videoLength,
          keywords: keywords.trim(),
          callToAction: callToAction.trim(),
          output,
        });
        targetId = entry.id;
      }

      if (isSupabaseConfigured() && scriptId) {
        toast.success("Script saved to your library");
      }

      router.push(`/dashboard/scripts/${targetId}`);
    } catch (err) {
      if (err instanceof GenerateApiError && err.code === "LIMIT_REACHED") {
        setLimitModalOpen(true);
        setError("Monthly limit reached");
      } else if (err instanceof GenerateApiError && err.code === "RATE_LIMITED") {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      }
      setLoading(false);
      setRetrying(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Video title / topic is required.");
      return;
    }

    if (user && !allowance.allowed) {
      setLimitModalOpen(true);
      setError("Monthly limit reached");
      return;
    }

    await runGeneration();
  }

  return (
    <div className="saas-card overflow-hidden rounded-2xl shadow-2xl shadow-black/20">
      <div className="flex items-center gap-3 border-b border-border px-6 py-5 sm:px-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet/20 ring-1 ring-violet/30">
          <Wand2 className="h-5 w-5 text-violet" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            Create a TikTok Script
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Fill in the details below — your script opens on a dedicated page
            {hasFeature("priorityGeneration") && (
              <span className="ml-2 inline-flex items-center gap-1 text-cyan">
                <Zap className="h-3 w-3" />
                Priority queue
              </span>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="space-y-8 px-6 py-8 sm:px-8">
        <FormSection title="1. Video Details">
          <div className="space-y-2">
            <Label htmlFor="topic">
              Video Title / Topic <span className="text-red-600">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="e.g. Morning Productivity Routine"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              className="border-border bg-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="niche">
                Niche <span className="text-red-600">*</span>
              </Label>
              <Select value={niche} onValueChange={(v) => setNiche(v as Niche)}>
                <SelectTrigger id="niche" className="border-border bg-white">
                  <SelectValue placeholder="Select niche" />
                </SelectTrigger>
                <SelectContent>
                  {nicheOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoType">Video Type</Label>
              <Select
                value={videoType}
                onValueChange={(v) => setVideoType(v as VideoType)}
              >
                <SelectTrigger id="videoType" className="border-border bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {videoTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="length">Video Length</Label>
              <Select
                value={videoLength}
                onValueChange={(v) => setVideoLength(v as VideoLength)}
              >
                <SelectTrigger id="length" className="border-border bg-white">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {lengthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              {hasFeature("advancedPreferences") ? (
                <Input
                  id="audience"
                  placeholder="e.g. Entrepreneurs, Students, Small Business Owners"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="border-border bg-white"
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    id="audience"
                    disabled
                    placeholder="Upgrade to Pro to set target audience"
                    className="border-border bg-white opacity-60"
                  />
                  <LockedLabel feature="advancedPreferences" />
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="2. Style & Tone">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                <SelectTrigger id="tone" className="border-border bg-white">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hookStyle">Hook Style</Label>
              <Select
                value={hookStyle}
                onValueChange={(v) => setHookStyle(v as HookStyle)}
              >
                <SelectTrigger id="hookStyle" className="border-border bg-white">
                  <SelectValue placeholder="Select hook style" />
                </SelectTrigger>
                <SelectContent>
                  {hookStyleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        <FormSection title="3. Additional Details">
          {hasFeature("advancedPreferences") ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords to Include</Label>
                <Textarea
                  id="keywords"
                  placeholder="AI tools, productivity, morning routine"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={3}
                  className="min-h-[88px] resize-none border-border bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta">Call To Action</Label>
                <Textarea
                  id="cta"
                  placeholder="Follow for more productivity tips"
                  value={callToAction}
                  onChange={(e) => setCallToAction(e.target.value)}
                  rows={2}
                  className="min-h-[72px] resize-none border-border bg-white"
                />
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-border bg-white/[0.02] p-4">
              <p className="text-sm text-muted-foreground">
                Keywords and custom CTAs are available on Pro and Team plans.
              </p>
              <LockedLabel feature="advancedPreferences" className="mt-2" />
            </div>
          )}
        </FormSection>

        {!allowance.unlimited && (
          <p className="text-xs text-muted-foreground">
            {allowance.used} / {allowance.limit} scripts used this month
            {allowance.remaining !== null && ` · ${allowance.remaining} remaining`}
          </p>
        )}

        {error && (
          <div className="space-y-3" role="alert">
            <p className="text-sm text-red-600">{error}</p>
            {!loading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void runGeneration()}
                className="border-border"
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </Button>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="violet-glow"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {retrying ? "Retrying with Gemini..." : "Generating with Gemini..."}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate TikTok Script
            </>
          )}
        </Button>
      </form>

      <LimitReachedModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        currentPlan={planId}
        nextPlan={nextPlan}
      />
    </div>
  );
}
