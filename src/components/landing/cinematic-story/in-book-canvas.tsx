import React from "react";
import { motion, MotionValue, useTransform } from "framer-motion";
import { Calendar, CheckSquare, Flame, Users, Award, BookOpen, Clock } from "lucide-react";

interface InBookCanvasProps {
  /** Normalized scroll progress inside the book world (0.00 to 1.00) */
  scrollProgress: MotionValue<number>;
  className?: string;
}

/**
 * InBookCanvas: Editorial Luxury Notebook Spread
 * Designed in the spirit of a high-end academic journal / Apple keynote:
 * - Ivory parchment texture with subtle debossed spine
 * - Cormorant Garamond serif display typography
 * - Deep burgundy (#722F37) accents, warm charcoal text (#1C1917)
 * - Restrained hairline ink rules, zero cartoon elements
 */
export function InBookCanvas({ scrollProgress, className = "" }: InBookCanvasProps) {
  // Phase 1: Spread Intro & Weekly Architecture (0.00 - 0.28)
  const plannerOpacity = useTransform(scrollProgress, [0.0, 0.08, 0.22, 0.28], [0, 1, 1, 0]);
  const plannerY = useTransform(scrollProgress, [0.0, 0.08, 0.22, 0.28], [24, 0, 0, -24]);

  // Phase 2: Daily Focus & Execution (0.24 - 0.48)
  const tasksOpacity = useTransform(scrollProgress, [0.24, 0.30, 0.42, 0.48], [0, 1, 1, 0]);
  const tasksY = useTransform(scrollProgress, [0.24, 0.30, 0.42, 0.48], [24, 0, 0, -24]);

  // Phase 3: Consistency Heatmap & Roman Streak (0.44 - 0.68)
  const heatmapOpacity = useTransform(scrollProgress, [0.44, 0.50, 0.62, 0.68], [0, 1, 1, 0]);
  const heatmapY = useTransform(scrollProgress, [0.44, 0.50, 0.62, 0.68], [24, 0, 0, -24]);

  // Phase 4: Collegiate Peer Momentum (0.64 - 0.86)
  const friendsOpacity = useTransform(scrollProgress, [0.64, 0.70, 0.80, 0.86], [0, 1, 1, 0]);
  const friendsY = useTransform(scrollProgress, [0.64, 0.70, 0.80, 0.86], [24, 0, 0, -24]);

  // Phase 5: Scholastic Attainment & Seals (0.82 - 1.00)
  const achievementsOpacity = useTransform(scrollProgress, [0.82, 0.88, 1.0], [0, 1, 1]);
  const achievementsY = useTransform(scrollProgress, [0.82, 0.88, 1.0], [24, 0, 0]);

  // Dynamic values
  const streakCount = useTransform(scrollProgress, [0.48, 0.62], [1, 23]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-3 sm:p-6 md:p-8 select-none ${className}`}>
      {/* Physical Open Journal Frame */}
      <div className="relative w-full max-w-5xl aspect-[16/10] min-h-[540px] rounded-2xl shadow-2xl border border-stone-800/40 bg-[#FAF7F0] overflow-hidden flex flex-col md:flex-row text-[#1C1917]">
        {/* Fine Parchment Paper Texture & Hairline Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(#A8A29E 0.65px, transparent 0.65px), linear-gradient(to bottom, transparent 27px, #E7E2D6 28px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Central Book Spine Groove & Burgundy Silk Ribbon */}
        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 z-30 pointer-events-none">
          {/* Subtle Gutter Shadow */}
          <div className="w-full h-full bg-gradient-to-r from-stone-900/15 via-stone-900/30 to-stone-900/15" />
          {/* Burgundy Silk Bookmark Ribbon */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-[94%] bg-[#722F37] shadow-lg flex flex-col justify-end">
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#FAF7F0]" />
          </div>
        </div>

        {/* Left Page Top Folio */}
        <div className="absolute top-4 sm:top-5 left-6 sm:left-10 text-[10px] sm:text-[11px] font-mono tracking-[0.22em] uppercase text-stone-600 font-semibold z-20 flex items-center gap-2">
          <span>FOLIO III</span>
          <span className="text-stone-300">/</span>
          <span>ACADEMIC ARCHITECTURE</span>
        </div>

        {/* Right Page Top Folio */}
        <div className="absolute top-4 sm:top-5 right-6 sm:right-10 text-[10px] sm:text-[11px] font-mono tracking-[0.22em] uppercase text-stone-600 font-semibold z-20 flex items-center gap-2">
          <span>SKILLGRID JOURNAL</span>
          <span className="text-stone-300">/</span>
          <span>VOL. IV</span>
        </div>

        {/* ============================================================ */}
        {/* PHASE 1: WEEKLY ARCHITECTURE (0.00 - 0.28)                  */}
        {/* ============================================================ */}
        <motion.div
          style={{ opacity: plannerOpacity, y: plannerY }}
          className="absolute inset-0 p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 pointer-events-none"
        >
          {/* Left Page: Plan Your Week */}
          <div className="w-full md:w-1/2 pr-0 md:pr-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#722F37]/8 text-[#722F37] border border-[#722F37]/20 font-mono text-[10px] tracking-widest uppercase font-semibold mb-3 w-fit">
              <Calendar className="size-3" />
              Syllabus Blueprint &middot; Page 01
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-[#1C1917] leading-tight">
              Plan your week with disciplined clarity.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 font-sans leading-relaxed">
              Transform unstructured ambition into dedicated study allocations. A calm, rigorous rhythm designed for deep mastery.
            </p>

            {/* Editorial Timetable */}
            <div className="mt-6 space-y-2">
              {[
                { day: "MON", title: "Distributed Systems & Consensus", time: "90 min", done: true },
                { day: "TUE", title: "Measure Theory & Probability", time: "60 min", done: true },
                { day: "WED", title: "Neural Attention Architectures", time: "75 min", done: true },
                { day: "THU", title: "Applied Cryptography & Proofs", time: "60 min", done: false },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    item.done
                      ? "bg-white/80 border-[#E5DFD4] text-[#1C1917]"
                      : "bg-[#F3EFE6]/60 border-transparent text-stone-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-200/70 text-stone-700">
                      {item.day}
                    </span>
                    <span className={`text-sm ${item.done ? "font-medium" : "text-stone-500"}`}>
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-stone-400">{item.time}</span>
                    <span
                      className={`size-4 rounded flex items-center justify-center text-[10px] font-bold ${
                        item.done ? "text-[#722F37] border border-[#722F37]/40 bg-[#722F37]/10" : "border border-stone-300"
                      }`}
                    >
                      {item.done ? "✓" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Page: Daily Cadence */}
          <div className="w-full md:w-1/2 pl-0 md:pl-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/60 text-stone-700 border border-stone-300/80 font-mono text-[10px] tracking-widest uppercase font-semibold mb-3 w-fit">
              <CheckSquare className="size-3" />
              Daily Cadence &middot; Today
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-medium text-[#1C1917]">
              Steady, quiet execution.
            </h3>
            <p className="mt-1 text-sm text-stone-600 font-sans">
              No pressure. No frantic multitasking. Just purposeful progress, one session at a time.
            </p>

            <div className="mt-6 p-5 rounded-xl bg-white/80 border border-[#E5DFD4] shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-stone-200 text-xs font-mono">
                <span className="text-stone-500 uppercase tracking-wider">Today's Focus</span>
                <span className="font-semibold text-[#722F37]">3 OF 4 COMPLETED</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="size-4 rounded text-xs flex items-center justify-center bg-[#722F37] text-white">✓</span>
                  <span className="line-through text-stone-400">Complete 3 algorithmic proofs</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="size-4 rounded text-xs flex items-center justify-center bg-[#722F37] text-white">✓</span>
                  <span className="line-through text-stone-400">Review Matrix Factorization & SVD notes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="size-4 rounded text-xs flex items-center justify-center bg-[#722F37] text-white">✓</span>
                  <span className="line-through text-stone-400">Read Attention Mechanism paper</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="size-4 rounded border border-stone-400" />
                  <span className="font-medium text-stone-800">Complete Distributed Storage lab synthesis</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* PHASE 2: DAILY TASKS IN ACTION (0.24 - 0.48)                */}
        {/* ============================================================ */}
        <motion.div
          style={{ opacity: tasksOpacity, y: tasksY }}
          className="absolute inset-0 p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 pointer-events-none"
        >
          <div className="w-full md:w-1/2 pr-0 md:pr-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/70 text-stone-700 border border-stone-300 font-mono text-[10px] tracking-widest uppercase font-semibold mb-3 w-fit">
              <Clock className="size-3" />
              Immersion in Progress
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-[#1C1917] leading-tight">
              Turn intent into quiet accomplishment.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 font-sans leading-relaxed">
              Every committed minute directly maps to your academic transcript. Strike off completed topics and watch your intellectual velocity compound.
            </p>
          </div>

          <div className="w-full md:w-1/2 pl-0 md:pl-8 flex flex-col justify-center">
            <div className="space-y-3 p-6 rounded-xl bg-white/80 border border-[#E5DFD4] shadow-sm">
              {[
                { title: "Binary Search Trees & Red-Black Invariants", tag: "SYSTEMS", min: "45 min", done: true },
                { title: "Multivariate Calculus Problem Formulation", tag: "MATH", min: "60 min", done: true },
                { title: "Backpropagation Gradient Derivation", tag: "MACHINE LEARNING", min: "50 min", done: true },
                { title: "RSA & Elliptic Curve Protocols", tag: "CRYPTOGRAPHY", min: "40 min", done: true },
              ].map((task, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#E5DFD4] bg-[#FAF8F3]"
                >
                  <div className="flex items-center gap-3">
                    <span className="size-4 rounded bg-[#722F37] text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                    <span className="text-sm font-medium text-stone-800 line-through decoration-stone-400">
                      {task.title}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-stone-600 bg-stone-200/60 px-2 py-0.5 rounded">
                    {task.min}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* PHASE 3: CONSISTENCY HEATMAP & ROMAN STREAK (0.44 - 0.68)   */}
        {/* ============================================================ */}
        <motion.div
          style={{ opacity: heatmapOpacity, y: heatmapY }}
          className="absolute inset-0 p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 pointer-events-none"
        >
          <div className="w-full md:w-5/12 pr-0 md:pr-6 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/20 font-mono text-[10px] tracking-widest uppercase font-semibold mb-3 w-fit">
              <Flame className="size-3 text-[#722F37]" />
              Chronicle of Discipline
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-[#1C1917] leading-tight">
              Consistency is compound interest.
            </h2>
            <p className="mt-3 text-sm text-stone-600 font-sans leading-relaxed">
              Nothing motivates quite like seeing your persistent effort materialized in ink, day after disciplined day.
            </p>

            {/* Restrained Academic Streak Badge */}
            <div className="mt-6 flex items-center gap-4 p-4 rounded-xl bg-white/80 border border-[#E5DFD4] shadow-sm w-fit">
              <div className="size-12 rounded-lg bg-[#722F37] text-[#FAF7F0] flex flex-col items-center justify-center font-display shadow-sm">
                <span className="text-xs font-mono font-bold tracking-widest text-[#D7A7B1]">STREAK</span>
                <span className="text-base font-bold leading-none">XXIII</span>
              </div>
              <div>
                <div className="text-xl font-display font-semibold text-[#1C1917]">
                  <motion.span>{streakCount}</motion.span> Consecutive Days
                </div>
                <div className="text-xs font-mono text-stone-500">94th percentile scholarly cohort</div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-7/12 pl-0 md:pl-6 flex flex-col justify-center">
            <div className="p-6 rounded-xl bg-white/85 border border-[#E5DFD4] shadow-sm">
              <div className="flex justify-between items-center mb-4 text-xs font-mono text-stone-500">
                <span className="tracking-wider">ACTIVITY SKYLINE &middot; 24 WEEKS</span>
                <span className="text-[#722F37] font-semibold">91% DISCIPLINE INDEX</span>
              </div>

              {/* Ink-drawn Contribution Heatmap in Burgundy & Stone */}
              <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-hidden">
                {Array.from({ length: 7 * 22 }).map((_, i) => {
                  const active = i < 118;
                  const intensity = (i * 19) % 4;
                  return (
                    <div
                      key={i}
                      className={`size-3 sm:size-3.5 rounded-[2px] transition-colors duration-500 ${
                        active
                          ? intensity === 3
                            ? "bg-[#722F37]"
                            : intensity === 2
                            ? "bg-[#9B4A55]"
                            : intensity === 1
                            ? "bg-[#C4929B]"
                            : "bg-[#E2CBD0]"
                          : "bg-[#EAE5DA]"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4 text-[10px] text-stone-500 font-mono">
                <span>Rest</span>
                <div className="flex gap-1 items-center">
                  <span className="size-2 rounded-[2px] bg-[#EAE5DA]" />
                  <span className="size-2 rounded-[2px] bg-[#E2CBD0]" />
                  <span className="size-2 rounded-[2px] bg-[#C4929B]" />
                  <span className="size-2 rounded-[2px] bg-[#9B4A55]" />
                  <span className="size-2 rounded-[2px] bg-[#722F37]" />
                </div>
                <span>Deep focus</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* PHASE 4: COLLEGIATE PEER MOMENTUM (0.64 - 0.86)             */}
        {/* ============================================================ */}
        <motion.div
          style={{ opacity: friendsOpacity, y: friendsY }}
          className="absolute inset-0 p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 pointer-events-none"
        >
          <div className="w-full md:w-1/2 pr-0 md:pr-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/70 text-stone-700 border border-stone-300 font-mono text-[10px] tracking-widest uppercase font-semibold mb-3 w-fit">
              <Users className="size-3" />
              Collegiate Momentum
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-[#1C1917] leading-tight">
              Study alongside peers. Hold the line.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 font-sans leading-relaxed">
              No toxic leaderboards or vanity metrics. Real colleagues sharing daily dedication, holding one another to the highest standard.
            </p>
          </div>

          <div className="w-full md:w-1/2 pl-0 md:pl-8 flex flex-col justify-center">
            <div className="relative p-6 rounded-xl bg-white/80 border border-[#E5DFD4] shadow-sm space-y-3">
              {/* Subtle hairline connection line */}
              <div className="absolute left-[38px] top-8 bottom-8 w-[1px] bg-stone-300/80 pointer-events-none" />

              {[
                { name: "Alex Chen", initials: "AC", discipline: "Distributed Consensus", streak: "23 days" },
                { name: "Maya Patel", initials: "MP", discipline: "Computational Genomics", streak: "18 days" },
                { name: "Jordan Brooks", initials: "JB", discipline: "Algebraic Topology", streak: "31 days" },
              ].map((peer, i) => (
                <div
                  key={i}
                  className="relative z-10 flex items-center justify-between p-3.5 rounded-lg bg-[#FAF8F3] border border-[#E5DFD4]"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full border border-[#722F37]/30 bg-[#722F37]/10 text-[#722F37] font-mono font-bold text-xs flex items-center justify-center">
                      {peer.initials}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-stone-900">{peer.name}</div>
                      <div className="text-xs text-stone-500 font-mono">{peer.discipline}</div>
                    </div>
                  </div>
                  <div className="font-mono text-xs font-semibold text-[#722F37] px-2.5 py-1 rounded bg-[#722F37]/10 border border-[#722F37]/20">
                    {peer.streak}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* PHASE 5: SCHOLASTIC ATTAINMENT & SEALS (0.82 - 1.00)         */}
        {/* ============================================================ */}
        <motion.div
          style={{ opacity: achievementsOpacity, y: achievementsY }}
          className="absolute inset-0 p-8 sm:p-12 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 pointer-events-none"
        >
          <div className="w-full md:w-1/2 pr-0 md:pr-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#722F37]/10 text-[#722F37] border border-[#722F37]/20 font-mono text-[10px] tracking-widest uppercase font-semibold mb-3 w-fit">
              <Award className="size-3 text-[#722F37]" />
              Scholastic Milestones
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight text-[#1C1917] leading-tight">
              Quiet milestones. Lasting stature.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-600 font-sans leading-relaxed">
              Every committed hour earns permanent marks of attainment. Watch your intellectual ledger flourish with enduring distinction.
            </p>
          </div>

          <div className="w-full md:w-1/2 pl-0 md:pl-8 flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-3 p-6 rounded-xl bg-white/85 border border-[#E5DFD4] shadow-sm">
              <div className="p-4 rounded-lg border border-[#E5DFD4] bg-[#FAF8F3] flex flex-col items-center text-center">
                <div className="size-10 rounded-full border border-[#722F37]/40 bg-[#722F37]/10 flex items-center justify-center font-display text-sm font-bold text-[#722F37] mb-2">
                  VII
                </div>
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-stone-800">Prime Rhythm</div>
                <div className="text-[11px] text-stone-500 mt-0.5">7 Unbroken Days</div>
              </div>

              <div className="p-4 rounded-lg border border-[#E5DFD4] bg-[#FAF8F3] flex flex-col items-center text-center">
                <div className="size-10 rounded-full border border-stone-400 bg-stone-200/60 flex items-center justify-center font-display text-sm font-bold text-stone-700 mb-2">
                  CXX
                </div>
                <div className="text-xs font-mono font-bold tracking-wider uppercase text-stone-800">Deep Immersion</div>
                <div className="text-[11px] text-stone-500 mt-0.5">120 Focus Hours</div>
              </div>

              <div className="col-span-2 p-3.5 rounded-lg border border-[#E5DFD4] bg-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono tracking-widest uppercase text-stone-400">Current Standing</div>
                  <div className="text-sm font-display font-semibold text-[#1C1917]">
                    Collegiate Scholar &middot; Level VIII
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-[#722F37] px-2.5 py-1 rounded bg-[#722F37]/10 border border-[#722F37]/20">
                  2,450 XP
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
