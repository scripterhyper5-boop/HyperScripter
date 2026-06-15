"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, ImagePlus, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ToggleField } from "@/components/admin/header-footer-form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataError, DataLoading } from "@/components/ui/data-state";
import {
  SEO_PREVIEW_KEY,
  SEO_PREVIEW_QUERY,
  type SeoSettings,
} from "@/lib/seo-settings/types";
import {
  validateOgImageFile,
  validateSeoSettings,
  type SeoValidationIssue,
} from "@/lib/seo-settings/validation";
import { cn } from "@/lib/utils";

function serializeSeo(seo: SeoSettings) {
  return JSON.stringify(seo);
}

function ValidationList({ issues }: { issues: SeoValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        SEO validation passed. No issues found.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {issues.map((issue) => (
        <li
          key={`${issue.field}-${issue.message}`}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            issue.level === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          )}
        >
          <span className="font-medium">{issue.field}:</span> {issue.message}
        </li>
      ))}
    </ul>
  );
}

function MetadataPreview({ seo }: { seo: SeoSettings }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Metadata preview
      </p>
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="truncate text-lg text-blue-700">{seo.siteTitle}</p>
        <p className="mt-1 truncate text-sm text-green-700">{seo.canonicalUrl}</p>
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{seo.metaDescription}</p>
      </div>
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-xs font-medium text-muted-foreground">Open Graph</p>
        <p className="mt-1 font-medium">{seo.ogTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{seo.ogDescription}</p>
        {seo.ogImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={seo.ogImageUrl}
            alt="OG preview"
            className="mt-3 max-h-32 rounded-lg border border-border object-cover"
          />
        )}
      </div>
    </div>
  );
}

