"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/page-header";
import { BlogMarkdownEditor } from "@/components/admin/blog-markdown-editor";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { AdminBlogPost } from "@/lib/admin/types";

const emptyPost: Omit<AdminBlogPost, "id" | "updatedAt"> = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  seoTitle: "",
  metaDescription: "",
  status: "draft",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminBlogPost | null>(null);
  const [form, setForm] = useState(emptyPost);
  const [showForm, setShowForm] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blog", { credentials: "include" });
      const data = (await res.json()) as { posts?: AdminBlogPost[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load blog posts");
      setPosts(data.posts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  function openCreate() {
    setEditing(null);
    setForm(emptyPost);
    setShowForm(true);
  }

  function openEdit(post: AdminBlogPost) {
    setEditing(post);
    setForm(post);
    setShowForm(true);
  }

  async function persistPost(status: "draft" | "published") {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || form.title.trim().toLowerCase().replace(/\s+/g, "-"),
        excerpt: form.excerpt,
        content: form.content,
        status,
      };

      const res = editing
        ? await fetch(`/api/admin/blog/${editing.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/blog", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save post");

      toast.success(status === "published" ? "Post published" : "Draft saved");
      setShowForm(false);
      await loadPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function publishPost(id: string) {
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      toast.success("Post published");
      await loadPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    }
  }

  async function deletePost(id: string) {
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      toast.success("Post deleted");
      await loadPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const handleContentChange = useCallback((content: string) => {
    setForm((prev) => ({ ...prev, content }));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Blog" description="Create and manage blog posts">
        <Button variant="violet-glow" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New post
        </Button>
      </AdminPageHeader>

      {showForm && (
        <div className="saas-card space-y-5 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold">{editing ? "Edit post" : "Create post"}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="featuredImage">Featured Image</Label>
              <Input id="featuredImage" value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Content</Label>
              <BlogMarkdownEditor
                value={form.content}
                onChange={handleContentChange}
                draftKey={editing ? `hs-blog-draft-${editing.id}` : "hs-blog-draft-new"}
                enableDraftRestore={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input id="seoTitle" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Input id="metaDescription" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
            <Button variant="secondary" onClick={() => void persistPost("draft")} disabled={saving}>Save draft</Button>
            <Button variant="violet-glow" onClick={() => void persistPost("published")} disabled={saving}>Publish</Button>
          </div>
        </div>
      )}

      {loading ? (
        <DataLoading message="Loading blog posts..." />
      ) : error ? (
        <DataError message={error} />
      ) : posts.length === 0 ? (
        <DataEmpty title="No blog posts yet" description="Create your first post to get started" />
      ) : (
        <div className="saas-card overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground">{post.slug}</TableCell>
                  <TableCell><StatusBadge status={post.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{post.updatedAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(post)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => void publishPost(post.id)}>Publish</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => void deletePost(post.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
