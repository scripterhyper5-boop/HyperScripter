"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroBackground, EASE } from "@/components/marketing/hero-background";
import { StaggeredHeadline } from "@/components/marketing/staggered-headline";

const headlineLines = [
  { text: "Ship viral TikTok", className: "gradient-text" },
  { text: "scripts 10× faster", className: "gradient-text-accent" },
];

export function Hero() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
    if (reducedMotion || window.innerWidth < 1024 || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative border-b border-border pt-20 pb-14 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20"
    >
      <HeroBackground mouseX={mouseX} mouseY={mouseY} />

      <div className="container-wide relative px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[900px] flex-col items-center text-center">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <Badge variant="muted" className="mb-3 gap-1.5 px-3 py-1 text-xs font-normal sm:mb-4">
              <Sparkles className="h-3 w-3 text-violet" aria-hidden="true" />
              Now in public beta
            </Badge>
          </motion.div>

          <StaggeredHeadline lines={headlineLines} baseDelay={0.1} />

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
            className="mt-4 max-w-[700px] text-lg leading-relaxed text-muted-foreground sm:mt-5 sm:text-xl lg:text-[22px] lg:leading-[1.55]"
          >
            HyperScripter turns your ideas into scroll-stopping hooks, full scripts,
            CTAs, captions, and hashtags — built for creators who move fast.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
            className="mt-6 w-full sm:mt-8"
          >
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button variant="default" size="lg" asChild className="h-12 w-full px-8 text-base sm:w-auto">
                <Link href="/signup">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-12 w-full px-8 text-base sm:w-auto">
                <Link href="#generated-script-preview">See it in action</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
              No credit card required · Free plan available
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
