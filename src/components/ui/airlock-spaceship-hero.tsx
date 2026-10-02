"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowDown } from "lucide-react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  AIRLOCK — a scroll-locked, scrub-driven video hero                        */
/*                                                                            */
/*  While the hero owns the screen the page cannot move: the body is pinned   */
/*  with position:fixed, the same technique modal libraries use, because      */
/*  overflow:hidden alone is not reliable across browsers. Wheel, touch and   */
/*  key input is captured and spent on video.currentTime instead, forward     */
/*  and backward. When the video reaches its end and the reader keeps         */
/*  pushing forward the page is handed back and scrolls normally; scrolling   */
/*  back up to the top takes the lock again at full progress.                 */
/*                                                                            */
/*  No dependencies beyond React. Reduced-motion readers never get locked.    */
/* -------------------------------------------------------------------------- */

/* --- Types --- */

export type AirlockTheme = "vacuum" | "ember" | "ice"

interface Palette {
    /** Page-coloured backdrop shown before the first frame decodes. */
    backdrop: string
    /** Headline and tagline colour. */
    text: string
    /** Scroll hint and signature colour. */
    muted: string
    /** Progress bar fill. */
    bar: string
}

const PALETTES: Record<AirlockTheme, Palette> = {
    vacuum: {
        backdrop: "#05070d",
        text: "#f2f4f8",
        muted: "rgba(240,244,248,0.72)",
        bar: "linear-gradient(90deg, rgba(255,255,255,0.45), rgba(255,255,255,0.95))",
    },
    ember: {
        backdrop: "#0d0705",
        text: "#fdf1e7",
        muted: "rgba(253,241,231,0.72)",
        bar: "linear-gradient(90deg, rgba(255,176,102,0.45), rgba(255,214,168,0.95))",
    },
    ice: {
        backdrop: "#04090f",
        text: "#eaf4ff",
        muted: "rgba(234,244,255,0.72)",
        bar: "linear-gradient(90deg, rgba(120,190,255,0.45), rgba(214,236,255,0.95))",
    },
}

export interface AirlockHeroProps {
    /** Video to scrub. Must be same-origin or CORS-enabled, and seekable. */
    videoSrc?: string
    /** Still shown until the video has enough data to paint. Kills the black flash. */
    posterSrc?: string
    /** Headline over the opening frames. Fades out as the scrub starts. */
    title?: string
    /** Word next to the bouncing arrow. Hidden once the reader moves. */
    scrollHint?: string
    /** Payoff line, revealed over the last fifth of the scrub. Pass "" to drop it. */
    tagline?: string
    /** Credit in the corner. Pass false to drop it. */
    signature?: { name: string; url: string } | false
    /** Input distance in pixels needed to scrub the whole video. Higher feels heavier. */
    scrubDistance?: number
    /**
     * Extra input distance spent on the last frame, after the film has run out.
     * The picture is frozen and the tagline is fully up for this stretch, so the
     * hero has somewhere to land instead of stopping dead. Set to 0 to drop it.
     */
    holdDistance?: number
    /** Named colour set. */
    theme?: AirlockTheme
    /** Label for the control that hands the page back without scrubbing. */
    skipLabel?: string
    className?: string
    style?: React.CSSProperties
}

/* --- Constants --- */

const CDN = "https://cdn.jsdelivr.net/gh/yuraoak/airlock-hero-assets@main"
const DEFAULT_VIDEO = `${CDN}/iss-hero-1080p.mp4`
const DEFAULT_POSTER = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1080&auto=format&fit=crop"
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/** Keyboard fallback, so a reader without a wheel is never stuck. */
const KEY_STEPS: Record<string, number> = {
    ArrowDown: 140,
    ArrowUp: -140,
    PageDown: 700,
    PageUp: -700,
    " ": 700,
    End: Number.MAX_SAFE_INTEGER,
    Home: Number.MIN_SAFE_INTEGER,
}

/* --- Helpers --- */

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v))
}

/* --- Component --- */

