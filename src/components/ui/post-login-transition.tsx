"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PostLoginTransitionProps {
  onComplete: () => void;
}

export function PostLoginTransition({ onComplete }: PostLoginTransitionProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const holdTime = prefersReducedMotion ? 900 : 2000;
    const exitTime = prefersReducedMotion ? 1200 : 2450;

    const timer1 = setTimeout(() => {
      setPhase("hold");
    }, holdTime);

    const timer2 = setTimeout(() => {
      setPhase("exit");
    }, exitTime);

    const timer3 = setTimeout(() => {
      onComplete();
    }, exitTime + (prefersReducedMotion ? 250 : 380));

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: phase === "exit" ? 0.38 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 select-none"
      style={{
        backgroundColor: "var(--color-background, #F8F4E7)",
        color: "var(--color-foreground, #2B2021)",
      }}
      role="status"
      aria-live="polite"
      aria-label="Welcome to SkillGrid. Your space is ready."
    >
      {/* Subtle atmospheric vignette and luxury editorial grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 40%, rgba(114, 47, 55, 0.08) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Subtle upper hairline accent */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="h-[1px] w-16 mb-8 origin-center bg-primary/40"
        />

        {/* 1. Small Uppercase Kicker */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs uppercase tracking-[0.28em] font-semibold text-primary mb-3 font-sans"
        >
          Welcome Back
        </motion.p>

        {/* 2. Main Luxury Editorial Brand Mark */}
        <motion.h1
          initial={{ opacity: 0, filter: "blur(6px)", y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-foreground leading-none"
        >
          SkillGrid.
        </motion.h1>

        {/* 3. Understated Supporting Line */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 text-sm font-sans tracking-wide text-muted-foreground"
        >
          Your space is ready.
        </motion.p>

        {/* Subtle lower hairline accent */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-[1px] w-16 mt-8 origin-center bg-primary/40"
        />
      </div>
    </motion.div>
  );
}
