"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../../store/GameContext";

interface StoryBeat {
  id: string;
  bg: string;
  bgOpacity: number;
  overlay?: string;
  text: string;
  subtext?: string;
  tag?: string;
  textColor: string;
  textShadow: string;
  duration: number;
  transition: "fade" | "flash" | "slowZoom";
  showEmbers?: boolean;
}

const STORY_BEATS: StoryBeat[] = [
  // Beat 0: Book opens — portal erupts
  {
    id: "portal",
    bg: "url('/story-portal.jpg')",
    bgOpacity: 1,
    overlay:
      "radial-gradient(ellipse at 50% 50%, rgba(255,200,50,0.25) 0%, rgba(0,0,0,0.4) 70%)",
    text: "You open the text...",
    subtext: "",
    textColor: "#fbbf24",
    textShadow:
      "0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(255,107,26,0.4)",
    duration: 3000,
    transition: "fade",
  },
  // Beat 1: WHITE FLASH — time travel
  {
    id: "flash",
    bg: "linear-gradient(to bottom, #fffbe6, #fbbf24)",
    bgOpacity: 1,
    text: "Light consumes everything.",
    textColor: "#78350f",
    textShadow: "none",
    duration: 1500,
    transition: "flash",
  },
  // Beat 2: Nalanda burning — arrival
  {
    id: "nalanda",
    bg: "url('/story-nalanda.jpg')",
    bgOpacity: 1,
    overlay:
      "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(60,10,0,0.4) 50%, rgba(0,0,0,0.6) 100%)",
    tag: "NALANDA · 1193 CE",
    text: "You stand in the burning corridors of the world's oldest university.",
    subtext:
      "Bakhtiyar Khilji's soldiers have set fire to nine million manuscripts.",
    textColor: "#fca5a5",
    textShadow: "0 0 20px rgba(239,68,68,0.5)",
    duration: 4500,
    transition: "slowZoom",
    showEmbers: true,
  },
  // Beat 3: Mission
  {
    id: "mission",
    bg: "url('/story-nalanda.jpg')",
    bgOpacity: 0.4,
    overlay:
      "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)",
    tag: "YOUR MISSION",
    text: "Three fragments of the Prajnaparamita Sutra survived the inferno.",
    subtext: "Find them before the flames consume everything.",
    textColor: "#fbbf24",
    textShadow:
      "0 0 30px rgba(251,191,36,0.5), 0 0 60px rgba(255,107,26,0.2)",
    duration: 4500,
    transition: "fade",
    showEmbers: true,
  },
  // Beat 4: Chapter card
  {
    id: "chapter",
    bg: "linear-gradient(to bottom, #0a0500, #000)",
    bgOpacity: 1,
    overlay:
      "radial-gradient(ellipse at center, rgba(217,119,6,0.08) 0%, transparent 60%)",
    tag: "CHAPTER I",
    text: "THE LOST MANUSCRIPT",
    textColor: "#FDF5E6",
    textShadow: "0 0 30px rgba(212,175,55,0.4)",
    duration: 3500,
    transition: "fade",
    showEmbers: true,
  },
];

const EMBERS = Array.from({ length: 32 }, (_, i) => ({
  left: `${((i * 37 + 11) % 97)}%`,
  delay: `${((i * 0.29 + 0.05) % 2.8).toFixed(2)}s`,
  duration: `${(2.2 + (i % 5) * 0.35).toFixed(1)}s`,
  size: `${2 + (i % 4)}px`,
}));

export default function PortalCinematic() {
  const { setLevel } = useGame();
  const [beatIndex, setBeatIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  const currentBeat = STORY_BEATS[beatIndex];
  const isLast = beatIndex >= STORY_BEATS.length - 1;

  const handleComplete = useCallback(() => {
    setLevel("nalanda");
  }, [setLevel]);

  useEffect(() => {
    if (exiting) return;
    const timer = setTimeout(() => {
      if (isLast) {
        setExiting(true);
        setTimeout(handleComplete, 1000);
      } else {
        setBeatIndex((prev) => prev + 1);
      }
    }, currentBeat.duration);
    return () => clearTimeout(timer);
  }, [beatIndex, exiting, isLast, currentBeat.duration, handleComplete]);

  const handleSkip = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(handleComplete, 600);
  }, [handleComplete, exiting]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSkip]);

  return (
    <motion.div
      className="absolute inset-0 z-50 overflow-hidden"
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.8 }}
      style={{ background: "#000" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBeat.id}
          className="absolute inset-0"
          initial={{
            opacity: 0,
            scale: currentBeat.transition === "slowZoom" ? 1.0 : 1,
          }}
          animate={{
            opacity: currentBeat.bgOpacity,
            scale: currentBeat.transition === "slowZoom" ? 1.08 : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: currentBeat.transition === "flash" ? 0.15 : 0.8 },
            scale: { duration: currentBeat.duration / 1000 + 0.5, ease: "linear" },
          }}
          style={{
            backgroundImage: currentBeat.bg.startsWith("url") ? currentBeat.bg : undefined,
            background: !currentBeat.bg.startsWith("url") ? currentBeat.bg : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {currentBeat.overlay && (
            <div className="absolute inset-0" style={{ background: currentBeat.overlay }} />
          )}
        </motion.div>
      </AnimatePresence>

      {currentBeat.showEmbers && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {EMBERS.map((e, i) => (
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
      )}

      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBeat.id + "-text"}
            className="flex flex-col items-center text-center px-6 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: currentBeat.transition === "flash" ? 0.1 : 0.7, ease: "easeOut" }}
          >
            {currentBeat.tag && (
              <motion.span
                initial={{ opacity: 0, letterSpacing: "0.5em" }}
                animate={{ opacity: 1, letterSpacing: "0.25em" }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="text-xs font-mono font-bold tracking-[0.25em] uppercase mb-4"
                style={{ color: "#d97706" }}
              >
                {currentBeat.tag}
              </motion.span>
            )}

            {currentBeat.tag && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="h-px w-20 mb-6"
                style={{ background: "linear-gradient(to right, transparent, #d97706, transparent)" }}
              />
            )}

            {currentBeat.text && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.7 }}
                className={`leading-relaxed font-light ${
                  currentBeat.id === "chapter" ? "text-4xl md:text-6xl font-bold tracking-[0.15em]" : "text-xl md:text-3xl"
                }`}
                style={{
                  color: currentBeat.textColor,
                  textShadow: currentBeat.textShadow,
                  fontFamily: currentBeat.id === "chapter" ? "var(--font-sans)" : "Georgia, serif",
                }}
              >
                {currentBeat.text}
              </motion.p>
            )}

            {currentBeat.subtext && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-base md:text-lg mt-4 font-light"
                style={{ color: "rgba(209,213,219,0.7)", fontFamily: "Georgia, serif" }}
              >
                {currentBeat.subtext}
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
        {STORY_BEATS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i === beatIndex ? "18px" : "5px",
              height: "5px",
              background: i === beatIndex ? "#d97706" : i < beatIndex ? "rgba(217,119,6,0.3)" : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      <button
        onClick={handleSkip}
        className="absolute bottom-6 right-8 text-xs tracking-widest transition-colors z-30 pointer-events-auto"
        style={{ color: "rgba(107,114,128,0.5)" }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "rgba(217,119,6,0.7)")}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(107,114,128,0.5)")}
      >
        [SPACE] SKIP ›
      </button>
    </motion.div>
  );
}
