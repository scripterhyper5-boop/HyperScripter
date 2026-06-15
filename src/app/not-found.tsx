import Link from "next/link";
import { SiteNavbar } from "@/components/sections/site-navbar";
import { SiteFooter } from "@/components/sections/site-footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteNavbar />
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button variant="glow" className="mt-8" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <SiteFooter />
    </>
  );
}
