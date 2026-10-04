import React from "react";
import { motion } from "framer-motion";

interface DeskSceneLayersProps {
  /** If true, the desk exhibits completed notes and subtle progress marks */
  hasProgress?: boolean;
  /** Whether idle ambient lighting loops should be active */
  isIdleActive?: boolean;
  className?: string;
}

/**
 * Editorial, cinematic depth-layered study scene.
 * Focuses on DESK -> BOOK -> CONTENT.
 * The student is rendered as an understated, contemplative, backlit silhouette.
 * Palette: Deep charcoal, espresso, warm ivory, brass, and muted burgundy.
 */
export function DeskSceneLayers({
  hasProgress = false,
  isIdleActive = true,
  className = "",
}: DeskSceneLayersProps) {
  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{ transformOrigin: "50% 64%" }}
    >
      <svg
        viewBox="0 0 1000 750"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain max-h-[100vh]"
        aria-label="Cinematic study desk with an open leather-bound journal under a warm desk lamp"
        role="img"
      >
        <defs>
          {/* Subtle directional wall lighting */}
          <linearGradient id="wallGradient" x1="500" y1="0" x2="500" y2="520" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B0C0F" />
            <stop offset="50%" stopColor="#121318" />
            <stop offset="100%" stopColor="#090A0D" />
          </linearGradient>

          {/* Window Night Atmospheric Bokeh */}
          <linearGradient id="nightWindowGrad" x1="200" y1="60" x2="200" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06070A" />
            <stop offset="60%" stopColor="#0C0F17" />
            <stop offset="100%" stopColor="#141924" />
          </linearGradient>

          {/* Natural Warm Directional Lamp Light Cone */}
          <radialGradient id="warmLampBeam" cx="740" cy="270" r="520" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDF4DC" stopOpacity="0.45" />
            <stop offset="28%" stopColor="#F5E4BD" stopOpacity="0.24" />
            <stop offset="62%" stopColor="#722F37" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0A0B0E" stopOpacity="0" />
          </radialGradient>

          {/* Physical Lamp Shade Glow */}
          <radialGradient id="bulbAura" cx="718" cy="336" r="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7E6" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#FDE3A7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>

          {/* Walnut / Charcoal Matte Desk Surface */}
          <linearGradient id="deskWoodSurface" x1="100" y1="505" x2="900" y2="505" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#111216" />
            <stop offset="25%" stopColor="#1C1E24" />
            <stop offset="50%" stopColor="#22252C" />
            <stop offset="75%" stopColor="#1C1E24" />
            <stop offset="100%" stopColor="#111216" />
          </linearGradient>

          {/* Student Silhouette Gradient (Backlit from lamp) */}
          <linearGradient id="silhouetteGrad" x1="430" y1="340" x2="570" y2="520" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1C1D24" />
            <stop offset="70%" stopColor="#121317" />
            <stop offset="100%" stopColor="#090A0D" />
          </linearGradient>

          {/* Luxury Parchment Journal Spread */}
          <linearGradient id="journalParchment" x1="380" y1="450" x2="620" y2="525" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FAF7F0" />
            <stop offset="46%" stopColor="#F1EDE2" />
            <stop offset="50%" stopColor="#D8D2C4" />
            <stop offset="54%" stopColor="#F1EDE2" />
            <stop offset="100%" stopColor="#FAF7F0" />
          </linearGradient>

          {/* Window Arched Frame Clip */}
          <clipPath id="archWindowClip">
            <rect x="110" y="70" width="220" height="290" rx="110" />
          </clipPath>
        </defs>

        {/* ============================================================ */}
        {/* LAYER 1: ARCHITECTURAL DARK ROOM INTERIOR                    */}
        {/* ============================================================ */}
        <g id="layer-interior">
          {/* Wall Background with subtle architectural shadows */}
          <rect x="0" y="0" width="1000" height="750" fill="url(#wallGradient)" />

          {/* Subtle Vertical Slat Paneling (Low Contrast, Sophisticated) */}
          <g opacity="0.08" stroke="#FFFFFF" strokeWidth="1">
            <line x1="100" y1="0" x2="100" y2="505" />
            <line x1="220" y1="0" x2="220" y2="505" />
            <line x1="340" y1="0" x2="340" y2="505" />
            <line x1="680" y1="0" x2="680" y2="505" />
            <line x1="800" y1="0" x2="800" y2="505" />
            <line x1="920" y1="0" x2="920" y2="505" />
          </g>

          {/* Minimalist Academic Tall Window */}
          <g id="window">
            {/* Matte Dark Window Frame */}
            <rect x="104" y="64" width="232" height="302" rx="116" fill="#0E1015" stroke="#1F222B" strokeWidth="5" />

            {/* Night Sky View (Atmospheric & Calming, Not Cartoonish) */}
            <g clipPath="url(#archWindowClip)">
              <rect x="110" y="70" width="220" height="290" fill="url(#nightWindowGrad)" />

              {/* Distant Architectural Horizon Silhouette */}
              <path
                d="M110 320 L135 305 L150 308 L170 285 L180 270 L188 270 L198 285 L235 310 L270 295 L300 310 L330 325 L330 360 L110 360 Z"
                fill="#07080B"
                opacity="0.9"
              />

              {/* Distant Warm Campus Window Lights (Subtle, Muted) */}
              <rect x="140" y="312" width="3" height="4" fill="#E8C78A" opacity="0.4" />
              <rect x="148" y="312" width="3" height="4" fill="#E8C78A" opacity="0.3" />
              <rect x="250" y="314" width="4" height="4" fill="#E8C78A" opacity="0.35" />
              <rect x="282" y="318" width="3" height="3" fill="#E8C78A" opacity="0.4" />

              {/* Minimal Soft Atmospheric Star Points (Very subtle, photographic) */}
              {[
                { cx: 150, cy: 130, r: 1.0 },
                { cx: 185, cy: 110, r: 1.2 },
                { cx: 235, cy: 140, r: 0.9 },
                { cx: 275, cy: 165, r: 1.1 },
                { cx: 160, cy: 195, r: 0.8 },
                { cx: 220, cy: 185, r: 1.0 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.cx} cy={pt.cy} r={pt.r} fill="#F4EDE0" opacity="0.45" />
              ))}
            </g>

            {/* Window Mullions & Lintel */}
            <line x1="220" y1="70" x2="220" y2="360" stroke="#1F222B" strokeWidth="4" />
            <line x1="110" y1="210" x2="330" y2="210" stroke="#1F222B" strokeWidth="4" />
            <rect x="98" y="356" width="244" height="10" rx="3" fill="#1C1E26" stroke="#111216" />
          </g>

          {/* Floating Minimalist Oak/Charcoal Bookshelf */}
          <g id="minimal-shelf">
            <rect x="640" y="160" width="240" height="8" rx="2" fill="#1E2027" stroke="#2B2E37" strokeWidth="1" />
            <line x1="660" y1="168" x2="660" y2="182" stroke="#2B2E37" strokeWidth="2.5" />
            <line x1="860" y1="168" x2="860" y2="182" stroke="#2B2E37" strokeWidth="2.5" />

            {/* Sophisticated Clothbound Academic Books */}
            {/* Book 1 - Muted Deep Burgundy */}
            <rect x="664" y="112" width="15" height="48" rx="1" fill="#4A1E24" stroke="#722F37" strokeWidth="1" />
            <line x1="667" y1="120" x2="676" y2="120" stroke="#C5A880" strokeWidth="1" opacity="0.7" />

            {/* Book 2 - Warm Charcoal */}
            <rect x="681" y="104" width="18" height="56" rx="1" fill="#1A1C22" stroke="#2B2E37" strokeWidth="1" />
            <line x1="685" y1="114" x2="695" y2="114" stroke="#9E988D" strokeWidth="1" opacity="0.6" />

            {/* Book 3 - Muted Espresso */}
            <rect x="701" y="118" width="14" height="42" rx="1" fill="#28221D" stroke="#3D342C" strokeWidth="1" />

            {/* Leaning Book */}
            <g transform="translate(718, 122) rotate(14)">
              <rect x="0" y="0" width="14" height="42" rx="1" fill="#1C1F28" stroke="#2E3342" strokeWidth="1" />
            </g>

            {/* Minimal Brass Desk Clock */}
            <rect x="760" y="128" width="46" height="32" rx="4" fill="#0C0D11" stroke="#3A3225" strokeWidth="1.5" />
            <text x="783" y="149" fill="#C5A880" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600" textAnchor="middle">
              23:42
            </text>

            {/* Minimal Stoneware Planter */}
            <path d="M830 138 L848 138 L845 160 L833 160 Z" fill="#282A33" stroke="#383C48" strokeWidth="1" />
            <path d="M839 138 Q830 120 824 125 Q832 136 839 138 Z" fill="#3D503E" />
            <path d="M839 138 Q844 118 854 123 Q847 134 839 138 Z" fill="#2F3F30" />

            {/* Accomplishment Seal (Subtle embossed seal on shelf in progress loop) */}
            {hasProgress && (
              <motion.g
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                transform="translate(738, 134)"
              >
                <circle cx="10" cy="10" r="9" fill="#722F37" stroke="#C5A880" strokeWidth="1" />
                <path d="M7 10 L9 12 L13 8" stroke="#F4EDE0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.g>
            )}
          </g>
        </g>

        {/* ============================================================ */}
        {/* LAYER 2: CONTEMPLATIVE STUDENT SILHOUETTE                    */}
        {/* (Backlit, mature, natural posture, no cartoon facial traits)  */}
        {/* ============================================================ */}
        <g id="layer-student-silhouette">
          {/* Minimalist Modern Task Chair Backrest */}
          <g transform="translate(435, 335)">
            <rect x="0" y="0" width="100" height="135" rx="16" fill="#0E1015" stroke="#1D2029" strokeWidth="2" />
            <rect x="44" y="135" width="12" height="65" fill="#161820" />
          </g>

          {/* Backlit Silhouette of Student (Focused downward on journal) */}
          <path
            d="M415 510 Q430 405 475 390 Q515 385 550 410 Q575 440 580 510 Z"
            fill="url(#silhouetteGrad)"
            stroke="#1E2029"
            strokeWidth="1.5"
          />

          {/* Shoulders & Forearms extending naturally toward the journal */}
          <path
            d="M435 440 Q450 475 475 488"
            stroke="#171920"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M545 440 Q558 476 532 490"
            stroke="#171920"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />

          {/* Hands Resting on Journal Edge (Stylized, minimal, natural) */}
          <circle cx="475" cy="490" r="7" fill="#8C765C" opacity="0.8" />
          <circle cx="532" cy="492" r="7" fill="#8C765C" opacity="0.8" />
          {/* Subtle Brass Fountain Pen Resting Near Hand */}
          <line x1="528" y1="480" x2="548" y2="494" stroke="#C5A880" strokeWidth="2.5" strokeLinecap="round" />

          {/* Head & Neck (Backlit Silhouette, Inclined in deep concentration) */}
          <rect x="480" y="365" width="20" height="18" rx="4" fill="#14151C" />

          <motion.g
            animate={isIdleActive ? { y: [0, 1.2, 0] } : { y: 0 }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "490px 345px" }}
          >
            {/* Backlit Head Silhouette */}
            <ellipse cx="490" cy="336" rx="24" ry="28" fill="#101117" />
            <path
              d="M465 336 C463 306 480 298 498 298 C516 298 522 308 520 330 C510 322 492 324 478 334 Z"
              fill="#08080C"
            />
            {/* Sleek Matte Headphones (Minimalist profile) */}
            <path
              d="M470 334 C470 310 482 302 494 302 C506 302 516 310 516 334"
              stroke="#2B2F3D"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <rect x="466" y="328" width="6" height="18" rx="3" fill="#181A22" stroke="#2B2F3D" strokeWidth="1" />
            <rect x="512" y="328" width="6" height="18" rx="3" fill="#181A22" stroke="#2B2F3D" strokeWidth="1" />
          </motion.g>

          {/* Warm Rim Light on Student's Shoulder from Desk Lamp */}
          <path
            d="M518 405 Q545 435 556 485"
            stroke="#FDE4BD"
            strokeWidth="2.5"
            opacity="0.32"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* ============================================================ */}
        {/* LAYER 3: LUXURY DESK SURFACE & MINIMALIST COMPOSITION        */}
        {/* ============================================================ */}
        <g id="layer-desk-surface">
          {/* Main Espresso / Dark Slate Desk Surface */}
          <rect x="80" y="502" width="840" height="26" rx="4" fill="url(#deskWoodSurface)" stroke="#2D303C" strokeWidth="1.5" />
          {/* Chamfered Edge Line with Subtle Wood Highlight */}
          <line x1="82" y1="503" x2="918" y2="503" stroke="#484C5C" strokeWidth="1.2" opacity="0.6" />
          {/* Front Desk Skirt */}
          <rect x="80" y="528" width="840" height="12" rx="1" fill="#0A0B0E" />
          {/* Minimalist Solid Desk Supports */}
          <rect x="130" y="540" width="16" height="210" fill="#181A22" stroke="#0E1015" />
          <rect x="854" y="540" width="16" height="210" fill="#181A22" stroke="#0E1015" />
          <line x1="146" y1="640" x2="854" y2="640" stroke="#0E1015" strokeWidth="5" />

          {/* Minimalist Matte Black Ceramic Espresso Cup (Left Side) */}
          <g transform="translate(200, 464)" id="espresso-cup">
            <rect x="0" y="8" width="24" height="26" rx="4" fill="#14151C" stroke="#2B2E3C" strokeWidth="1.5" />
            <path d="M24 14 Q31 14 31 20 Q31 26 24 26" stroke="#2B2E3C" strokeWidth="2" fill="none" />
            {/* Subtle steam loop */}
            {isIdleActive && (
              <motion.g
                animate={{ y: [-2, -8, -14], opacity: [0, 0.45, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M9 6 Q12 1 9 -4 Q6 -9 11 -14" stroke="#A8A398" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.4" />
              </motion.g>
            )}
          </g>

          {/* Closed Sleek Laptop / Second Screen in Background (Left-Center) */}
          <g transform="translate(254, 452)" id="closed-laptop">
            <rect x="0" y="36" width="94" height="8" rx="2" fill="#161820" stroke="#282B37" strokeWidth="1.2" />
            <line x1="4" y1="36" x2="90" y2="36" stroke="#3D4152" strokeWidth="1" />
          </g>

          {/* Architectural Brass / Matte Black Desk Lamp (Right Side) */}
          <g id="architect-lamp">
            <rect x="740" y="492" width="52" height="10" rx="4" fill="#222530" stroke="#14151C" strokeWidth="1.5" />
            <line x1="766" y1="492" x2="784" y2="385" stroke="#383C4B" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="784" cy="385" r="5" fill="#C5A880" />
            <line x1="784" y1="385" x2="728" y2="328" stroke="#383C4B" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="728" cy="328" r="4.5" fill="#C5A880" />

            {/* Lamp Shade (Matte Charcoal with Brass Accents) */}
            <path d="M728 328 L682 348 L704 380 L746 348 Z" fill="#171920" stroke="#2B2F3D" strokeWidth="1.5" />

            {/* Bulb Glow */}
            <circle cx="694" cy="365" r="8" fill="url(#bulbAura)" />

            {/* Warm Directional Light Cone illuminating desk & open journal */}
            <polygon
              points="694,365 260,590 840,590"
              fill="url(#warmLampBeam)"
              style={{ mixBlendMode: "screen" }}
              pointerEvents="none"
            />
          </g>
        </g>

        {/* ============================================================ */}
        {/* LAYER 4: THE FOCAL OPEN PHYSICAL JOURNAL (TRANSFORM ORIGIN)  */}
        {/* Center: x: 500 (50%), y: 480 (64% of viewport height)       */}
        {/* ============================================================ */}
        <g id="layer-open-book-pivot" transform="translate(370, 442)">
          {/* Subtle natural paper drop shadow */}
          <rect x="-6" y="8" width="272" height="74" rx="6" fill="#000000" opacity="0.6" filter="blur(7px)" />

          {/* Heavy Bound Hardcover (Deep Espresso Linen) */}
          <rect x="0" y="2" width="260" height="70" rx="4" fill="#14161C" stroke="#2D313E" strokeWidth="1.5" />

          {/* Genuine Ivory/Parchment Open Spread (Realistic gentle curvature) */}
          <path
            d="M6 6 Q65 13 130 8 Q195 13 254 6 L254 64 Q195 71 130 66 Q65 71 6 64 Z"
            fill="url(#journalParchment)"
            stroke="#C9C2B2"
            strokeWidth="1.2"
          />

          {/* Central Gutter / Spine Depth Line */}
          <line x1="130" y1="8" x2="130" y2="66" stroke="#9A9281" strokeWidth="1.8" opacity="0.8" />

          {/* Deep Academic Burgundy Ribbon Bookmark */}
          <path d="M130 8 L130 74 L125 80 L130 77 L135 80 L130 74" stroke="#722F37" strokeWidth="2.2" fill="#722F37" />

          {/* Left Page Elegant Editorial Ink Ruling */}
          <g id="left-page-editorial-ink" opacity="0.85">
            <text x="20" y="20" fill="#2C2E38" fontSize="6.5" fontFamily="Cormorant Garamond, serif" fontWeight="700">
              PLAN YOUR WEEK
            </text>
            <line x1="20" y1="23" x2="114" y2="23" stroke="#722F37" strokeWidth="0.8" />

            <text x="20" y="32" fill="#3D404C" fontSize="5" fontFamily="Manrope, sans-serif" fontWeight="600">
              MON &middot; Algorithms & Systems
            </text>
            <line x1="20" y1="34" x2="108" y2="34" stroke="#D3CBC0" strokeWidth="0.8" />

            <text x="20" y="42" fill="#3D404C" fontSize="5" fontFamily="Manrope, sans-serif" fontWeight="600">
              TUE &middot; Linear Algebra
            </text>
            <line x1="20" y1="44" x2="104" y2="44" stroke="#D3CBC0" strokeWidth="0.8" />

            <text x="20" y="52" fill="#3D404C" fontSize="5" fontFamily="Manrope, sans-serif" fontWeight="600">
              WED &middot; Operating Systems
            </text>
            <line x1="20" y1="54" x2="110" y2="54" stroke="#D3CBC0" strokeWidth="0.8" />

            {hasProgress && (
              <text x="20" y="62" fill="#722F37" fontSize="5.5" fontFamily="Manrope, sans-serif" fontWeight="700">
                ✓ 23 CONSECUTIVE DAYS COMPLETED
              </text>
            )}
          </g>

          {/* Right Page Editorial Habit / Metric Layout */}
          <g id="right-page-editorial-ink" opacity="0.85">
            <text x="146" y="20" fill="#2C2E38" fontSize="6.5" fontFamily="Cormorant Garamond, serif" fontWeight="700">
              DAILY PROGRESS
            </text>
            <line x1="146" y1="23" x2="240" y2="23" stroke="#722F37" strokeWidth="0.8" />

            {/* Restrained Monochrome Checkmarks */}
            <circle cx="152" cy="32" r="2.8" stroke="#722F37" strokeWidth="0.9" fill={hasProgress ? "#722F37" : "none"} />
            <line x1="158" y1="32" x2="230" y2="32" stroke="#4B4E5A" strokeWidth="0.9" />

            <circle cx="152" cy="42" r="2.8" stroke="#722F37" strokeWidth="0.9" fill={hasProgress ? "#722F37" : "none"} />
            <line x1="158" y1="42" x2="225" y2="42" stroke="#4B4E5A" strokeWidth="0.9" />

            <circle cx="152" cy="52" r="2.8" stroke="#722F37" strokeWidth="0.9" fill={hasProgress ? "#722F37" : "none"} />
            <line x1="158" y1="52" x2="232" y2="52" stroke="#4B4E5A" strokeWidth="0.9" />
          </g>
        </g>

        {/* ============================================================ */}
        {/* LAYER 5: PHYSICAL LIGHTING GRADIENT VIGNETTE                 */}
        {/* ============================================================ */}
        <g id="layer-vignette" pointerEvents="none">
          <rect x="0" y="0" width="1000" height="750" fill="url(#warmLampBeam)" opacity="0.10" />
        </g>
      </svg>
    </div>
  );
}
