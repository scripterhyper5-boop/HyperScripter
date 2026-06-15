"use client";

import Link from "next/link";
import { useState } from "react";
import { UserCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_ADMIN_SETTINGS } from "@/lib/admin/defaults";
import type { AdminSettings } from "@/lib/admin/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);

  function updateSection<K extends keyof AdminSettings>(
    section: K,
    field: keyof AdminSettings[K],
    value: string
  ) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Platform settings" description="Configure platform settings">
        <Button variant="outline" size="sm" className="border-border" asChild>
          <Link href="/admin/account">
            <UserCircle className="mr-2 h-4 w-4" />
            Admin account
          </Link>
        </Button>
      </AdminPageHeader>

      <Tabs defaultValue="general" className="saas-card border border-border p-6">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" value={settings.general.siteName} onChange={(e) => updateSection("general", "siteName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input id="domain" value={settings.general.domain} onChange={(e) => updateSection("general", "domain", e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" value={settings.general.logo} onChange={(e) => updateSection("general", "logo", e.target.value)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="defaultTitle">Default Title</Label>
            <Input id="defaultTitle" value={settings.seo.defaultTitle} onChange={(e) => updateSection("seo", "defaultTitle", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultDescription">Default Description</Label>
            <Input id="defaultDescription" value={settings.seo.defaultDescription} onChange={(e) => updateSection("seo", "defaultDescription", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ogImage">Open Graph Image</Label>
            <Input id="ogImage" value={settings.seo.ogImage} onChange={(e) => updateSection("seo", "ogImage", e.target.value)} />
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <Input id="apiKey" type="password" value={settings.ai.openaiApiKey} onChange={(e) => updateSection("ai", "openaiApiKey", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Default Model</Label>
            <Select value={settings.ai.defaultModel} onValueChange={(v) => updateSection("ai", "defaultModel", v)}>
              <SelectTrigger id="model"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={settings.appearance.theme} onValueChange={(v) => updateSection("appearance", "theme", v)}>
              <SelectTrigger id="theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandColors">Brand Colors</Label>
            <Input id="brandColors" value={settings.appearance.brandColors} onChange={(e) => updateSection("appearance", "brandColors", e.target.value)} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
