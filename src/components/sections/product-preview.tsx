"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Hash, Megaphone, MessageSquare, FileText } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "hook",
    label: "Hook",
    icon: Megaphone,
    preview:
      "Stop scrolling. This one morning habit changed how 10K+ creators start their day.",
    color: "text-violet",
    bg: "bg-violet/10 border-violet/20",
  },
  {
    id: "script",
    label: "Full Script",
    icon: FileText,
    preview:
      "Step 1: Wake up without your phone. Step 2: 10-minute movement block. Step 3: One priority task before content creation. That's the entire framework.",
    color: "text-foreground",
    bg: "bg-gray-50 border-border",
  },
  {
    id: "cta",
    label: "CTA",
    icon: MessageSquare,
    preview: "Follow for more creator systems that actually work. Save this for tomorrow morning.",
    color: "text-cyan",
    bg: "bg-cyan/10 border-cyan/20",
  },
  {
    id: "hashtags",
    label: "Hashtags",
    icon: Hash,
    preview: "#morningroutine #productivity #creatortips #fyp #learnontiktok",
    color: "text-muted-foreground",
    bg: "bg-gray-50 border-border",
  },
];

export function ProductPreview() {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active)!;

  return (
    <section
      id="product-preview"
      className="border-b border-border px-4 pt-12 pb-20 sm:px-6 md:pt-16 md:pb-28 lg:px-8 lg:pb-36"
      aria-labelledby="preview-heading"
    >
      <div className="container-wide">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="muted" className="mb-4 font-normal">
            Product preview
          </Badge>
          <h2
            id="preview-heading"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            Every piece, perfectly structured
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            One generation gives you everything you need to film, post, and grow.
          </p>
        </FadeIn>

        <FadeIn delay={0.15} className="mx-auto mt-14 max-w-3xl">
          <div className="saas-card overflow-hidden rounded-2xl">
            <div className="flex flex-wrap gap-1 border-b border-border p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-all",
                    active === tab.id
                      ? "bg-violet/10 text-foreground ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[200px] p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className={cn("rounded-xl border p-5", current.bg)}
                >
                  <div className={cn("mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider", current.color)}>
                    <current.icon className="h-3.5 w-3.5" />
                    {current.label}
                  </div>
                  <p className="text-sm leading-relaxed sm:text-base">{current.preview}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button variant="violet-glow" size="lg" asChild>
              <Link href="/signup">
                Try it free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
