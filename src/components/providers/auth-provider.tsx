"use client";

import { LocalAdminAuthProvider, LocalAuthProvider } from "@/components/providers/local-auth-provider";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  return <LocalAdminAuthProvider>{children}</LocalAdminAuthProvider>;
}

export {
  useAuth,
  useAdminAuth,
  USER_AUTH_REDIRECT,
} from "@/components/providers/auth-context";
