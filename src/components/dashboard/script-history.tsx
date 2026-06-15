"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataEmpty, DataError, DataLoading } from "@/components/ui/data-state";
import { useAuth } from "@/components/providers/auth-provider";
import { FeatureGate, LockedLabel } from "@/components/dashboard/upgrade-prompt";
import { usePlan } from "@/hooks/use-plan";
import type { ScriptHistoryItem } from "@/lib/auth/script-history";
import { getScriptHistory, deleteScriptFromHistory } from "@/lib/auth/script-history";
import { fetchScripts, deleteScriptApi } from "@/lib/api/scripts-client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getOptionLabel, nicheOptions, toneOptions } from "@/lib/generator";

interface ScriptHistoryProps {
  refreshKey?: number;
}

export function ScriptHistory({ refreshKey = 0 }: ScriptHistoryProps) {
  const { user } = useAuth();
  const { hasFeature } = usePlan();
  const [history, setHistory] = useState<ScriptHistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured()) {
        const scripts = await fetchScripts();
        setHistory(scripts);
      } else {
        setHistory(getScriptHistory(user.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scripts");
      setHistory(getScriptHistory(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  const filtered = useMemo(() => {
    if (!hasFeature("saveAndSearchScripts") || !query.trim()) return history;
    const q = query.toLowerCase();
    return history.filter(
      (item) =>
        item.topic.toLowerCase().includes(q) ||
        item.output.hook.toLowerCase().includes(q) ||
        item.tone.toLowerCase().includes(q)
    );
  }, [hasFeature, history, query]);

  async function handleDelete(id: string) {
    if (!user) return;

    try {
      if (isSupabaseConfigured()) {
        await deleteScriptApi(id);
        toast.success("Script deleted");
      } else {
        deleteScriptFromHistory(user.id, id);
      }
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete script");
    }
  }

  if (loading) {
    return <DataLoading message="Loading your scripts..." />;
  }

  if (error && history.length === 0) {
    return <DataError message={error} />;
  }

  return (
    <div className="space-y-4">
      <FeatureGate
        feature="saveAndSearchScripts"
        fallback={
          <div className="rounded-lg border border-dashed border-border p-4">
            <LockedLabel feature="saveAndSearchScripts" />
          </div>
        }
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scripts by topic, hook, or tone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </FeatureGate>

      {filtered.length === 0 ? (
        <DataEmpty
          title={history.length === 0 ? "No scripts yet" : "No matching scripts"}
          description={
            history.length === 0
              ? "Generate your first TikTok script to see it here"
              : "Try a different search term"
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="dashboard-card group rounded-xl p-4 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/dashboard/scripts/${item.id}`}
                  className="min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-violet/50"
                >
                  <h3 className="truncate text-sm font-medium transition-colors group-hover:text-violet">
                    {item.topic}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.output.hook}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="muted" className="text-[10px] font-normal">
                      {getOptionLabel(nicheOptions, item.niche)}
                    </Badge>
                    <Badge variant="muted" className="text-[10px] font-normal">
                      {getOptionLabel(toneOptions, item.tone)}
                    </Badge>
                    <Badge variant="muted" className="text-[10px] font-normal">
                      {item.videoLength}
                    </Badge>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => void handleDelete(item.id)}
                  aria-label={`Delete script about ${item.topic}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

