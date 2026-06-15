"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getTeamApiErrorDetails,
  isWorkspaceInitializingError,
  type TeamApiErrorDetails,
} from "@/lib/api/team-client";

const MAX_INIT_ATTEMPTS = 15;
const INIT_POLL_MS = 2000;

export interface TeamFetchState<T> {
  data: T | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  errorDetails: TeamApiErrorDetails | null;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
}

export function useTeamFetch<T>(
  fetcher: () => Promise<T>,
  options?: { retries?: number }
): TeamFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<TeamApiErrorDetails | null>(
    null
  );
  const initAttempts = useRef(0);

  const refresh = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
        setInitializing(false);
      }

      try {
        const result = await fetcher();
        setData(result);
        setError(null);
        setErrorDetails(null);
        setInitializing(false);
        initAttempts.current = 0;
      } catch (err) {
        if (isWorkspaceInitializingError(err)) {
          setInitializing(true);
          setError(null);
          setErrorDetails(null);
        } else {
          const details = getTeamApiErrorDetails(err);
          setError(
            err instanceof Error ? err.message : "Failed to load team data"
          );
          setErrorDetails(details);
          setInitializing(false);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetcher]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!initializing) return;

    if (initAttempts.current >= MAX_INIT_ATTEMPTS) {
      setError(
        "Workspace setup is taking longer than expected. Please refresh the page."
      );
      setErrorDetails(null);
      setInitializing(false);
      setLoading(false);
      return;
    }

    const timer = setInterval(() => {
      initAttempts.current += 1;
      void refresh({ silent: true });
    }, INIT_POLL_MS);

    return () => clearInterval(timer);
  }, [initializing, refresh]);

  return { data, loading, initializing, error, errorDetails, refresh };
}
