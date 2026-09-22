"use client";

import { useGame } from "../../store/GameContext";
import { Book, Compass, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function GameHUD() {
  const { xp, currentObjective, fragmentsFound, setCodexActive } = useGame();
  const [showSoundHint, setShowSoundHint] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Fade out sound hint after 4s
  useEffect(() => {
    const t = setTimeout(() => setShowSoundHint(false), 4500);
    return () => clearTimeout(t);
  }, []);

  // Fade out controls after 8s
  useEffect(() => {
    const t = setTimeout(() => setShowControls(false), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="w-full h-full pointer-events-none flex flex-col justify-between">

      {/* ── FIRE VIGNETTE OVERLAY ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(90, 15, 0, 0.32) 100%)",
        }}
      />
      {/* Edge ember glow — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(to top, rgba(100, 20, 0, 0.22), transparent)",
        }}
      />

      {/* ── TOP HUD ── */}
      <div className="relative z-10 flex justify-between items-start p-6 md:p-8">

        {/* Objective panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-panel p-4 max-w-xs pointer-events-auto"
          style={{ borderColor: "rgba(217, 119, 6, 0.3)" }}
        >
          <h3
            className="font-bold tracking-widest text-xs mb-2 pb-2"
            style={{
              color: "#d97706",
              borderBottom: "1px solid rgba(217,119,6,0.25)",
              letterSpacing: "0.2em",
            }}
          >
            ◆ THE LOST MANUSCRIPT
          </h3>
          <div className="flex items-start gap-3 mt-2">
            <Compass
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: "#9ca3af" }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: "#fef3c7" }}>
                {currentObjective}
              </p>
              {currentObjective.includes("fragments") && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-5 h-2 rounded-full transition-all duration-500"
                        style={{
                          background:
                            i < fragmentsFound
                              ? "#d97706"
                              : "rgba(255,255,255,0.12)",
                          boxShadow:
                            i < fragmentsFound
                              ? "0 0 6px rgba(217,119,6,0.6)"
                              : "none",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "#d97706" }}
                  >
                    {fragmentsFound} / 3
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* XP + Codex */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-end gap-3 pointer-events-auto"
        >
          {/* XP display */}
          <div
            className="glass-panel px-5 py-2.5 flex items-center gap-3"
            style={{ borderColor: "rgba(217,119,6,0.25)" }}
          >
            <Zap className="w-4 h-4" style={{ color: "#d97706" }} />
            <span
              className="text-xs tracking-widest"
              style={{ color: "#6b7280" }}
            >
              HERITAGE XP
            </span>
            <span
              className="font-bold text-lg"
              style={{
                color: "#fbbf24",
                textShadow: "0 0 10px rgba(251,191,36,0.6)",
              }}
            >
              {xp}
            </span>
          </div>

          {/* Codex button */}
          <button
            onClick={() => setCodexActive(true)}
            className="glass-panel px-4 py-2.5 flex items-center gap-2.5 group cursor-pointer transition-all duration-200"
            style={{ borderColor: "rgba(212,175,55,0.2)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.5)";
              (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.2)";
              (e.currentTarget as HTMLElement).style.background = "";
            }}
          >
            <Book className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold tracking-widest text-gray-300 group-hover:text-white transition-colors">
              [TAB] CODEX
            </span>
          </button>
        </motion.div>
      </div>

      {/* ── BOTTOM HUD ── */}
      <div className="relative z-10 flex flex-col items-center gap-3 pb-6 md:pb-8">

        {/* Ambient sound hint (fades after 4.5s) */}
        <AnimatePresence>
          {showSoundHint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 text-xs tracking-widest"
              style={{ color: "rgba(217,119,6,0.6)" }}
            >
              <span>🔊</span>
              <span>AMBIENT SOUND RECOMMENDED FOR FULL EXPERIENCE</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-3"
              style={{
                background: "rgba(8, 4, 0, 0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,107,26,0.12)",
                borderRadius: "9999px",
                padding: "10px 24px",
              }}
            >
              {[
                { key: "WASD", label: "MOVE" },
                { key: "MOUSE", label: "LOOK" },
                { key: "SHIFT", label: "SPRINT" },
                { key: "E", label: "INTERACT" },
                { key: "ESC", label: "UNLOCK" },
              ].map((item, i, arr) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span
                    className="font-mono text-xs rounded px-2 py-0.5"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  >
                    {item.key}
                  </span>
                  <span
                    className="text-xs tracking-widest"
                    style={{ color: "#9ca3af" }}
                  >
                    {item.label}
                  </span>
                  {i < arr.length - 1 && (
                    <div
                      className="w-px h-3 ml-1"
                      style={{ background: "rgba(255,255,255,0.12)" }}
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
