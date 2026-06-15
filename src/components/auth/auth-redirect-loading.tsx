"use client";

import { Loader2 } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";

interface AuthRedirectLoadingProps {
  message?: string;
  showSignOut?: boolean;
}

export function AuthRedirectLoading({
  message = "Checking session…",
  showSignOut = false,
}: AuthRedirectLoadingProps) {
  return (
    <div className="saas-card rounded-2xl p-8">
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{message}</p>
        {showSignOut && (
          <SignOutButton />
        )}
      </div>
    </div>
  );
}
