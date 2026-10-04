import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Award, Users, Calendar, CheckSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ss/primitives";

export function AccessibleFallbackStory() {
  return (
    <div className="w-full bg-[#0A0B0E] text-[#FAF7F0] py-16 px-6 sm:px-10">
      <div className="max-w-4xl mx-auto space-y-24">
        {/* Step 1: Hero */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#722F37]/15 border border-[#722F37]/30 text-[#D7A7B1] font-mono text-[10px] tracking-[0.22em] uppercase font-semibold">
            <BookOpen className="size-3 text-[#D7A7B1]" />
            Chapter I &middot; The Study Sanctuary
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-medium tracking-tight text-[#FAF7F0] max-w-2xl mx-auto leading-tight">
            Your progress starts with one page.
          </h1>
          <p className="text-sm sm:text-base text-stone-400 max-w-lg mx-auto font-sans leading-relaxed">
            Step into your personal study space. Plan your syllabus, cultivate disciplined execution, and watch intellectual competence compound.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" asChild className="bg-[#722F37] hover:bg-[#883842] text-white font-medium px-8 h-12 rounded-xl text-sm shadow-md shadow-[#722F37]/20">
              <Link to="/auth" search={{ mode: "signup" }}>
                Begin your chronicle <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-stone-800 bg-stone-900/50 text-stone-300 hover:text-white px-8 h-12 rounded-xl text-sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>

        {/* Step 2: Plan Your Week */}
        <section className="grid md:grid-cols-2 gap-10 items-center p-8 rounded-2xl bg-[#121318] border border-stone-800/80">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#D7A7B1] uppercase tracking-widest">
              <Calendar className="size-3.5" /> 01 &middot; Weekly Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white">Plan your week with disciplined clarity.</h2>
            <p className="text-sm text-stone-400 leading-relaxed font-sans">
              Transform unstructured ambition into dedicated study allocations. A calm, rigorous rhythm designed for deep intellectual focus.
            </p>
          </div>
          <div className="space-y-2.5 p-5 rounded-xl bg-black/40 border border-stone-800 font-mono text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-stone-900/80 border border-[#722F37]/30 text-stone-200">
              <span>MON &middot; Distributed Consensus</span>
              <span className="text-[#D7A7B1] font-semibold">90m ✓</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-stone-900/80 border border-[#722F37]/30 text-stone-200">
              <span>TUE &middot; Measure Theory & Probability</span>
              <span className="text-[#D7A7B1] font-semibold">60m ✓</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-stone-900/40 border border-stone-800 text-stone-400">
              <span>WED &middot; Neural Attention Models</span>
              <span>75m</span>
            </div>
          </div>
        </section>

        {/* Step 3: Daily Cadence */}
        <section className="grid md:grid-cols-2 gap-10 items-center p-8 rounded-2xl bg-[#121318] border border-stone-800/80">
          <div className="space-y-4 md:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-300 uppercase tracking-widest">
              <CheckSquare className="size-3.5" /> 02 &middot; Daily Cadence
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white">Turn intent into quiet accomplishment.</h2>
            <p className="text-sm text-stone-400 leading-relaxed font-sans">
              Every committed minute directly maps to your academic transcript. Strike off completed topics and watch your velocity compound.
            </p>
          </div>
          <div className="space-y-2.5 p-5 rounded-xl bg-black/40 border border-stone-800 md:order-1 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/70 border border-stone-800 text-stone-300">
              <span className="line-through decoration-stone-500 text-stone-400">Binary Search Trees & Red-Black Invariants</span>
              <span className="font-mono text-[11px] text-[#D7A7B1]">45m ✓</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/70 border border-stone-800 text-stone-300">
              <span className="line-through decoration-stone-500 text-stone-400">Multivariate Calculus Problem Formulation</span>
              <span className="font-mono text-[11px] text-[#D7A7B1]">60m ✓</span>
            </div>
          </div>
        </section>

        {/* Step 4: Consistency Ledger */}
        <section className="grid md:grid-cols-2 gap-10 items-center p-8 rounded-2xl bg-[#121318] border border-stone-800/80">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#D7A7B1] uppercase tracking-widest">
              <Flame className="size-3.5 text-[#D7A7B1]" /> 03 &middot; Consistency Ledger
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white">Consistency is compound interest.</h2>
            <p className="text-sm text-stone-400 leading-relaxed font-sans">
              Nothing motivates quite like seeing your persistent effort materialized in ink, day after disciplined day.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-black/40 border border-stone-800 flex flex-col items-center justify-center">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#722F37]/15 border border-[#722F37]/30 text-[#FAF7F0]">
              <div className="size-10 rounded bg-[#722F37] flex items-center justify-center font-display font-bold text-sm text-[#FAF7F0]">
                XXIII
              </div>
              <div>
                <div className="font-display font-semibold text-lg">23 Consecutive Days</div>
                <div className="text-xs font-mono text-[#D7A7B1]">94th percentile cohort</div>
              </div>
            </div>
          </div>
        </section>

        {/* Step 5: Collegiate Momentum */}
        <section className="grid md:grid-cols-2 gap-10 items-center p-8 rounded-2xl bg-[#121318] border border-stone-800/80">
          <div className="space-y-4 md:order-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-stone-300 uppercase tracking-widest">
              <Users className="size-3.5" /> 04 &middot; Collegiate Momentum
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white">Study alongside peers. Hold the line.</h2>
            <p className="text-sm text-stone-400 leading-relaxed font-sans">
              No toxic leaderboards or vanity metrics. Real colleagues sharing daily dedication, holding one another to the highest standard.
            </p>
          </div>
          <div className="space-y-2.5 p-5 rounded-xl bg-black/40 border border-stone-800 md:order-1 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/60 border border-stone-800">
              <span className="font-medium text-stone-200">Alex Chen &middot; Distributed Consensus</span>
              <span className="text-[#D7A7B1] font-mono text-[11px]">23 days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/60 border border-stone-800">
              <span className="font-medium text-stone-200">Maya Patel &middot; Computational Genomics</span>
              <span className="text-[#D7A7B1] font-mono text-[11px]">18 days</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-900/60 border border-stone-800">
              <span className="font-medium text-stone-200">Jordan Brooks &middot; Algebraic Topology</span>
              <span className="text-[#D7A7B1] font-mono text-[11px]">31 days</span>
            </div>
          </div>
        </section>

        {/* Step 6: Scholastic Milestones */}
        <section className="grid md:grid-cols-2 gap-10 items-center p-8 rounded-2xl bg-[#121318] border border-stone-800/80">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-[#D7A7B1] uppercase tracking-widest">
              <Award className="size-3.5 text-[#D7A7B1]" /> 05 &middot; Scholastic Milestones
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-medium text-white">Quiet milestones. Lasting stature.</h2>
            <p className="text-sm text-stone-400 leading-relaxed font-sans">
              Every committed hour earns permanent marks of attainment. Watch your intellectual ledger flourish with enduring distinction.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 rounded-xl bg-black/40 border border-stone-800 text-center">
            <div className="p-3.5 rounded-lg bg-stone-900/70 border border-stone-800">
              <div className="font-display text-base font-bold text-[#D7A7B1]">VII</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-1">Prime Rhythm</div>
              <div className="text-[11px] text-stone-500">7 Unbroken Days</div>
            </div>
            <div className="p-3.5 rounded-lg bg-stone-900/70 border border-stone-800">
              <div className="font-display text-base font-bold text-stone-300">CXX</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-1">Deep Immersion</div>
              <div className="text-[11px] text-stone-500">120 Focus Hours</div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center space-y-6 pt-12 border-t border-stone-800/80">
          <Logo className="justify-center" />
          <h2 className="text-3xl sm:text-5xl font-display font-medium text-white">
            Small steps. Visible progress. <br />
            <span className="text-[#D7A7B1]">Lasting mastery.</span>
          </h2>
          <p className="text-sm sm:text-base text-stone-400 max-w-lg mx-auto font-sans leading-relaxed">
            Study with calm consistency. Watch competence compound. Join fellow scholars tracking intellectual growth with poise and precision.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" asChild className="bg-[#722F37] hover:bg-[#883842] text-white font-medium px-8 h-12 rounded-xl text-sm shadow-md shadow-[#722F37]/20">
              <Link to="/auth" search={{ mode: "signup" }}>
                Begin your chronicle &rarr;
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-stone-800 bg-stone-900/50 text-stone-300 hover:text-white px-8 h-12 rounded-xl text-sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
