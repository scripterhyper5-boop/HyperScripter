"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAdminDate } from "@/lib/admin/format";
import type { AdminScriptRow } from "@/lib/admin/types";

export default function AdminScriptsPage() {
  const [search, setSearch] = useState("");
  const [scripts, setScripts] = useState<AdminScriptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScripts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/scripts", { credentials: "include" });
      const data = (await res.json()) as { scripts?: AdminScriptRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load scripts");
      setScripts(data.scripts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scripts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScripts();
  }, [loadScripts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return scripts.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.user.toLowerCase().includes(q) ||
        s.videoType.toLowerCase().includes(q) ||
        s.tone.toLowerCase().includes(q)
    );
  }, [search, scripts]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Scripts" description="View and manage generated scripts" />

      <div className="saas-card border border-border p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scripts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <DataLoading message="Loading scripts..." />
      ) : error ? (
        <DataError message={error} />
      ) : scripts.length === 0 ? (
        <DataEmpty title="No scripts yet" description="Generated scripts will appear here" />
      ) : filtered.length === 0 ? (
        <DataEmpty title="No scripts found" description="Try a different search term" />
      ) : (
        <div className="saas-card overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Video Type</TableHead>
                <TableHead>Tone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((script) => (
                <TableRow key={script.id}>
                  <TableCell className="font-medium">{script.title}</TableCell>
                  <TableCell className="text-muted-foreground">{script.user}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatAdminDate(script.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {script.videoType}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {script.tone}
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
