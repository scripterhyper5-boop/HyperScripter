"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LegalTiptapEditor } from "@/components/admin/legal/legal-tiptap-editor";
import { LegalHtmlPreview } from "@/components/admin/legal/legal-html-preview";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import { slugifyLegalPage, type LegalPage } from "@/lib/admin/legal-pages";

const emptyPage: Omit<LegalPage, "id" | "updatedAt"> = {
  name: "",
  slug: "",
  content: "<h1>New Legal Page</h1><p>Start writing your legal content here.</p>",
  status: "draft",
};

export default function AdminLegalPagesPage() {
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [previewPage, setPreviewPage] = useState<LegalPage | null>(null);
  const [editing, setEditing] = useState<LegalPage | null>(null);
  const [form, setForm] = useState(emptyPage);

  const loadPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/legal", { credentials: "include" });
      const data = (await res.json()) as { pages?: LegalPage[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load legal pages");
      setPages(data.pages ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load legal pages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pages.filter(
      (page) =>
        page.name.toLowerCase().includes(q) || page.slug.toLowerCase().includes(q)
    );
  }, [pages, search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyPage);
    setShowForm(true);
  }

  function openEdit(page: LegalPage) {
    setEditing(page);
    setForm({
      name: page.name,
      slug: page.slug,
      content: page.content,
      status: page.status,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyPage);
  }

  async function upsertPage(status: LegalPage["status"]) {
    if (!form.name.trim()) {
      toast.error("Page name is required");
      return;
    }

    const slug = form.slug.trim() || slugifyLegalPage(form.name);
    setSaving(true);

    try {
      const payload = {
        title: form.name.trim(),
        slug,
        content: form.content,
        status,
      };

      const res = editing
        ? await fetch(`/api/admin/legal/${editing.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/legal", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save page");

      toast.success(status === "published" ? "Page published" : "Draft saved");
      closeForm();
      await loadPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save page");
    } finally {
      setSaving(false);
    }
  }

  async function publishPage(id: string) {
    try {
      const res = await fetch(`/api/admin/legal/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      toast.success("Page published");
      await loadPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
  }

  async function deletePage(id: string) {
    try {
      const res = await fetch(`/api/admin/legal/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      toast.success("Page deleted");
      await loadPages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const handleContentChange = useCallback((content: string) => {
    setForm((prev) => ({ ...prev, content }));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Legal Pages"
        description="Manage legal and compliance pages for HyperScripter."
      >
        <Button variant="violet-glow" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Create page
        </Button>
      </AdminPageHeader>

      {showForm && (
        <div className="saas-card space-y-5 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold">
            {editing ? "Edit legal page" : "Create legal page"}
          </h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legal-name">Page Name</Label>
              <Input
                id="legal-name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: form.slug || slugifyLegalPage(e.target.value),
                  })
                }
                placeholder="Privacy Policy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal-slug">Slug</Label>
              <Input
                id="legal-slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="privacy-policy"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <LegalTiptapEditor
              key={editing?.id ?? "new"}
              value={form.content}
              onChange={handleContentChange}
              draftKey={
                editing ? `hs-legal-draft-${editing.id}` : "hs-legal-draft-new"
              }
              enableDraftRestore={!editing}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => void upsertPage("draft")} disabled={saving}>
              Save draft
            </Button>
            <Button variant="violet-glow" onClick={() => void upsertPage("published")} disabled={saving}>
              Publish
            </Button>
          </div>
        </div>
      )}

      <div className="saas-card border border-border p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search legal pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <DataLoading message="Loading legal pages..." />
      ) : error ? (
        <DataError message={error} />
      ) : filtered.length === 0 ? (
        <DataEmpty title="No legal pages yet" description="Create your first legal page to get started" />
      ) : (
      <div className="saas-card overflow-hidden border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">{page.name}</TableCell>
                <TableCell className="text-muted-foreground">/{page.slug}</TableCell>
                <TableCell>
                  <StatusBadge status={page.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{page.updatedAt}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(page)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPreviewPage(page)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void publishPage(page.id)}>
                        Publish
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => void deletePage(page.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {previewPage && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/20 p-4 sm:items-center">
          <div
            className="saas-card max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-preview-title"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 id="legal-preview-title" className="text-lg font-semibold">
                {previewPage.name}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewPage(null)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <LegalHtmlPreview content={previewPage.content} />
          </div>
        </div>
      )}
    </div>
  );
}
