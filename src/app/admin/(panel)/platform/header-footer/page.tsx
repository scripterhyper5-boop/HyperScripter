"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  NavLinksEditor,
  ToggleField,
} from "@/components/admin/header-footer-form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataError, DataLoading } from "@/components/ui/data-state";
import {
  HEADER_FOOTER_PREVIEW_KEY,
  HEADER_FOOTER_PREVIEW_QUERY,
  type FooterSettings,
  type HeaderFooterSettingsView,
  type HeaderSettings,
} from "@/lib/header-footer/types";
import { cn } from "@/lib/utils";

function serializeSettings(header: HeaderSettings, footer: FooterSettings) {
  return JSON.stringify({ header, footer });
}

export default function AdminHeaderFooterPage() {
  const [saved, setSaved] = useState<HeaderFooterSettingsView | null>(null);
  const [header, setHeader] = useState<HeaderSettings | null>(null);
  const [footer, setFooter] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/header-footer", { credentials: "include" });
      const data = (await res.json()) as HeaderFooterSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load header & footer settings");

      setSaved(data);
      setHeader(data.header);
      setFooter(data.footer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const isDirty = useMemo(() => {
    if (!saved || !header || !footer) return false;
    return serializeSettings(header, footer) !== serializeSettings(saved.header, saved.footer);
  }, [saved, header, footer]);

  function handleDiscard() {
    if (!saved) return;
    setHeader(saved.header);
    setFooter(saved.footer);
    toast.message("Changes discarded");
  }

  async function handleSave() {
    if (!header || !footer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/header-footer", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, footer }),
      });
      const data = (await res.json()) as HeaderFooterSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save settings");

      setSaved(data);
      setHeader(data.header);
      setFooter(data.footer);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("Reset header and footer to default values? This cannot be undone.")) return;

    setResetting(true);
    try {
      const res = await fetch("/api/admin/header-footer", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = (await res.json()) as HeaderFooterSettingsView & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to reset settings");

      setSaved(data);
      setHeader(data.header);
      setFooter(data.footer);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset settings");
    } finally {
      setResetting(false);
    }
  }

  function handlePreview() {
    if (!header || !footer) return;
    sessionStorage.setItem(
      HEADER_FOOTER_PREVIEW_KEY,
      JSON.stringify({ header, footer })
    );
    window.open(`/?${HEADER_FOOTER_PREVIEW_QUERY}=1`, "_blank", "noopener,noreferrer");
    toast.message("Preview opened in a new tab");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Header & Footer"
          description="Manage public website navigation and footer content"
        />
        <DataLoading message="Loading header & footer settings…" />
      </div>
    );
  }

  if (error || !header || !footer) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Header & Footer"
          description="Manage public website navigation and footer content"
        />
        <DataError message={error ?? "Failed to load settings"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Header & Footer"
        description="Manage public website navigation and footer content"
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => void handleReset()}
            disabled={saving || resetting}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handlePreview}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview Changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handleDiscard}
            disabled={!isDirty || saving || resetting}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving || resetting || !isDirty}
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

      <div className={cn("space-y-6", isDirty && "rounded-xl ring-1 ring-violet/30")}>
        <section className="space-y-5 rounded-xl border border-border bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold">Header Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Logo, navigation links, and call-to-action button on the public site.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-text">Logo Text</Label>
            <Input
              id="logo-text"
              value={header.logoText}
              onChange={(e) => setHeader({ ...header, logoText: e.target.value })}
              placeholder="HyperScripter"
            />
          </div>

          <NavLinksEditor
            label="Navigation Links"
            description="Label and URL pairs shown in the header navigation."
            links={header.navigation}
            onChange={(navigation) => setHeader({ ...header, navigation })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cta-text">CTA Button Text</Label>
              <Input
                id="cta-text"
                value={header.ctaText}
                onChange={(e) => setHeader({ ...header, ctaText: e.target.value })}
                placeholder="Dashboard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-url">CTA Button URL</Label>
              <Input
                id="cta-url"
                value={header.ctaUrl}
                onChange={(e) => setHeader({ ...header, ctaUrl: e.target.value })}
                placeholder="/dashboard"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              id="show-navigation"
              label="Show Navigation"
              description="Display navigation links in the header."
              checked={header.showNavigation}
              onChange={(showNavigation) => setHeader({ ...header, showNavigation })}
            />
            <ToggleField
              id="show-cta"
              label="Show CTA Button"
              description="When off, sign-in / sign-up buttons are shown instead."
              checked={header.showCta}
              onChange={(showCta) => setHeader({ ...header, showCta })}
            />
          </div>
        </section>

        <section className="space-y-5 rounded-xl border border-border bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold">Footer Settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Company info, quick links, legal URLs, and social profiles.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={footer.companyName}
                onChange={(e) => setFooter({ ...footer, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="copyright">Copyright Text</Label>
              <Input
                id="copyright"
                value={footer.copyright}
                onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
                placeholder="© 2026 HyperScripter. All rights reserved."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-description">Footer Description</Label>
            <Textarea
              id="footer-description"
              value={footer.description}
              onChange={(e) => setFooter({ ...footer, description: e.target.value })}
              rows={3}
            />
          </div>

          <NavLinksEditor
            label="Quick Links"
            links={footer.quickLinks}
            onChange={(quickLinks) => setFooter({ ...footer, quickLinks })}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="privacy-url">Privacy Policy URL</Label>
              <Input
                id="privacy-url"
                value={footer.privacyPolicyUrl}
                onChange={(e) =>
                  setFooter({ ...footer, privacyPolicyUrl: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms-url">Terms of Service URL</Label>
              <Input
                id="terms-url"
                value={footer.termsOfServiceUrl}
                onChange={(e) =>
                  setFooter({ ...footer, termsOfServiceUrl: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">Social Links</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["twitter", "Twitter / X"],
                  ["youtube", "YouTube"],
                  ["linkedin", "LinkedIn"],
                  ["facebook", "Facebook"],
                  ["instagram", "Instagram"],
                  ["discord", "Discord"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`social-${key}`} className="text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <Input
                    id={`social-${key}`}
                    value={footer.socialLinks[key]}
                    onChange={(e) =>
                      setFooter({
                        ...footer,
                        socialLinks: { ...footer.socialLinks, [key]: e.target.value },
                      })
                    }
                    placeholder="https://"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              id="show-description"
              label="Show Description"
              checked={footer.showDescription}
              onChange={(showDescription) => setFooter({ ...footer, showDescription })}
            />
            <ToggleField
              id="show-quick-links"
              label="Show Quick Links"
              checked={footer.showQuickLinks}
              onChange={(showQuickLinks) => setFooter({ ...footer, showQuickLinks })}
            />
            <ToggleField
              id="show-legal-links"
              label="Show Legal Links"
              checked={footer.showLegalLinks}
              onChange={(showLegalLinks) => setFooter({ ...footer, showLegalLinks })}
            />
            <ToggleField
              id="show-social-links"
              label="Show Social Links"
              checked={footer.showSocialLinks}
              onChange={(showSocialLinks) => setFooter({ ...footer, showSocialLinks })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
