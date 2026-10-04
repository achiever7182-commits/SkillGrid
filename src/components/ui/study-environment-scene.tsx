import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface StudyEnvironmentSceneProps {
  onIntroComplete?: () => void;
  className?: string;
  isFocusedOnInput?: boolean;
}

export function StudyEnvironmentScene({
  onIntroComplete,
  className = "",
  isFocusedOnInput = false,
}: StudyEnvironmentSceneProps) {
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState(shouldReduceMotion ? 5 : 0);
  const [lampOn, setLampOn] = useState(true);

  useEffect(() => {
    if (shouldReduceMotion) {
      setStage(5);
      onIntroComplete?.();
      return;
    }

    // Sequence timing:
    // 0: Initial ambient room appears (0s)
    // 1: Student sits & settles into the desk (0.6s)
    // 2: Laptop opens & book slides open (1.4s)
    // 3: Lamp clicks on & desk space illuminates (2.1s)
    // 4: "Welcome to SkillGrid" announcement emerges (2.8s)
    // 5: Form presentation ready (3.4s)
    const timers = [
      setTimeout(() => setStage(1), 600),
      setTimeout(() => setStage(2), 1400),
      setTimeout(() => setStage(3), 2100),
      setTimeout(() => setStage(4), 2800),
      setTimeout(() => {
        setStage(5);
        onIntroComplete?.();
      }, 3400),
    ];

    return () => timers.forEach(clearTimeout);
  }, [shouldReduceMotion, onIntroComplete]);

  // Floating particles coordinates
  const particles = [
    { x: 380, y: 380, size: 2.5, d: 4, delay: 0 },
    { x: 420, y: 350, size: 3, d: 5, delay: 1.2 },
    { x: 460, y: 400, size: 2, d: 3.5, delay: 0.5 },
    { x: 360, y: 440, size: 2, d: 4.5, delay: 2.1 },
    { x: 490, y: 370, size: 3.5, d: 6, delay: 1.8 },
    { x: 440, y: 460, size: 2.5, d: 4.2, delay: 0.8 },
  ];

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden select-none ${className}`}>
      {/* Dynamic Ambient Background Glows */}
      <motion.div
        animate={{
          opacity: stage >= 3 ? (lampOn ? 0.35 : 0.15) : 0.05,
          scale: stage >= 3 ? 1.05 : 0.95,
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[130px] pointer-events-none -top-24 -left-20"
      />
      <motion.div
        animate={{
          opacity: stage >= 3 && lampOn ? 0.25 : 0.05,
        }}
        transition={{ duration: 1.2 }}
        className="absolute w-[450px] h-[450px] rounded-full bg-amber-400/20 blur-[120px] pointer-events-none top-40 right-10"
      />

      {/* Main Vector Illustrated Scene */}
      <div className="relative w-full max-w-[680px] aspect-[4/3.4] flex items-center justify-center">
        <svg
          viewBox="0 0 800 680"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-2xl"
        >
          <defs>
            {/* Window Night Sky Gradient */}
            <linearGradient id="nightSky" x1="200" y1="60" x2="200" y2="340" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#070D1E" />
              <stop offset="60%" stopColor="#0B1A3A" />
              <stop offset="100%" stopColor="#112952" />
            </linearGradient>

            {/* Lamp Warm Cone Gradient */}
            <radialGradient id="lampCone" cx="600" cy="220" r="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.20" />
              <stop offset="75%" stopColor="#3B82F6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#080C15" stopOpacity="0" />
            </radialGradient>

            {/* Laptop Glow Gradient */}
            <radialGradient id="screenGlow" cx="390" cy="420" r="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity={stage >= 2 ? 0.55 : 0} />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity={stage >= 2 ? 0.25 : 0} />
              <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0" />
            </radialGradient>

            {/* Desk Surface Gradient */}
            <linearGradient id="deskGrad" x1="120" y1="480" x2="700" y2="480" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0F172A" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Student Hoodie Gradient */}
            <linearGradient id="hoodieGrad" x1="300" y1="360" x2="380" y2="520" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Glass Clip Path for Window */}
            <clipPath id="windowClip">
              <rect x="110" y="70" width="220" height="260" rx="110" />
            </clipPath>
          </defs>

          {/* 1. ROOM WALL ARCHITECTURE */}
          <g opacity="0.12" stroke="#3B82F6" strokeWidth="1" strokeDasharray="3 6">
            <line x1="60" y1="120" x2="740" y2="120" />
            <line x1="60" y1="200" x2="740" y2="200" />
            <line x1="60" y1="280" x2="740" y2="280" />
            <line x1="60" y1="360" x2="740" y2="360" />
            <line x1="520" y1="40" x2="520" y2="460" />
            <line x1="640" y1="40" x2="640" y2="460" />
          </g>

          {/* 2. ACADEMIC ARCHED WINDOW */}
          <g id="window">
            <rect x="106" y="66" width="228" height="268" rx="114" fill="#0B132B" stroke="#1E293B" strokeWidth="4" />
            
            <g clipPath="url(#windowClip)">
              <rect x="110" y="70" width="220" height="260" fill="url(#nightSky)" />

              {/* Shimmering Night Stars */}
              {[
                { cx: 150, cy: 130, r: 1.5, d: 2 },
                { cx: 180, cy: 100, r: 2, d: 3 },
                { cx: 230, cy: 120, r: 1.2, d: 2.5 },
                { cx: 270, cy: 150, r: 1.8, d: 3.2 },
                { cx: 140, cy: 190, r: 1.2, d: 1.8 },
                { cx: 210, cy: 170, r: 2.2, d: 2.7 },
                { cx: 290, cy: 110, r: 1.5, d: 3.5 },
              ].map((star, i) => (
                <motion.circle
                  key={i}
                  cx={star.cx}
                  cy={star.cy}
                  r={star.r}
                  fill="#E2E8F0"
                  animate={{
                    opacity: [0.3, 0.95, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: star.d,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                />
              ))}

              {/* Crescent Moon */}
              <g transform="translate(250, 100)">
                <circle cx="16" cy="16" r="14" fill="#FEF08A" opacity="0.85" />
                <circle cx="21" cy="13" r="13" fill="#0B1A3A" />
                <circle cx="16" cy="16" r="22" fill="#FEF08A" opacity="0.08" />
              </g>

              {/* Campus Silhouette */}
              <path
                d="M110 300 L140 280 L160 285 L180 260 L185 240 L195 240 L200 260 L240 285 L270 270 L300 290 L330 310 L330 340 L110 340 Z"
                fill="#050B17"
              />
              <circle cx="190" cy="252" r="3.5" fill="#FDE047" opacity="0.8" />
              <line x1="190" y1="250" x2="190" y2="252" stroke="#050B17" strokeWidth="0.8" />
              <line x1="190" y1="252" x2="192" y2="253" stroke="#050B17" strokeWidth="0.8" />

              <rect x="145" y="290" width="3" height="4" fill="#FDE047" opacity="0.5" />
              <rect x="152" y="290" width="3" height="4" fill="#FDE047" opacity="0.6" />
              <rect x="250" y="295" width="4" height="4" fill="#60A5FA" opacity="0.5" />
              <rect x="280" y="298" width="3" height="4" fill="#FDE047" opacity="0.7" />
            </g>

            <line x1="220" y1="70" x2="220" y2="330" stroke="#1E293B" strokeWidth="4" />
            <line x1="110" y1="200" x2="330" y2="200" stroke="#1E293B" strokeWidth="4" />
            <rect x="100" y="328" width="240" height="10" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          </g>

          {/* 3. WALL SHELF WITH STUDY OBJECTS */}
          <g id="shelf">
            <rect x="470" y="160" width="220" height="10" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <path d="M485 170 L485 185 M675 170 L675 185" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />

            {/* Stack of Reference Books */}
            <rect x="490" y="118" width="14" height="42" rx="1.5" fill="#2563EB" stroke="#1D4ED8" />
            <line x1="493" y1="124" x2="501" y2="124" stroke="#93C5FD" strokeWidth="1" />
            <rect x="506" y="112" width="16" height="48" rx="1.5" fill="#7C3AED" stroke="#6D28D9" />
            <line x1="510" y1="120" x2="518" y2="120" stroke="#C4B5FD" strokeWidth="1" />
            <rect x="524" y="124" width="12" height="36" rx="1.5" fill="#0284C7" stroke="#0369A1" />
            <g transform="translate(538, 126) rotate(16)">
              <rect x="0" y="0" width="13" height="38" rx="1.5" fill="#475569" stroke="#334155" />
            </g>

            {/* Digital Study Clock */}
            <rect x="575" y="132" width="46" height="28" rx="5" fill="#0B1329" stroke="#1E293B" strokeWidth="1.5" />
            <text x="598" y="151" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              23:42
            </text>

            {/* Potted Plant */}
            <path d="M642 142 L658 142 L655 160 L645 160 Z" fill="#334155" />
            <path d="M650 142 Q640 128 634 134 Q642 142 650 142 Z" fill="#10B981" />
            <path d="M650 142 Q655 125 665 130 Q658 140 650 142 Z" fill="#059669" />
            <path d="M650 138 Q652 118 646 122 Q647 135 650 138 Z" fill="#34D399" />
          </g>

          {/* 4. DESK LAMP & WARM ILLUMINATION */}
          <g id="deskLamp">
            <rect x="570" y="468" width="48" height="8" rx="4" fill="#334155" stroke="#1E293B" />
            <line x1="594" y1="468" x2="615" y2="380" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            <circle cx="615" cy="380" r="5" fill="#F59E0B" />
            <line x1="615" y1="380" x2="570" y2="330" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
            <circle cx="570" cy="330" r="4.5" fill="#F59E0B" />
            <path
              d="M570 330 L535 348 L555 375 L585 345 Z"
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <circle
              cx="546"
              cy="362"
              r="6"
              fill={stage >= 3 && lampOn ? "#FEF08A" : "#475569"}
              className="cursor-pointer transition-colors duration-300"
              onClick={() => setLampOn(!lampOn)}
            />

            {stage >= 3 && lampOn && (
              <motion.polygon
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                points="546,362 250,560 680,560"
                fill="url(#lampCone)"
                style={{ mixBlendMode: "screen" }}
                pointerEvents="none"
              />
            )}
          </g>

          {/* 5. STUDY DESK & ERGONOMIC CHAIR */}
          <g id="furniture">
            <g transform="translate(245, 360)">
              <rect x="0" y="0" width="80" height="110" rx="16" fill="#0B1329" stroke="#1E293B" strokeWidth="2" />
              <line x1="12" y1="65" x2="68" y2="65" stroke="#2563EB" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
              <rect x="36" y="110" width="8" height="50" fill="#1E293B" />
            </g>

            <rect x="130" y="474" width="560" height="18" rx="4" fill="url(#deskGrad)" stroke="#334155" strokeWidth="1.5" />
            <rect x="130" y="492" width="560" height="8" rx="2" fill="#0B1120" />
            <rect x="160" y="500" width="14" height="160" fill="#1E293B" stroke="#0F172A" />
            <rect x="646" y="500" width="14" height="160" fill="#1E293B" stroke="#0F172A" />
            <line x1="174" y1="580" x2="646" y2="580" stroke="#0F172A" strokeWidth="4" />
          </g>

          {/* 6. DESK ACCESSORIES */}
          <g id="deskItems">
            {/* Steaming Coffee/Tea Mug */}
            <g transform="translate(210, 442)">
              <rect x="0" y="8" width="22" height="24" rx="4" fill="#1E293B" stroke="#334155" />
              <path d="M22 13 Q28 13 28 19 Q28 25 22 25" stroke="#334155" strokeWidth="2" fill="none" />
              <circle cx="11" cy="20" r="3" fill="#2563EB" />
              {stage >= 2 && (
                <motion.g
                  animate={{ y: [-2, -8, -12], opacity: [0, 0.7, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path d="M8 6 Q11 2 8 -2 Q5 -6 9 -10" stroke="#94A3B8" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
                  <path d="M14 6 Q17 2 14 -2 Q11 -6 15 -10" stroke="#94A3B8" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />
                </motion.g>
              )}
            </g>

            {/* Academic Notebook */}
            <motion.g
              transform="translate(260, 458)"
              animate={{
                scale: stage >= 2 ? 1 : 0.95,
                opacity: stage >= 1 ? 1 : 0.7,
              }}
              transition={{ duration: 0.6 }}
            >
              <rect x="0" y="0" width="76" height="18" rx="2" fill="#090E1A" stroke="#1E293B" />
              <rect x="2" y="2" width="35" height="13" rx="1" fill="#F8FAFC" opacity="0.9" />
              <rect x="39" y="2" width="35" height="13" rx="1" fill="#F1F5F9" opacity="0.85" />
              <line x1="37" y1="0" x2="37" y2="18" stroke="#2563EB" strokeWidth="1.5" />
              <path d="M37 18 L34 23 L37 21 L40 23 Z" fill="#2563EB" />
              <line x1="6" y1="5" x2="30" y2="5" stroke="#94A3B8" strokeWidth="0.8" opacity="0.6" />
              <line x1="6" y1="8" x2="26" y2="8" stroke="#94A3B8" strokeWidth="0.8" opacity="0.6" />
              <line x1="6" y1="11" x2="28" y2="11" stroke="#3B82F6" strokeWidth="0.8" opacity="0.8" />
              <rect x="80" y="6" width="32" height="3" rx="1.5" fill="#3B82F6" transform="rotate(-6 80 6)" />
            </motion.g>

            {/* Stacked Study Textbooks */}
            <g transform="translate(620, 436)">
              <rect x="0" y="26" width="55" height="12" rx="2" fill="#1D4ED8" stroke="#1E40AF" />
              <rect x="4" y="14" width="48" height="12" rx="2" fill="#6366F1" stroke="#4F46E5" />
              <rect x="7" y="2" width="42" height="12" rx="2" fill="#0EA5E9" stroke="#0284C7" />
            </g>
          </g>

          {/* 7. LAPTOP & GLOWING CODE INTERFACE */}
          <g id="laptop">
            {stage >= 2 && (
              <motion.circle
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.4, 0.6, 0.4],
                  scale: [0.98, 1.02, 0.98],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                cx="420"
                cy="440"
                r="150"
                fill="url(#screenGlow)"
                style={{ mixBlendMode: "screen" }}
                pointerEvents="none"
              />
            )}

            {/* Laptop Base */}
            <path
              d="M370 472 L470 472 L484 482 L356 482 Z"
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <polygon points="376,474 464,474 472,479 368,479" fill="#0F172A" />
            <rect x="408" y="479.5" width="24" height="2" rx="0.5" fill="#334155" />

            {/* Laptop Lid Opening with Framer Motion */}
            <motion.g
              initial={{ scaleY: 0.05 }}
              animate={{
                scaleY: stage >= 2 ? 1 : 0.05,
              }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "420px 472px" }}
            >
              <rect
                x="368"
                y="384"
                width="104"
                height="88"
                rx="4"
                fill="#0A0F1D"
                stroke="#38BDF8"
                strokeWidth={stage >= 2 ? "1.5" : "1"}
              />
              <rect x="372" y="388" width="96" height="80" rx="2" fill="#040814" />

              <circle cx="378" cy="393" r="1.5" fill="#EF4444" />
              <circle cx="383" cy="393" r="1.5" fill="#F59E0B" />
              <circle cx="388" cy="393" r="1.5" fill="#10B981" />
              <line x1="372" y1="397" x2="468" y2="397" stroke="#1E293B" strokeWidth="1" />

              {stage >= 2 && (
                <g>
                  <line x1="378" y1="404" x2="394" y2="404" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="398" y1="404" x2="424" y2="404" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

                  <line x1="384" y1="412" x2="404" y2="412" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
                  <line x1="408" y1="412" x2="438" y2="412" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

                  <rect x="384" y="420" width="70" height="4" rx="2" fill="#1E293B" />
                  <motion.rect
                    x="384"
                    y="420"
                    height="4"
                    rx="2"
                    fill="#3B82F6"
                    initial={{ width: 0 }}
                    animate={{ width: stage >= 3 ? 52 : 10 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  />

                  <line x1="384" y1="432" x2="418" y2="432" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
                  <line x1="384" y1="442" x2="402" y2="442" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
                  <motion.line
                    x1="406"
                    y1="439"
                    x2="406"
                    y2="445"
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <circle cx="458" cy="458" r="4" fill="#3B82F6" opacity="0.3" />
                </g>
              )}
            </motion.g>
          </g>

          {/* 8. STUDENT CHARACTER */}
          <motion.g
            id="student"
            initial={{ y: 15, opacity: 0.3 }}
            animate={{
              y: stage >= 1 ? (isFocusedOnInput ? -2 : 0) : 15,
              opacity: stage >= 1 ? 1 : 0.3,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <path
              d="M260 490 Q270 410 310 395 Q340 390 365 410 Q385 435 390 490 Z"
              fill="url(#hoodieGrad)"
              stroke="#1E3A8A"
              strokeWidth="1.5"
            />
            <path d="M305 440 L305 480 M330 440 L330 480" stroke="#1D4ED8" strokeWidth="1.5" opacity="0.4" />

            <path
              d="M275 435 Q290 460 315 470"
              stroke="#1D4ED8"
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M360 435 Q375 460 395 474"
              stroke="#1D4ED8"
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
            />

            <circle cx="318" cy="470" r="7" fill="#FBBF24" opacity="0.85" />
            <circle cx="395" cy="474" r="7" fill="#FBBF24" opacity="0.85" />
            <rect x="312" y="375" width="16" height="15" rx="3" fill="#F59E0B" opacity="0.9" />

            <motion.g
              animate={{
                y: [0, 1.5, 0],
                rotate: [0, 0.6, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "320px 360px" }}
            >
              <ellipse cx="320" cy="350" rx="20" ry="24" fill="#FBBF24" opacity="0.9" />

              <path
                d="M298 350 C296 325 310 320 325 320 C340 320 346 328 344 345 C335 338 322 340 310 348 Z"
                fill="#0F172A"
              />

              <g id="headphones">
                <path
                  d="M302 348 C302 328 312 322 322 322 C332 322 342 328 342 348"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect x="298" y="342" width="6" height="16" rx="3" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
                <rect x="338" y="342" width="6" height="16" rx="3" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
                <circle cx="342" cy="354" r="1" fill="#34D399" />
              </g>

              <ellipse cx="330" cy="352" rx="6" ry="5" stroke="#38BDF8" strokeWidth="1.2" fill="none" opacity="0.75" />
              <line x1="336" y1="352" x2="340" y2="350" stroke="#38BDF8" strokeWidth="1" opacity="0.75" />
            </motion.g>

            {stage >= 2 && (
              <motion.ellipse
                cx="332"
                cy="352"
                rx="14"
                ry="18"
                fill="#38BDF8"
                opacity={0.18}
                animate={{ opacity: [0.14, 0.22, 0.14] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                pointerEvents="none"
              />
            )}
          </motion.g>

          {/* 9. FLOATING LIGHT PARTICLES */}
          {stage >= 3 && lampOn && (
            <g id="particles" pointerEvents="none">
              {particles.map((p, i) => (
                <motion.circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={p.size}
                  fill="#FEF08A"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: [0, 0.75, 0],
                    y: [-10, -50],
                    x: [0, (i % 2 === 0 ? 8 : -8)],
                  }}
                  transition={{
                    duration: p.d,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Stage 4+ Motivational Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: stage >= 4 ? 1 : 0,
          y: stage >= 4 ? 0 : 12,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mt-2 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold tracking-wide shadow-sm shadow-blue-500/10">
          <span className="size-1.5 rounded-full bg-blue-400 animate-ping" />
          Study session ready
        </div>
      </motion.div>
    </div>
  );
}
