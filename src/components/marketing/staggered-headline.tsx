"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/components/marketing/hero-background";
import { cn } from "@/lib/utils";

interface StaggeredHeadlineProps {
  lines: { text: string; className: string }[];
  baseDelay?: number;
  className?: string;
}

const headlineClassName =
  "mx-auto max-w-[900px] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl xl:leading-[1.02]";

export function StaggeredHeadline({
  lines,
  baseDelay = 0.15,
  className,
}: StaggeredHeadlineProps) {
  const reducedMotion = useReducedMotion();
  const classes = cn(headlineClassName, className);
  let wordIndex = 0;

  if (reducedMotion) {
    return (
      <h1 className={classes}>
        {lines.map((line) => (
          <span key={line.text}>
            <span className={line.className}>{line.text}</span>
            <br />
          </span>
        ))}
      </h1>
    );
  }

  return (
    <motion.h1
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: baseDelay } },
      }}
      className={classes}
    >
      {lines.map((line) => (
        <span key={line.text} className="block overflow-hidden">
          {line.text.split(" ").map((word) => {
            const i = wordIndex++;
            return (
              <motion.span
                key={`${line.text}-${word}-${i}`}
                variants={{
                  hidden: { opacity: 0, y: "110%" },
                  visible: {
                    opacity: 1,
                    y: "0%",
                    transition: { duration: 0.55, ease: EASE },
                  },
                }}
                className={`mr-[0.28em] inline-block ${line.className}`}
              >
                {word}
              </motion.span>
            );
          })}
        </span>
      ))}
    </motion.h1>
  );
}
