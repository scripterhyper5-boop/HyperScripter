"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { NavbarAuthDesktop, NavbarAuthMobile } from "@/components/sections/navbar-auth";
import { useHeaderFooterPreview } from "@/hooks/use-header-footer-preview";
import {
  DEFAULT_HEADER_SETTINGS,
  type HeaderSettings,
} from "@/lib/header-footer/types";
import { cn } from "@/lib/utils";

interface NavbarProps {
  header?: HeaderSettings;
}

export function Navbar({ header: initialHeader = DEFAULT_HEADER_SETTINGS }: NavbarProps) {
  const header = useHeaderFooterPreview("header", initialHeader);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const navLinks = header.showNavigation ? header.navigation : [];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-white/90 shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav
        className="container-wide flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/20 ring-1 ring-violet/30">
            <Sparkles className="h-4 w-4 text-violet" aria-hidden="true" />
          </div>
          <span className="text-base font-semibold tracking-tight">{header.logoText}</span>
        </Link>

        {navLinks.length > 0 && (
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={`${link.label}-${link.url}`}
                href={link.url}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="hidden items-center gap-3 sm:flex">
          {header.showCta ? (
            <Button variant="violet-glow" size="sm" asChild>
              <Link href={header.ctaUrl}>{header.ctaText}</Link>
            </Button>
          ) : (
            <NavbarAuthDesktop />
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-background/95 lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={`mobile-${link.label}-${link.url}`}
                  href={link.url}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-4">
                {header.showCta ? (
                  <Button variant="violet-glow" asChild>
                    <Link href={header.ctaUrl} onClick={() => setMobileOpen(false)}>
                      {header.ctaText}
                    </Link>
                  </Button>
                ) : (
                  <NavbarAuthMobile onNavigate={() => setMobileOpen(false)} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
