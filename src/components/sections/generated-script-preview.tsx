"use client";

import { FadeIn } from "@/components/motion/fade-in";
import { DashboardMockup } from "@/components/marketing/dashboard-mockup";

export function GeneratedScriptPreview() {
  return (
    <section
      id="generated-script-preview"
      className="scroll-mt-20 border-b border-border px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="generated-script-preview-heading"
    >
      <div className="container-wide">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <h2
            id="generated-script-preview-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Generated Script Preview
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg lg:text-xl">
            See how HyperScripter generates hooks, scripts, CTAs, and content structure in seconds.
          </p>
        </FadeIn>

        <FadeIn delay={0.12} className="mx-auto mt-10 w-full sm:mt-12 lg:mt-14">
          <DashboardMockup />
        </FadeIn>
      </div>
    </section>
  );
}
