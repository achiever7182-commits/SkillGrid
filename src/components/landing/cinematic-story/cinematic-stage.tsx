import React, { useRef, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ss/primitives";
import { DeskSceneLayers } from "./desk-scene-layers";
import { InBookCanvas } from "./in-book-canvas";
import { AccessibleFallbackStory } from "./accessible-fallback";

export function CinematicStoryStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Master Scroll Progress across the 650vh track (0.00 to 1.00)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // -------------------------------------------------------------
  // CAMERA TIMELINE SCALES & PARALLAX
  // -------------------------------------------------------------
  // Camera Zoom: 1.0 (Hero) -> 1.45 (Approach) -> 7.2 (Inside Book) -> 1.0 (Pull Back)
  const cameraScale = useTransform(
    scrollYProgress,
    [0.0, 0.12, 0.25, 0.36, 0.68, 0.80, 0.86],
    [1.0, 1.0, 1.45, 7.2, 7.2, 1.05, 1.0]
  );

  // Camera Vertical Parallax centering onto the open notebook
  const cameraY = useTransform(
    scrollYProgress,
    [0.0, 0.12, 0.25, 0.36, 0.68, 0.80, 0.86],
    ["0%", "0%", "-8%", "-24%", "-24%", "0%", "0%"]
  );

  // Desk Scene Opacity (fades down slightly when book takes over completely)
  const deskSceneOpacity = useTransform(
    scrollYProgress,
    [0.32, 0.38, 0.68, 0.74],
    [1, 0, 0, 1]
  );

  // In-Book Canvas Opacity (fades in as book covers viewport, fades out on pull back)
  const inBookOpacity = useTransform(
    scrollYProgress,
    [0.32, 0.37, 0.68, 0.73],
    [0, 1, 1, 0]
  );

  // Normalized progress inside the book world (0.0 to 1.0 during master 0.36 - 0.68)
  const bookWorldProgress = useTransform(scrollYProgress, [0.36, 0.68], [0.0, 1.0]);

  // Desk State: Switch to "hasProgress" on pull-back
  const [hasProgress, setHasProgress] = useState(false);
  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setHasProgress(v >= 0.70);
    });
  }, [scrollYProgress]);

  // -------------------------------------------------------------
  // EDITORIAL TEXT OVERLAYS ACROSS THE SCROLL JOURNEY
  // -------------------------------------------------------------
  // Act 1 Text: "Your progress starts with one page." (0.00 - 0.14)
  const act1Opacity = useTransform(scrollYProgress, [0.0, 0.08, 0.14], [1, 1, 0]);
  const act1Y = useTransform(scrollYProgress, [0.0, 0.14], [0, -20]);

  // Act 2 Text: "Turn quiet intent into mastery." (0.13 - 0.28)
  const act2Opacity = useTransform(scrollYProgress, [0.13, 0.18, 0.24, 0.28], [0, 1, 1, 0]);
  const act2Y = useTransform(scrollYProgress, [0.13, 0.18, 0.28], [20, 0, -20]);

  // Act 6 Text: "Small steps. Visible mastery." (0.72 - 0.84)
  const act6Opacity = useTransform(scrollYProgress, [0.72, 0.76, 0.80, 0.84], [0, 1, 1, 0]);
  const act6Y = useTransform(scrollYProgress, [0.72, 0.76, 0.84], [20, 0, -20]);

  // Scroll Progress Bar at Top
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // If user prefers reduced motion or is on narrow mobile touch screen, use accessible story
  if (shouldReduceMotion || isMobile) {
    return (
      <div className="w-full bg-[#0B0C0E] min-h-screen">
        {/* Sticky Header */}
        <header className="sticky top-0 left-0 right-0 z-50 bg-[#0B0C0E]/90 backdrop-blur-md border-b border-stone-800/60 px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-stone-300 hover:text-white text-xs">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button size="sm" asChild className="bg-[#722F37] hover:bg-[#883842] text-white font-medium rounded-lg text-xs">
              <Link to="/auth" search={{ mode: "signup" }}>
                Create account
              </Link>
            </Button>
          </div>
        </header>

        {/* Accessible Story Flow */}
        <AccessibleFallbackStory />
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#0A0B0E] text-[#FAF7F0]">
      {/* Top Sticky Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0B0E]/85 backdrop-blur-md border-b border-white/[0.06] px-6 sm:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="transition-opacity hover:opacity-90">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-stone-300 hover:text-white text-xs font-medium">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="bg-[#722F37] hover:bg-[#883842] text-white font-medium px-4 h-9 rounded-lg text-xs shadow-sm shadow-[#722F37]/30 transition-colors">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create account
            </Link>
          </Button>
        </div>

        {/* Top Scroll Indicator Line */}
        <motion.div
          style={{ width: progressBarWidth }}
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[#722F37] via-[#A8525F] to-[#D7A7B1]"
        />
      </header>

      {/* ============================================================ */}
      {/* 650vh PINNED CONTAINER TRACK                                 */}
      {/* ============================================================ */}
      <div ref={containerRef} className="relative w-full h-[650vh]">
        {/* Sticky Full-Viewport Camera Stage */}
        <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
          {/* Main Cinematic Camera Frame with transform-origin at open journal */}
          <motion.div
            style={{
              scale: cameraScale,
              y: cameraY,
              transformOrigin: "50% 64%",
            }}
            className="relative w-full h-full flex items-center justify-center pointer-events-none"
          >
            {/* Chiaroscuro Study Space (Backlit Student Silhouette, Matte Walnut Desk, Warm Task Lamp) */}
            <motion.div style={{ opacity: deskSceneOpacity }} className="w-full h-full flex items-center justify-center">
              <DeskSceneLayers hasProgress={hasProgress} isIdleActive={true} />
            </motion.div>
          </motion.div>

          {/* In-Book Feature Experience (Fades seamlessly over open journal) */}
          <motion.div
            style={{ opacity: inBookOpacity }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <InBookCanvas scrollProgress={bookWorldProgress} />
          </motion.div>

          {/* ============================================================ */}
          {/* EDITORIAL TIMELINE NARRATIVE OVERLAYS                        */}
          {/* ============================================================ */}
          {/* Act 1 Overlay (0.00 - 0.14): "Your progress starts with one page." */}
          <motion.div
            style={{ opacity: act1Opacity, y: act1Y }}
            className="absolute top-24 sm:top-28 left-0 right-0 z-40 flex flex-col items-center text-center px-4 pointer-events-none"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#722F37]/15 border border-[#722F37]/30 text-[#D7A7B1] font-mono text-[10px] tracking-[0.22em] uppercase font-medium mb-3 backdrop-blur-sm">
              <BookOpen className="size-3 text-[#D7A7B1]" />
              Chapter I &middot; The Study Sanctuary
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-medium tracking-tight text-[#FAF7F0] drop-shadow-sm">
              Your progress starts with one page.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 font-sans max-w-md">
              Scroll down to step inside the journal and discover how SkillGrid shapes daily discipline.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-[#D7A7B1] font-mono opacity-80">
              <ChevronDown className="size-4 animate-bounce" />
              <span>Scroll to step inside</span>
            </div>
          </motion.div>

          {/* Act 2 Overlay (0.13 - 0.28): "Turn quiet intent into mastery." */}
          <motion.div
            style={{ opacity: act2Opacity, y: act2Y }}
            className="absolute top-24 sm:top-28 left-0 right-0 z-40 flex flex-col items-center text-center px-4 pointer-events-none"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-stone-800/60 border border-stone-700/60 text-stone-300 font-mono text-[10px] tracking-[0.22em] uppercase font-medium mb-3 backdrop-blur-sm">
              Deep Focus &middot; Zero Distractions
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium tracking-tight text-[#FAF7F0] drop-shadow-sm">
              Turn quiet intent into mastery.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 font-sans max-w-md">
              Entering the academic ledger where every hour of practice counts toward your goals.
            </p>
          </motion.div>

          {/* Act 6 Overlay (0.72 - 0.84): "Small steps. Visible mastery." */}
          <motion.div
            style={{ opacity: act6Opacity, y: act6Y }}
            className="absolute top-24 sm:top-28 left-0 right-0 z-40 flex flex-col items-center text-center px-4 pointer-events-none"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#722F37]/15 border border-[#722F37]/30 text-[#D7A7B1] font-mono text-[10px] tracking-[0.22em] uppercase font-medium mb-3 backdrop-blur-sm">
              Attainment &middot; The Loop Complete
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-medium tracking-tight text-[#FAF7F0] drop-shadow-sm">
              Small steps. Visible mastery.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-stone-300 font-sans max-w-md">
              The desk transforms as scholarly momentum takes permanent hold.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ACT 7: UNPINNED FINAL CALL TO ACTION (EDITORIAL FINISH)      */}
      {/* ============================================================ */}
      <section className="relative z-50 w-full bg-gradient-to-b from-[#0A0B0E] via-[#08090B] to-[#050608] py-24 sm:py-32 px-6 sm:px-10 border-t border-stone-800/60">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="flex justify-center">
            <Logo />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl font-display font-medium tracking-tight text-[#FAF7F0] leading-tight">
              Small steps. Visible progress. <br />
              <span className="text-[#D7A7B1]">Lasting mastery.</span>
            </h2>
            <p className="text-sm sm:text-base text-stone-400 max-w-lg mx-auto font-sans leading-relaxed">
              Study with calm consistency. Watch competence compound. Join fellow scholars tracking intellectual growth with poise and precision.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              asChild
              className="bg-[#722F37] hover:bg-[#883842] text-[#FAF7F0] font-medium px-8 h-12 rounded-xl text-sm shadow-lg shadow-[#722F37]/25 transition-all hover:-translate-y-0.5"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Begin your chronicle <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-stone-700/80 bg-stone-900/40 text-stone-300 hover:text-white hover:border-stone-600 px-8 h-12 rounded-xl text-sm"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>

          {/* Scholarly principles */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-[11px] font-mono tracking-wider uppercase text-stone-500">
            <span>&bull; No advertising</span>
            <span>&bull; Private by default</span>
            <span>&bull; Collegiality over leaderboards</span>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-stone-800/40 text-center text-xs text-stone-500 font-mono">
          SkillGrid &copy; {new Date().getFullYear()} &middot; Built for focused, continuous scholarship.
        </footer>
      </section>
    </div>
  );
}
