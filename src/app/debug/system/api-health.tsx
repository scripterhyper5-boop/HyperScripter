"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

type EndpointState = {
  path: string;
  label: string;
  status: "idle" | "loading" | "ok" | "auth" | "error";
  code?: number;
};

const ENDPOINTS: { path: string; label: string }[] = [
  { path: "/api/auth/me", label: "Auth (me)" },
  { path: "/api/scripts", label: "Scripts" },
  { path: "/api/admin/auth/me", label: "Admin auth (me)" },
];

function statusColor(status: EndpointState["status"]): string {
  switch (status) {
    case "ok":
      return "text-emerald-400";
    case "auth":
      return "text-amber-600";
    case "error":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
}

function statusLabel(state: EndpointState): string {
  switch (state.status) {
    case "loading":
      return "checking…";
    case "ok":
      return `ok (${state.code})`;
    case "auth":
      return `auth required (${state.code})`;
    case "error":
      return state.code ? `error (${state.code})` : "unreachable";
    default:
      return "—";
  }
}

export function ApiHealth() {
  const [states, setStates] = useState<EndpointState[]>(
    ENDPOINTS.map((e) => ({ ...e, status: "idle" }))
  );
  const [checking, setChecking] = useState(false);

  const runChecks = useCallback(async () => {
    setChecking(true);
    setStates((prev) => prev.map((s) => ({ ...s, status: "loading" })));

    const results = await Promise.all(
      ENDPOINTS.map(async (endpoint): Promise<EndpointState> => {
        try {
          const res = await fetch(endpoint.path, { cache: "no-store" });
          if (res.ok) {
            return { ...endpoint, status: "ok", code: res.status };
          }
          if (res.status === 401 || res.status === 403) {
            return { ...endpoint, status: "auth", code: res.status };
          }
          return { ...endpoint, status: "error", code: res.status };
        } catch {
          return { ...endpoint, status: "error" };
        }
      })
    );

    setStates(results);
    setChecking(false);
  }, []);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          API Health
        </h2>
        <button
          onClick={() => void runChecks()}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          {checking ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Recheck
        </button>
      </div>
      <dl>
        {states.map((state) => (
          <div
            key={state.path}
            className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"
          >
            <dt className="text-sm text-muted-foreground">
              {state.label}
              <span className="ml-2 font-mono text-xs text-muted-foreground/50">
                {state.path}
              </span>
            </dt>
            <dd className={`text-sm font-mono ${statusColor(state.status)}`}>
              {statusLabel(state)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground/60">
        &quot;auth required&quot; is expected for protected endpoints when signed
        out or without the right role.
      </p>
    </div>
  );
}
