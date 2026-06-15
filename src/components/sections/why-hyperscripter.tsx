"use client";

import { motion } from "motion/react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

const cards = [
  {
    emoji: "⚡",
    title: "AI-Powered",
    description:
      "Generate engaging TikTok scripts, hooks, captions, CTAs and hashtags using advanced AI.",
    glow: "group-hover:shadow-[0_0_40px_oklch(0.65_0.25_290/18%)]",
    iconGlow: "group-hover:from-violet/30 group-hover:to-violet/10",
  },
  {
    emoji: "🎯",
    title: "TikTok-Focused",
    description:
      "Purpose-built for TikTok creators, influencers, agencies and brands.",
    glow: "group-hover:shadow-[0_0_40px_oklch(0.78_0.15_200/14%)]",
    iconGlow: "group-hover:from-cyan/25 group-hover:to-cyan/10",
  },
  {
    emoji: "🚀",
    title: "Instant Generation",
    description:
      "Generate complete TikTok content in seconds without writer's block.",
    glow: "group-hover:shadow-[0_0_40px_oklch(0.65_0.25_290/18%)]",
    iconGlow: "group-hover:from-violet/30 group-hover:to-violet/10",
  },
  {
    emoji: "🌍",
    title: "Available 24/7",
    description:
      "Create content anytime, anywhere with unlimited access to your AI writing assistant.",
    glow: "group-hover:shadow-[0_0_40px_oklch(0.78_0.15_200/14%)]",
    iconGlow: "group-hover:from-cyan/25 group-hover:to-cyan/10",
  },
];

export function WhyHyperScripter() {
  return (
    <section
      className="border-b border-border py-16 md:py-20"
      aria-labelledby="why-heading"
    >
      <div className="container-wide px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2
            id="why-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Why HyperScripter?
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Everything you need to create viral TikTok content faster.
          </p>
        </FadeIn>

        <StaggerContainer className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <StaggerItem key={card.title}>
              <motion.article
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
                className={cn(
                  "group relative h-full overflow-hidden rounded-2xl border border-border",
                  "bg-white/[0.03] p-6 md:p-8",
                  "transition-all duration-300",
                  "hover:border-gray-300",
                  card.glow
                )}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                >
                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet/10 blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan/8 blur-2xl" />
                </div>

                <div
                  className={cn(
                    "relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl",
                    "bg-gradient-to-br from-white/10 to-white/[0.03] text-xl",
                    "ring-1 ring-border transition-all duration-300",
                    "group-hover:scale-110 group-hover:ring-white/20",
                    card.iconGlow
                  )}
                >
                  <motion.span
                    className="leading-none"
                    whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {card.emoji}
                  </motion.span>
                </div>

                <h3 className="relative text-base font-semibold">{card.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </motion.article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