export default function AirlockHero({
    videoSrc = DEFAULT_VIDEO,
    posterSrc = DEFAULT_POSTER,
    title = "THE AIRLOCK OPENS",
    scrollHint = "SCROLL",
    tagline = "Everything you know fits in one half of the frame.",
    signature = false,
    scrubDistance = 1800,
    holdDistance = 600,
    theme = "vacuum",
    skipLabel = "Skip intro",
    className,
    style,
}: AirlockHeroProps) {
    const sectionRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const posterLayerRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLDivElement>(null)
    const hintRef = useRef<HTMLDivElement>(null)
    const taglineRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const scrimRef = useRef<HTMLDivElement>(null)
    const releaseRef = useRef<() => void>(() => {})
    const [ready, setReady] = useState(false)

    const palette = PALETTES[theme]

    useEffect(() => {
        const video = videoRef.current
        const section = sectionRef.current
        if (!video || !section) return

        const reduceMotion =
            typeof window !== "undefined" &&
            (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)

        let duration = 0
        let rafId = 0
        let target = 0
        let shown = 0
        let moved = false
        let seeking = false
        let queued: number | null = null
        let locked = false
        let lockedY = 0
        let touchY = 0
        let released = false
        let lastY = 0
        let seekTimeout: any = null

        const totalDistance = scrubDistance + holdDistance
        const scrubShare = scrubDistance / totalDistance

        /* --- Seeking ------------------------------------------------------- */

        function applyCurrentTime(targetTime: number) {
            if (!video) return
            try {
                if (typeof (video as any).fastSeek === "function") {
                    (video as any).fastSeek(targetTime)
                } else {
                    video.currentTime = targetTime
                }
            } catch (e) {
                video.currentTime = targetTime
            }
        }

        function onSeekCompleted() {
            seeking = false
            if (seekTimeout) {
                clearTimeout(seekTimeout)
                seekTimeout = null
            }
            if (queued !== null) {
                const nextT = queued
                queued = null
                seekTo(nextT)
            }
        }

        function seekTo(t: number) {
            if (!video) return
            if (isNaN(t) || duration <= 0) return

            const targetTime = clamp(t, 0, Math.max(0, duration - 0.04))

            // Avoid redundant seeks if already near target
            if (Math.abs(video.currentTime - targetTime) < 0.02) {
                return
            }

            if (seeking) {
                queued = targetTime
                return
            }

            seeking = true
            applyCurrentTime(targetTime)

            // Watchdog: If seeked event does not fire within 120ms (e.g. stalled buffer or stationary frame), recover seeking
            if (seekTimeout) clearTimeout(seekTimeout)
            seekTimeout = setTimeout(() => {
                onSeekCompleted()
            }, 120)
        }

        /* --- Painting ------------------------------------------------------ */

        function paint(p: number) {
            const videoP = clamp(p / scrubShare, 0, 1)

            if (duration > 0) {
                seekTo(Math.min(videoP * duration, duration - 0.04))
            }

            const titleAlpha = 1 - clamp(videoP / 0.35, 0, 1)
            const taglineAlpha = clamp((videoP - 0.82) / 0.18, 0, 1)
            const zoomScale = 1 + videoP * 0.08

            if (videoRef.current) {
                videoRef.current.style.transform = `scale(${zoomScale})`
            }
            if (posterLayerRef.current) {
                posterLayerRef.current.style.transform = `scale(${zoomScale})`
            }
            if (scrimRef.current) {
                scrimRef.current.style.opacity = String(Math.max(titleAlpha, taglineAlpha))
            }
            if (titleRef.current) {
                const t = titleAlpha
                titleRef.current.style.opacity = String(t)
                titleRef.current.style.transform = `translateY(${(1 - t) * -24}px) scale(${0.96 + t * 0.04})`
                titleRef.current.style.filter = `blur(${(1 - t) * 10}px)`
            }
            if (hintRef.current) {
                hintRef.current.style.opacity = moved ? "0" : "1"
            }
            if (taglineRef.current) {
                const t = taglineAlpha
                taglineRef.current.style.opacity = String(t)
                taglineRef.current.style.transform = `translateY(${(1 - t) * 20}px) scale(${0.97 + t * 0.03})`
                taglineRef.current.style.filter = `blur(${(1 - t) * 8}px)`
            }
            if (barRef.current) {
                barRef.current.style.transform = `scaleX(${p})`
            }
        }

        /* --- The lock ------------------------------------------------------ */

        function engageLock() {
            if (locked) return
            if (window.scrollY > 100) return
            locked = true
            released = false
            lockedY = window.scrollY
            const b = document.body.style
            b.position = "fixed"
            b.top = `-${lockedY}px`
            b.left = "0"
            b.right = "0"
            b.width = "100%"
        }

        function releaseLock() {
            if (!locked) return
            locked = false
            const y = lockedY
            const b = document.body.style
            b.position = ""
            b.top = ""
            b.left = ""
            b.right = ""
            b.width = ""
            window.scrollTo(0, y)
            released = true
            lastY = y
        }

        releaseRef.current = () => {
            target = shown = 1
            moved = true
            paint(1)
            releaseLock()
        }

        function consume(deltaY: number) {
            if (!locked) return false
            if (target >= 0.95 && deltaY > 0) {
                releaseLock()
                return false
            }
            if (target <= 0 && deltaY < 0) {
                return false
            }
            target = clamp(target + deltaY / totalDistance, 0, 1)
            if (target > 0.001) moved = true
            return true
        }

        /* --- Input --------------------------------------------------------- */

        const onWheel = (e: WheelEvent) => {
            if (consume(e.deltaY)) e.preventDefault()
        }

        const onTouchStart = (e: TouchEvent) => {
            touchY = e.touches[0]?.clientY ?? 0
        }

        const onTouchMove = (e: TouchEvent) => {
            const y = e.touches[0]?.clientY ?? touchY
            const deltaY = touchY - y
            touchY = y
            if (consume(deltaY)) e.preventDefault()
        }

        const onKeyDown = (e: KeyboardEvent) => {
            const step = KEY_STEPS[e.key]
            if (step === undefined) return
            if (consume(step)) e.preventDefault()
        }

        const onScroll = () => {
            if (locked || !released) return
            const y = window.scrollY
            const climbing = y < lastY
            lastY = y
            if (climbing && y <= section!.offsetTop + 5) {
                target = shown = 1
                paint(1)
                engageLock()
            }
        }

        /* --- Media Ready Wiring -------------------------------------------- */

        const updateMediaReady = () => {
            if (video.duration && !isNaN(video.duration) && video.duration > 0) {
                duration = video.duration
            }
            setReady(true)
            if (reduceMotion) {
                target = shown = 1
                moved = true
                paint(1)
            }
        }

        if (video.readyState >= 1) {
            updateMediaReady()
        }

        video.addEventListener("loadedmetadata", updateMediaReady)
        video.addEventListener("loadeddata", updateMediaReady)
        video.addEventListener("canplay", updateMediaReady)
        video.addEventListener("seeked", onSeekCompleted)
        video.addEventListener("error", () => {
            setReady(true)
        })

        if (!reduceMotion) {
            if (window.scrollY <= section.offsetTop + 10) {
                engageLock()
            }

            window.addEventListener("wheel", onWheel, { passive: false })
            window.addEventListener("touchstart", onTouchStart, { passive: true })
            window.addEventListener("touchmove", onTouchMove, { passive: false })
            window.addEventListener("keydown", onKeyDown)
            window.addEventListener("scroll", onScroll, { passive: true })

            const frame = () => {
                shown += (target - shown) * 0.2
                paint(shown)
                rafId = requestAnimationFrame(frame)
            }
            rafId = requestAnimationFrame(frame)
        }

        return () => {
            if (seekTimeout) clearTimeout(seekTimeout)
            video.removeEventListener("loadedmetadata", updateMediaReady)
            video.removeEventListener("loadeddata", updateMediaReady)
            video.removeEventListener("canplay", updateMediaReady)
            video.removeEventListener("seeked", onSeekCompleted)
            window.removeEventListener("wheel", onWheel)
            window.removeEventListener("touchstart", onTouchStart)
            window.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("scroll", onScroll)
            cancelAnimationFrame(rafId)
            releaseLock()
        }
    }, [scrubDistance, holdDistance])

    return (
        <div
            ref={sectionRef}
            className={cn("relative h-[100dvh] w-full overflow-hidden select-none", className)}
            style={{ background: palette.backdrop, ...style }}
        >
            {/* Cinematic background poster layer: always visible so it's never a pitch black screen */}
            {posterSrc && (
                <div
                    ref={posterLayerRef}
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
                    style={{
                        backgroundImage: `url(${posterSrc})`,
                        opacity: ready ? 0.35 : 0.85,
                        filter: "brightness(0.7) contrast(1.1)",
                        transformOrigin: "center center",
                        willChange: "transform",
                    }}
                />
            )}

            {/* Video element */}
            <video
                ref={videoRef}
                src={videoSrc}
                poster={posterSrc}
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                    opacity: ready ? 1 : 0,
                    transformOrigin: "center center",
                    willChange: "transform",
                    transition: "opacity 0.6s ease",
                }}
            />

            {/* Gradient vignetting */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "linear-gradient(180deg, rgba(5,7,13,0.42), rgba(5,7,13,0) 30%, rgba(5,7,13,0.2) 70%, rgba(5,7,13,0.65))",
                }}
            />

            {/* Centre scrim */}
            <div
                ref={scrimRef}
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(ellipse 62% 44% at 50% 50%, rgba(5,7,13,0.68), rgba(5,7,13,0) 72%)",
                }}
            />

            {/* Title */}
            <div
                ref={titleRef}
                className="pointer-events-none absolute inset-0 flex items-center justify-center px-[6%] text-center"
            >
                <h1
                    className="inline-block font-extrabold leading-none tracking-[-0.02em]"
                    style={{
                        fontFamily: SANS,
                        fontSize: "clamp(30px, 7vw, 96px)",
                        color: palette.text,
                        textShadow: "0 4px 30px rgba(0,0,0,0.65)",
                        willChange: "transform, filter, opacity",
                    }}
                >
                    {title}
                </h1>
            </div>

            {/* Tagline */}
            {tagline ? (
                <div
                    ref={taglineRef}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center px-[8%] text-center opacity-0"
                >
                    <p
                        className="font-bold tracking-[-0.01em]"
                        style={{
                            fontFamily: SANS,
                            fontSize: "clamp(20px, 3.4vw, 40px)",
                            lineHeight: 1.2,
                            color: palette.text,
                            textShadow: "0 4px 24px rgba(0,0,0,0.7)",
                        }}
                    >
                        {tagline}
                    </p>
                </div>
            ) : null}

            {/* Scroll Hint & Down Arrow (Clickable to jump right in) */}
            <div
                ref={hintRef}
                onClick={() => releaseRef.current()}
                className="cursor-pointer absolute bottom-[clamp(20px,6vh,48px)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-[400ms] hover:opacity-100 z-10"
                style={{
                    color: palette.muted,
                    fontFamily: SANS,
                    fontSize: "clamp(10px, 1.4vw, 12px)",
                    fontWeight: 600,
                    letterSpacing: "0.3em",
                }}
            >
                <span>{scrollHint}</span>
                <style>{`
                    @keyframes airlock-bounce {
                        0%, 100% { transform: translateY(0); opacity: 0.5; }
                        50% { transform: translateY(5px); opacity: 1; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        [style*="airlock-bounce"] { animation: none !important; }
                    }
                `}</style>
                <ArrowDown 
                    size={18}
                    strokeWidth={1.5} 
                    aria-hidden="true" 
                    style={{ animation: "airlock-bounce 1.6s ease-in-out infinite" }} 
                />
            </div>

            {/* Quick Skip Button */}
            <button
                type="button"
                onClick={() => releaseRef.current()}
                className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground bg-black/40 hover:bg-black/70 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
                style={{ fontFamily: SANS }}
            >
                {skipLabel}
            </button>

            {/* Progress line */}
            <div className="absolute inset-x-0 bottom-0 h-0.5" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div
                    ref={barRef}
                    className="h-full w-full origin-left"
                    style={{ background: palette.bar, transform: "scaleX(0)" }}
                />
            </div>

            {signature ? (
                <span
                    className="absolute bottom-[clamp(10px,2vw,18px)] right-[clamp(12px,2.5vw,24px)] z-[2] font-medium"
                    style={{
                        fontFamily: SANS,
                        fontSize: "clamp(11px, 1.4vw, 13px)",
                        color: palette.muted,
                    }}
                >
                    by{" "}
                    <a
                        href={signature.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline transition-colors hover:opacity-100"
                        style={{ color: "inherit" }}
                    >
                        {signature.name}
                    </a>
                </span>
            ) : null}
        </div>
    )
}
