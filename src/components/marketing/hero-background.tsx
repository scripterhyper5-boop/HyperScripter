"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

interface HeroBackgroundProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

export function HeroBackground({ mouseX, mouseY }: HeroBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const spotlightX = useSpring(mouseX, { stiffness: 120, damping: 28, mass: 0.6 });
  const spotlightY = useSpring(mouseY, { stiffness: 120, damping: 28, mass: 0.6 });

  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${spotlightX}px ${spotlightY}px, oklch(0.65 0.25 290 / 10%), transparent 42%)`;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div className="hero-grid-animated absolute inset-0 opacity-80" />

      {!reducedMotion && (
        <motion.div
          className="absolute inset-0 hidden lg:block"
          style={{ background: spotlight }}
        />
      )}

      <motion.div
        style={{ y: reducedMotion ? 0 : blobY1 }}
        className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-violet/5 blur-[120px]"
      />
      <motion.div
        style={{ y: reducedMotion ? 0 : blobY2 }}
        className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo/5 blur-[100px]"
      />
    </div>
  );
}

interface HeroParallaxProps {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export function HeroParallax({ children, className, offset = 40 }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);

  return (
    <motion.div ref={ref} style={{ y: reducedMotion ? 0 : y }} className={className}>
      {children}
    </motion.div>
  );
}

export { EASE };
