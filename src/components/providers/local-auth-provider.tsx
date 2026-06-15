"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminAuthContext,
  AuthContext,
} from "@/components/providers/auth-context";
import type { User } from "@/lib/auth/types";
import { isAdmin } from "@/lib/auth/admin";
import { ADMIN_AUTH_ROUTES, USER_AUTH_ROUTES } from "@/lib/auth/constants";

async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: User | null };
  return data.user;
}

function useLocalAuth(requireAdmin = false) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const current = await fetchCurrentUser();
      if (requireAdmin && current && !isAdmin(current)) {
        setUser(null);
      } else {
        setUser(current);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [requireAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    window.location.href = requireAdmin
      ? ADMIN_AUTH_ROUTES.login
      : USER_AUTH_ROUTES.login;
  }, [requireAdmin]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return useMemo(
    () => ({ user, isLoading, logout, refresh }),
    [user, isLoading, logout, refresh]
  );
}

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const value = useLocalAuth(false);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function LocalAdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useLocalAuth(true);
  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}
