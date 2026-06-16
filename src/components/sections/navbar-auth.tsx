"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { USER_AUTH_ROUTES } from "@/lib/auth/constants";

function useNavbarAuthenticated(initialAuthenticated: boolean): boolean {
  const { user, isLoading } = useAuth();
  if (isLoading) return initialAuthenticated;
  return Boolean(user);
}

function NavbarGuestDesktop() {
  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href={USER_AUTH_ROUTES.login}>Login</Link>
      </Button>
      <Button variant="violet-glow" size="sm" asChild>
        <Link href={USER_AUTH_ROUTES.signup}>Start Free</Link>
      </Button>
    </>
  );
}

function NavbarAuthedDesktop() {
  return (
    <Button variant="violet-glow" size="sm" asChild>
      <Link href={USER_AUTH_ROUTES.dashboard}>Dashboard</Link>
    </Button>
  );
}

function NavbarGuestMobile({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <Button variant="outline" asChild>
        <Link href={USER_AUTH_ROUTES.login} onClick={onNavigate}>
          Login
        </Link>
      </Button>
      <Button variant="violet-glow" asChild>
        <Link href={USER_AUTH_ROUTES.signup} onClick={onNavigate}>
          Start Free
        </Link>
      </Button>
    </>
  );
}

function NavbarAuthedMobile({ onNavigate }: { onNavigate: () => void }) {
  return (
    <Button variant="violet-glow" asChild>
      <Link href={USER_AUTH_ROUTES.dashboard} onClick={onNavigate}>
        Dashboard
      </Link>
    </Button>
  );
}

export function NavbarAuthDesktop({
  initialAuthenticated,
}: {
  initialAuthenticated: boolean;
}) {
  const isAuthenticated = useNavbarAuthenticated(initialAuthenticated);
  return isAuthenticated ? <NavbarAuthedDesktop /> : <NavbarGuestDesktop />;
}

export function NavbarAuthMobile({
  initialAuthenticated,
  onNavigate,
}: {
  initialAuthenticated: boolean;
  onNavigate: () => void;
}) {
  const isAuthenticated = useNavbarAuthenticated(initialAuthenticated);
  return isAuthenticated ? (
    <NavbarAuthedMobile onNavigate={onNavigate} />
  ) : (
    <NavbarGuestMobile onNavigate={onNavigate} />
  );
}
