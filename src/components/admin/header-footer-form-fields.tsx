"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NavLink } from "@/lib/header-footer/types";

interface NavLinksEditorProps {
  label: string;
  description?: string;
  links: NavLink[];
  onChange: (links: NavLink[]) => void;
}

export function NavLinksEditor({ label, description, links, onChange }: NavLinksEditorProps) {
  function updateLink(index: number, field: keyof NavLink, value: string) {
    onChange(
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  }

  function addLink() {
    onChange([...links, { label: "", url: "" }]);
  }

  function removeLink(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-semibold">{label}</Label>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="space-y-2">
        {links.map((link, index) => (
          <div
            key={`nav-link-${index}`}
            className="grid gap-2 rounded-lg border border-border bg-gray-50/50 p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input
                value={link.label}
                onChange={(e) => updateLink(index, "label", e.target.value)}
                placeholder="Features"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                value={link.url}
                onChange={(e) => updateLink(index, "url", e.target.value)}
                placeholder="#features"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="border-border"
                onClick={() => removeLink(index)}
                disabled={links.length <= 1}
                aria-label="Remove link"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="border-border" onClick={addLink}>
        <Plus className="mr-2 h-4 w-4" />
        Add link
      </Button>
    </div>
  );
}

interface ToggleFieldProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleField({ id, label, description, checked, onChange }: ToggleFieldProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-white p-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-border text-violet focus:ring-violet"
      />
    </div>
  );
}
