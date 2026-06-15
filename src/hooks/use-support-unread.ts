"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type UnreadScope = "user" | "admin";

export function useSupportUnread(scope: UnreadScope, userId?: string) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const path =
      scope === "admin" ? "/api/admin/support/unread" : "/api/support/unread";
    console.log("[support-unread] fetching", { scope, path });
    try {
      const res = await fetch(path, { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number };
      setCount(data.count);
    } catch {
      // ignore
    }
  }, [scope]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`support-unread-${scope}-${userId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
        },
        (payload) => {
          console.log("[support-unread] message insert — refreshing count", {
            scope,
            messageId: (payload.new as { id?: string })?.id,
          });
          void refreshRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [scope, userId]);

  return { count, refresh };
}
