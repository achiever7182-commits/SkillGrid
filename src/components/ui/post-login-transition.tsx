"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";

interface PostLoginTransitionProps {
  onComplete: () => void;
}

/**
 * PostLoginTransition — luxury editorial cinematic sequence
 *
 * Mounted at the root shell level so it survives route transitions.
 * Renders immediately at full opacity (no fade-in of the container itself)
 * to guarantee the underlying route change is invisible.
 *
 * Sequence (~2.8s):
 *   0.0s–0.15s  Container appears solid, hairline accent starts drawing
 *   0.15s–0.4s  "WELCOME BACK." kicker fades in from below
 *   0.5s–1.0s   "SkillGrid." brand mark focus-pulls from blur
 *   1.1s–1.6s   "Your space is ready." supporting line fades in
 *   1.6s–2.2s   Hold — the reader absorbs the message
 *   2.2s–2.8s   Container fades out, dashboard revealed underneath
 *
 * Reduced-motion: simple 1.2s hold with instant fade.
 */
export function PostLoginTransition({ onComplete }: PostLoginTransitionProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const prefersReducedMotion = useReducedMotion();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const completedRef = useRef(false);
  const navigate = useNavigate();

  // Stable callback ref to prevent effect re-runs
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const fireComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    const timers = timersRef.current;

    if (prefersReducedMotion) {
      // Reduced motion: brief hold then exit
      timers.push(setTimeout(() => {
        navigate({ to: "/dashboard" });
        setPhase("exit");
      }, 800));
      timers.push(setTimeout(fireComplete, 1200));
    } else {
      // Full cinematic sequence
      timers.push(setTimeout(() => setPhase("hold"), 2000));
      timers.push(setTimeout(() => {
        navigate({ to: "/dashboard" });
        setPhase("exit");
      }, 2400));
      timers.push(setTimeout(fireComplete, 2800));
    }

    return () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
  }, [prefersReducedMotion, fireComplete]);

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{
        duration: phase === "exit" ? (prefersReducedMotion ? 0.2 : 0.4) : (prefersReducedMotion ? 0.2 : 0.8),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 select-none"
      style={{
        backgroundColor: "var(--color-background, #F8F4E7)",
        color: "var(--color-foreground, #2B2021)",
      }}
      role="status"
      aria-live="polite"
      aria-label="Welcome back to SkillGrid. Your space is ready."
    >
      {/* Subtle atmospheric vignette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 50%, transparent 35%, rgba(114, 47, 55, 0.08) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Upper hairline accent */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
          className="h-[1px] w-16 sm:w-20 mb-8 origin-center"
          style={{ backgroundColor: "var(--color-primary, #722F37)", opacity: 0.4 }}
        />

        {/* 1. Small Uppercase Kicker */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease }}
          className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-bold mb-3"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-primary, #722F37)",
          }}
        >
          WELCOME BACK.
        </motion.p>

        {/* 2. Main Brand Mark — editorial serif/display treatment */}
        <motion.h1
          initial={{ opacity: 0, filter: "blur(8px)", y: 10 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.75, delay: 0.55, ease }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-none"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-foreground, #2B2021)",
          }}
        >
          SkillGrid.
        </motion.h1>

        {/* 3. Understated Supporting Line */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15, ease }}
          className="mt-6 text-sm sm:text-base tracking-wide"
          style={{
            fontFamily: "var(--font-sans)",
            color: "var(--color-muted-foreground, #6A5B5D)",
          }}
        >
          Your space is ready.
        </motion.p>

        {/* Lower hairline accent */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 1.3, ease }}
          className="h-[1px] w-16 sm:w-20 mt-8 origin-center"
          style={{ backgroundColor: "var(--color-primary, #722F37)", opacity: 0.4 }}
        />
      </div>
    </motion.div>
  );
}
