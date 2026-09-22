"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NARRATIVE = [
  {
    tag: "640 CE",
    text: "The great Nalanda rises as the world's first university — nine million manuscripts, a thousand years of wisdom.",
  },
  {
    tag: null,
    text: "Then came Bakhtiyar Khilji and his soldiers.",
    accent: true,
  },
  {
    tag: null,
    text: "They set fire to the greatest library the world had ever known. The flames burned for three months.",
  },
  {
    tag: null,
    text: "Three fragments of the Prajnaparamita Sutra survived the inferno.",
    accent: true,
  },
  {
    tag: "YOUR MISSION",
    text: "Enter the burning halls. Recover the fragments before the fire swallows everything.",
    final: true,
  },
];

// Deterministic ember positions (avoid hydration mismatch)
const EMBER_CONFIG = Array.from({ length: 28 }, (_, i) => ({
  left: `${((i * 37 + 11) % 97)}%`,
  delay: `${((i * 0.31 + 0.1) % 3).toFixed(2)}s`,
  duration: `${(2.5 + (i % 5) * 0.4).toFixed(1)}s`,
  size: `${3 + (i % 3)}px`,
}));

export default function IntroCinematic({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(-1); // -1 = black start
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await delay(800);
      for (let i = 0; i < NARRATIVE.length; i++) {
        if (cancelled) return;
        setStep(i);
        await delay(i === NARRATIVE.length - 1 ? 5000 : 3800);
      }
      if (!cancelled) {
        setExiting(true);
        await delay(1200);
        if (!cancelled) onComplete();
      }
    };
    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkip = useCallback(() => {
    setExiting(true);
    setTimeout(onComplete, 800);
  }, [onComplete]);

  // Also handle Space key to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") handleSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSkip]);

  const current = step >= 0 ? NARRATIVE[step] : null;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center flex-col text-center px-4 overflow-hidden"
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 1.0 }}
      style={{ background: "#000" }}
    >
      {/* ── FIRE GRADIENT BACKGROUND ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(139,30,0,0.55) 0%, rgba(80,15,0,0.3) 40%, transparent 70%)",
          animation: "fireGlow 3s ease-in-out infinite alternate",
        }}
      />
      {/* Edge vignette with fire tones */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(60,10,0,0.5) 100%)",
        }}
      />

      {/* ── RISING EMBERS ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {EMBER_CONFIG.map((e, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: e.left,
              bottom: "-8px",
              width: e.size,
              height: e.size,
              background: i % 3 === 0 ? "#FF6B1A" : i % 3 === 1 ? "#FFD700" : "#FF4500",
              boxShadow: `0 0 4px ${i % 2 === 0 ? "#FF6B1A" : "#FF4500"}`,
              animation: `emberRise ${e.duration} ease-out ${e.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ── HORIZONTAL SMOKE LINE AT BOTTOM ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(20,8,0,0.9), transparent)",
        }}
      />

      {/* ── NARRATIVE TEXT ── */}
      <div className="relative z-10 max-w-3xl w-full">
        <AnimatePresence mode="wait">
          {current && (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="flex flex-col items-center gap-4"
            >
              {/* Year / tag badge */}
              {current.tag && (
                <motion.span
                  initial={{ opacity: 0, letterSpacing: "0.6em" }}
                  animate={{ opacity: 1, letterSpacing: "0.3em" }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-sm font-mono font-bold tracking-[0.3em] uppercase"
                  style={{ color: "#d97706" }}
                >
                  {current.tag}
                </motion.span>
              )}

              {/* Chapter divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="h-px w-24"
                style={{
                  background:
                    "linear-gradient(to right, transparent, #d97706, transparent)",
                }}
              />

              {/* Main text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-2xl md:text-4xl font-light leading-relaxed"
                style={{
                  color: current.final
                    ? "#fbbf24"
                    : current.accent
                    ? "#fca5a5"
                    : "#fef3c7",
                  textShadow: current.final
                    ? "0 0 30px rgba(251,191,36,0.4), 0 0 60px rgba(251,146,60,0.2)"
                    : current.accent
                    ? "0 0 20px rgba(252,165,165,0.3)"
                    : "none",
                  fontFamily: "Georgia, serif",
                }}
              >
                {current.final ? (
                  <span>
                    <span style={{ color: "#d97706", fontWeight: 600 }}>Enter the burning halls.</span>
                    <br />
                    Recover the fragments before the fire swallows everything.
                  </span>
                ) : (
                  `"${current.text}"`
                )}
              </motion.p>

              {/* Final CTA pulse */}
              {current.final && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0, 1, 0.7, 1], scale: 1 }}
                  transition={{ delay: 1.2, duration: 1.5 }}
                  className="mt-4 px-8 py-3 border rounded-sm text-sm font-bold tracking-widest"
                  style={{
                    borderColor: "rgba(217,119,6,0.4)",
                    color: "#d97706",
                    background: "rgba(217,119,6,0.08)",
                  }}
                >
                  CHAPTER I — THE LOST MANUSCRIPT
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CHAPTER PROGRESS DOTS ── */}
      <div className="absolute bottom-20 flex gap-2">
        {NARRATIVE.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === step ? "20px" : "6px",
              height: "6px",
              background:
                i === step
                  ? "#d97706"
                  : i < step
                  ? "rgba(217,119,6,0.35)"
                  : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>

      {/* ── SKIP BUTTON ── */}
      <button
        onClick={handleSkip}
        className="absolute bottom-8 right-8 text-xs tracking-widest transition-colors"
        style={{ color: "rgba(107,114,128,0.6)" }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(217,119,6,0.8)")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(107,114,128,0.6)")}
      >
        [SPACE] SKIP ›
      </button>
    </motion.div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
