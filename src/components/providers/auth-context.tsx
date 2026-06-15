"use client";

import { createContext, useContext } from "react";
import type { User } from "@/lib/auth/types";
import { USER_AUTH_ROUTES } from "@/lib/auth/constants";

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
export const AdminAuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

export const USER_AUTH_REDIRECT = USER_AUTH_ROUTES.dashboard;