export default function AdminSeoSettingsPage() {
  const ogInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<SeoSettings | null>(null);
  const [seo, setSeo] = useState<SeoSettings | null>(null);
  const [validation, setValidation] = useState<SeoValidationIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo-settings", { credentials: "include" });
      const data = (await res.json()) as {
        seo: SeoSettings;
        validation: SeoValidationIssue[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load SEO settings");

      setSaved(data.seo);
      setSeo(data.seo);
      setValidation(data.validation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SEO settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const isDirty = useMemo(() => {
    if (!saved || !seo) return false;
    return serializeSeo(saved) !== serializeSeo(seo);
  }, [saved, seo]);

  const liveValidation = useMemo(
    () => (seo ? validateSeoSettings(seo) : []),
    [seo]
  );

  function updateSeo(patch: Partial<SeoSettings>) {
    setSeo((current) => (current ? { ...current, ...patch } : current));
  }

  function updateSocialProfile(index: number, value: string) {
    if (!seo) return;
    const profiles = [...seo.organizationSocialProfiles];
    profiles[index] = value;
    updateSeo({ organizationSocialProfiles: profiles });
  }

  function addSocialProfile() {
    if (!seo) return;
    updateSeo({ organizationSocialProfiles: [...seo.organizationSocialProfiles, ""] });
  }

  function removeSocialProfile(index: number) {
    if (!seo) return;
    updateSeo({
      organizationSocialProfiles: seo.organizationSocialProfiles.filter((_, i) => i !== index),
    });
  }

  function handleDiscard() {
    if (!saved) return;
    setSeo(saved);
    toast.message("Changes discarded");
  }

  async function handleSave() {
    if (!seo) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo-settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seo),
      });
      const data = (await res.json()) as {
        seo: SeoSettings;
        validation: SeoValidationIssue[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to save SEO settings");

      setSaved(data.seo);
      setSeo(data.seo);
      setValidation(data.validation);
      toast.success("SEO settings saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("Reset all SEO settings to defaults?")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/admin/seo-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = (await res.json()) as {
        seo: SeoSettings;
        validation: SeoValidationIssue[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to reset SEO settings");

      setSaved(data.seo);
      setSeo(data.seo);
      setValidation(data.validation);
      toast.success("SEO settings reset to defaults");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset SEO settings");
    } finally {
      setResetting(false);
    }
  }

  function handlePreview() {
    if (!seo) return;
    sessionStorage.setItem(SEO_PREVIEW_KEY, JSON.stringify(seo));
    window.open(`/?${SEO_PREVIEW_QUERY}=1`, "_blank", "noopener,noreferrer");
    toast.message("Metadata preview opened in a new tab");
  }

  async function handleOgUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateOgImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploadingOg(true);
    try {
      const formData = new FormData();
      formData.append("ogImage", file);
      const res = await fetch("/api/admin/seo-settings/og-image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json()) as { seo: SeoSettings; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to upload OG image");

      setSaved(data.seo);
      setSeo(data.seo);
      toast.success("OG image uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload OG image");
    } finally {
      setUploadingOg(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="SEO Settings" description="Manage global SEO and metadata" />
        <DataLoading message="Loading SEO settings…" />
      </div>
    );
  }

  if (error || !seo) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="SEO Settings" description="Manage global SEO and metadata" />
        <DataError message={error ?? "Failed to load SEO settings"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="SEO Settings" description="Manage global SEO, Open Graph, analytics, and schema">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="border-border" onClick={() => void handleReset()} disabled={saving || resetting}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Defaults
          </Button>
          <Button variant="outline" size="sm" className="border-border" onClick={handlePreview}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview Metadata
          </Button>
          <Button variant="outline" size="sm" className="border-border" onClick={handleDiscard} disabled={!isDirty || saving}>
            Discard
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={!isDirty || saving || resetting}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </AdminPageHeader>

      <div className={cn("grid gap-6 xl:grid-cols-[1fr_360px]", isDirty && "rounded-xl ring-1 ring-violet/30 p-1")}>
        <div className="space-y-6">
          <section className="space-y-4 rounded-xl border border-border bg-white p-5">
            <h2 className="text-lg font-semibold">Global SEO</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" value={seo.siteName} onChange={(e) => updateSeo({ siteName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author-name">Author Name</Label>
                <Input id="author-name" value={seo.authorName} onChange={(e) => updateSeo({ authorName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-title">Site Title</Label>
              <Input id="site-title" value={seo.siteTitle} onChange={(e) => updateSeo({ siteTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea id="meta-description" rows={3} value={seo.metaDescription} onChange={(e) => updateSeo({ metaDescription: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta-keywords">Meta Keywords</Label>
              <Textarea id="meta-keywords" rows={2} value={seo.metaKeywords} onChange={(e) => updateSeo({ metaKeywords: e.target.value })} placeholder="keyword one, keyword two" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canonical-url">Canonical URL</Label>
              <Input id="canonical-url" value={seo.canonicalUrl} onChange={(e) => updateSeo({ canonicalUrl: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField id="index-website" label="Index Website" checked={seo.indexWebsite} onChange={(indexWebsite) => updateSeo({ indexWebsite })} />
              <ToggleField id="follow-links" label="Follow Links" checked={seo.followLinks} onChange={(followLinks) => updateSeo({ followLinks })} />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-white p-5">
            <h2 className="text-lg font-semibold">Open Graph</h2>
            <div className="space-y-2">
              <Label htmlFor="og-title">OG Title</Label>
              <Input id="og-title" value={seo.ogTitle} onChange={(e) => updateSeo({ ogTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="og-description">OG Description</Label>
              <Textarea id="og-description" rows={3} value={seo.ogDescription} onChange={(e) => updateSeo({ ogDescription: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="og-type">OG Type</Label>
                <select id="og-type" className="flex h-11 w-full rounded-lg border border-input bg-white px-3 text-sm" value={seo.ogType} onChange={(e) => updateSeo({ ogType: e.target.value as SeoSettings["ogType"] })}>
                  <option value="website">website</option>
                  <option value="article">article</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter-card">Twitter Card</Label>
                <select id="twitter-card" className="flex h-11 w-full rounded-lg border border-input bg-white px-3 text-sm" value={seo.twitterCard} onChange={(e) => updateSeo({ twitterCard: e.target.value as SeoSettings["twitterCard"] })}>
                  <option value="summary">summary</option>
                  <option value="summary_large_image">summary_large_image</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>OG Image</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Input value={seo.ogImageUrl} onChange={(e) => updateSeo({ ogImageUrl: e.target.value })} placeholder="/uploads/seo/og-image.png" />
                <input ref={ogInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void handleOgUpload(e)} />
                <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => ogInputRef.current?.click()} disabled={uploadingOg}>
                  {uploadingOg ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                  Upload OG Image
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-white p-5">
            <h2 className="text-lg font-semibold">Verification Codes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Google Search Console</Label><Input value={seo.googleSiteVerification} onChange={(e) => updateSeo({ googleSiteVerification: e.target.value })} /></div>
              <div className="space-y-2"><Label>Bing Webmaster</Label><Input value={seo.bingSiteVerification} onChange={(e) => updateSeo({ bingSiteVerification: e.target.value })} /></div>
              <div className="space-y-2"><Label>Yandex</Label><Input value={seo.yandexVerification} onChange={(e) => updateSeo({ yandexVerification: e.target.value })} /></div>
              <div className="space-y-2"><Label>Pinterest</Label><Input value={seo.pinterestVerification} onChange={(e) => updateSeo({ pinterestVerification: e.target.value })} /></div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-white p-5">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Google Analytics ID</Label><Input value={seo.googleAnalyticsId} onChange={(e) => updateSeo({ googleAnalyticsId: e.target.value })} placeholder="G-XXXXXXXX" /></div>
              <div className="space-y-2"><Label>Google Tag Manager ID</Label><Input value={seo.googleTagManagerId} onChange={(e) => updateSeo({ googleTagManagerId: e.target.value })} placeholder="GTM-XXXXXXX" /></div>
              <div className="space-y-2"><Label>Microsoft Clarity ID</Label><Input value={seo.microsoftClarityId} onChange={(e) => updateSeo({ microsoftClarityId: e.target.value })} /></div>
              <div className="space-y-2"><Label>Meta Pixel ID</Label><Input value={seo.metaPixelId} onChange={(e) => updateSeo({ metaPixelId: e.target.value })} /></div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-white p-5">
            <h2 className="text-lg font-semibold">Organization Schema</h2>
            <ToggleField id="enable-org-schema" label="Enable Organization Schema" checked={seo.enableOrganizationSchema} onChange={(enableOrganizationSchema) => updateSeo({ enableOrganizationSchema })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Business Name</Label><Input value={seo.organizationName} onChange={(e) => updateSeo({ organizationName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Website URL</Label><Input value={seo.organizationWebsiteUrl} onChange={(e) => updateSeo({ organizationWebsiteUrl: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Logo URL</Label><Input value={seo.organizationLogoUrl} onChange={(e) => updateSeo({ organizationLogoUrl: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Social Profiles</Label>
              {seo.organizationSocialProfiles.map((profile, index) => (
                <div key={`social-${index}`} className="flex gap-2">
                  <Input value={profile} onChange={(e) => updateSocialProfile(index, e.target.value)} placeholder="https://" />
                  <Button type="button" variant="outline" size="icon" className="border-border shrink-0" onClick={() => removeSocialProfile(index)} disabled={seo.organizationSocialProfiles.length <= 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="border-border" onClick={addSocialProfile}>
                <Plus className="mr-2 h-4 w-4" />
                Add profile
              </Button>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold">SEO Validation</h2>
            <div className="mt-3">
              <ValidationList issues={liveValidation.length > 0 ? liveValidation : validation} />
            </div>
          </section>
          <MetadataPreview seo={seo} />
          <p className="text-xs text-muted-foreground">
            Defaults are based on <code className="rounded bg-gray-100 px-1">site-config.ts</code>. Last saved settings override global metadata on all public pages.
          </p>
        </aside>
      </div>
    </div>
  );
}
