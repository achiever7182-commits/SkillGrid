"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PostLoginTransitionProps {
  onComplete: () => void;
}

export function PostLoginTransition({ onComplete }: PostLoginTransitionProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    // Cinematic editorial sequence timing (~2.6s total)
    const holdTimer = setTimeout(() => {
      setPhase("hold");
    }, 1800);

    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 2350);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2750);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6 select-none"
      style={{
        backgroundColor: "var(--color-background, #F8F4E7)",
        color: "var(--color-foreground, #2B2021)",
      }}
      role="status"
      aria-live="polite"
      aria-label="Welcome back to SkillGrid. Your space is ready."
    >
      {/* Subtle atmospheric vignette and luxury editorial grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 35%, rgba(114, 47, 55, 0.08) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Upper delicate hairline accent */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="h-[1px] w-20 mb-8 origin-center bg-primary/40"
        />

        {/* 1. Small Uppercase Kicker */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs uppercase tracking-[0.3em] font-bold text-primary mb-3 font-sans"
        >
          WELCOME BACK.
        </motion.p>

        {/* 2. Main Luxury Editorial Brand Mark */}
        <motion.h1
          initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.75, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-none"
        >
          SkillGrid.
        </motion.h1>

        {/* 3. Understated Supporting Line */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-sm sm:text-base font-sans tracking-wide text-muted-foreground"
        >
          Your space is ready.
        </motion.p>

        {/* Lower delicate hairline accent */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="h-[1px] w-20 mt-8 origin-center bg-primary/40"
        />
      </div>
    </motion.div>
  );
}
