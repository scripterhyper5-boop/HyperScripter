"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isAdmin } from "@/lib/auth/admin";
import type { User } from "@/lib/auth/types";

type AuthPageGuardOptions = {
  redirectTo: string;
  when?: (user: User) => boolean;
};

export function useAuthPageGuard({ redirectTo, when }: AuthPageGuardOptions) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isSignedIn = user != null;
  const shouldRedirect =
    !isLoading && isSignedIn && (when ? when(user) : true);

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace(redirectTo);
  }, [shouldRedirect, router, redirectTo]);

  return {
    isLoaded: !isLoading,
    isSignedIn,
    user,
    shouldRedirect,
    showForm: !isLoading && !shouldRedirect,
  };
}

export function useUserLoginGuard(redirectTo: string) {
  return useAuthPageGuard({ redirectTo });
}

export function useAdminLoginGuard(redirectTo: string) {
  return useAuthPageGuard({
    redirectTo,
    when: (user) => isAdmin(user),
  });
}
