"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/marketing/hero-background";
import { cn } from "@/lib/utils";

const scriptSections = [
  {
    emoji: "🎣",
    label: "HOOK",
    content:
      "What if I told you that 90% of creators lose views because of one simple mistake?",
  },
  {
    emoji: "🚀",
    label: "INTRO",
    content:
      "Today we're breaking down the exact framework top creators use to hook viewers in the first 3 seconds — and keep them watching until the end.",
  },
  {
    emoji: "🎬",
    label: "B-ROLL NOTE",
    content:
      "Show: analytics dashboard, creator editing footage, before/after engagement metrics overlay.",
  },
] as const;

interface DashboardMockupProps {
  className?: string;
}

export function DashboardMockup({ className }: DashboardMockupProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: EASE, delay: 0.15 }}
      whileHover={reducedMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
      className={cn("mx-auto w-full min-w-0 max-w-[1100px]", className)}
    >
      <div
        className="flex flex-col rounded-[20px] border border-[#e5e7eb] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12),0_8px_16px_-8px_rgba(0,0,0,0.08)]"
        role="img"
        aria-label="Preview of a generated TikTok script with hook, intro, and b-roll sections"
      >
        <div className="flex shrink-0 items-center gap-3 rounded-t-[20px] border-b border-[#e5e7eb] bg-[#fafafa] px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <p className="min-w-0 truncate text-sm font-medium text-gray-700 sm:text-[15px]">
            Generated Script Preview
          </p>
        </div>

        <div className="flex flex-col">
          <div className="space-y-4 px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5 md:px-8 md:py-6">
            {scriptSections.map((section, index) => (
              <motion.div
                key={section.label}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.2 + index * 0.08 }}
                className="rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-3.5 sm:p-4"
              >
                <p className="text-xs font-semibold tracking-wide text-gray-500 sm:text-sm">
                  {section.emoji} {section.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-800 sm:text-[15px] sm:leading-7">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="shrink-0 rounded-b-[20px] border-t border-[#e5e7eb] bg-white px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 sm:text-sm">
              <span className="font-medium text-gray-700">Tutorial</span>
              <span className="text-gray-300" aria-hidden="true">
                •
              </span>
              <span>5 min</span>
              <span className="text-gray-300" aria-hidden="true">
                •
              </span>
              <span>Professional Tone</span>
            </div>
            <p className="mt-1 text-xs text-gray-400 sm:text-sm">
              Full script: <span className="font-medium text-gray-600">847 words</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
