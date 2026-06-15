"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthRedirectLoading } from "@/components/auth/auth-redirect-loading";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useAdminLoginGuard } from "@/components/auth/use-auth-page-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { isAdmin } from "@/lib/auth/admin";
import { ADMIN_AUTH_ROUTES } from "@/lib/auth/constants";

export function AdminLoginForm() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isLoaded, shouldRedirect, showForm } = useAdminLoginGuard(
    ADMIN_AUTH_ROUTES.home
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const accessDenied =
    isLoaded && !authLoading && user != null && !isAdmin(user);

  if (!isLoaded || authLoading) {
    return <AuthRedirectLoading message="Loading admin sign in…" />;
  }

  if (shouldRedirect) {
    return (
      <AuthRedirectLoading message="Redirecting to admin panel…" showSignOut />
    );
  }

  if (accessDenied) {
    return (
      <div className="saas-card rounded-2xl p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-amber-600" />
        <h1 className="mt-4 text-xl font-bold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You&apos;re signed in as a non-admin account ({user.email}, role:{" "}
          {user.role ?? "user"}).
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    );
  }

  if (!showForm) {
    return <AuthRedirectLoading message="Loading admin sign in…" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, admin: true }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Admin sign in failed");
        return;
      }

      router.replace(ADMIN_AUTH_ROUTES.home);
      router.refresh();
    } catch {
      setError("Admin sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="saas-card rounded-2xl p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
          <Shield className="h-5 w-5 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Restricted to administrator accounts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            placeholder="admin@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="border-border bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="border-border bg-white"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          variant="violet-glow"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/"
          className="text-foreground underline-offset-4 hover:underline"
        >
          Back to site
        </Link>
      </p>
    </div>
  );
}
