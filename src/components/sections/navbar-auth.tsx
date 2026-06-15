"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/client-only";
import { useAuth } from "@/components/providers/auth-provider";

function NavbarAuthPlaceholder() {
  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Sign in</Link>
      </Button>
      <Button variant="violet-glow" size="sm" asChild>
        <Link href="/signup">Get started</Link>
      </Button>
    </>
  );
}

function NavbarAuthActions() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <NavbarAuthPlaceholder />;
  }

  if (user) {
    return (
      <Button variant="violet-glow" size="sm" asChild>
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    );
  }

  return <NavbarAuthPlaceholder />;
}

function NavbarMobileAuthActions({ onNavigate }: { onNavigate: () => void }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <Button variant="outline" asChild>
          <Link href="/login" onClick={onNavigate}>
            Sign in
          </Link>
        </Button>
        <Button variant="violet-glow" asChild>
          <Link href="/signup" onClick={onNavigate}>
            Get started free
          </Link>
        </Button>
      </>
    );
  }

  if (user) {
    return (
      <Button variant="violet-glow" asChild>
        <Link href="/dashboard" onClick={onNavigate}>
          Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" asChild>
        <Link href="/login" onClick={onNavigate}>
          Sign in
        </Link>
      </Button>
      <Button variant="violet-glow" asChild>
        <Link href="/signup" onClick={onNavigate}>
          Get started free
        </Link>
      </Button>
    </>
  );
}

export function NavbarAuthDesktop() {
  return (
    <ClientOnly fallback={<NavbarAuthPlaceholder />}>
      <NavbarAuthActions />
    </ClientOnly>
  );
}

export function NavbarAuthMobile({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ClientOnly
      fallback={
        <>
          <Button variant="outline" asChild>
            <Link href="/login" onClick={onNavigate}>
              Sign in
            </Link>
          </Button>
          <Button variant="violet-glow" asChild>
            <Link href="/signup" onClick={onNavigate}>
              Get started free
            </Link>
          </Button>
        </>
      }
    >
      <NavbarMobileAuthActions onNavigate={onNavigate} />
    </ClientOnly>
  );
}
