"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../../store/GameContext";
import { Flame, ChevronRight, X } from "lucide-react";

export default function DialoguePanel() {
  const {
    dialogueOpen,
    dialogueSpeaker,
    dialogueLines,
    dialogueLineIndex,
    advanceDialogue,
    closeDialogue,
  } = useGame();

  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const currentLine = dialogueLines[dialogueLineIndex] ?? "";
  const totalLines = dialogueLines.length;
  const isLastLine = dialogueLineIndex >= totalLines - 1;
  const progress = totalLines > 0 ? ((dialogueLineIndex + 1) / totalLines) * 100 : 0;

  // Reset typewriter when line changes or dialogue opens
  useEffect(() => {
    if (!dialogueOpen) {
      setDisplayedText("");
      setCharIndex(0);
      setIsTyping(false);
      return;
    }
    setDisplayedText("");
    setCharIndex(0);
    setIsTyping(true);
  }, [dialogueOpen, dialogueLineIndex]);

  // Typewriter tick
  useEffect(() => {
    if (!isTyping) return;
    if (charIndex >= currentLine.length) {
      setIsTyping(false);
      return;
    }
    const timeout = setTimeout(() => {
      setDisplayedText(currentLine.slice(0, charIndex + 1));
      setCharIndex((prev) => prev + 1);
    }, 26);
    return () => clearTimeout(timeout);
  }, [isTyping, charIndex, currentLine]);

  const handleAdvance = useCallback(() => {
    if (isTyping) {
      // Skip to end of current line instantly
      setDisplayedText(currentLine);
      setCharIndex(currentLine.length);
      setIsTyping(false);
      return;
    }
    advanceDialogue();
  }, [isTyping, currentLine, advanceDialogue]);

  // Keyboard bindings
  useEffect(() => {
    if (!dialogueOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE" || e.code === "Space") {
        e.preventDefault();
        handleAdvance();
      }
      if (e.code === "Escape") {
        closeDialogue();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogueOpen, handleAdvance, closeDialogue]);

  return (
    <AnimatePresence>
      {dialogueOpen && (
        <motion.div
          key="dialogue-panel"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute bottom-0 left-0 right-0 z-50 pointer-events-auto"
        >
          {/* Progress bar */}
          <div className="h-[2px] bg-white/10 w-full">
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(to right, #7f1d1d, #d97706)" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Main panel */}
          <div
            className="relative border-t"
            style={{
              background: "rgba(8, 4, 0, 0.92)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(180, 83, 9, 0.4)",
            }}
          >
            {/* Ambient fire glow at top edge */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: "linear-gradient(to right, transparent, rgba(251,146,60,0.6), transparent)",
              }}
            />

            {/* Close button */}
            <button
              onClick={closeDialogue}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 transition-colors z-10"
              aria-label="Skip dialogue"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="max-w-5xl mx-auto px-6 py-6 md:px-10 md:py-8">
              <div className="flex gap-5 md:gap-8 items-start">
                {/* Portrait */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2"
                    style={{
                      background: "radial-gradient(circle at 40% 40%, #7c2d12, #1c0900)",
                      borderColor: "rgba(217,119,6,0.5)",
                      boxShadow: "0 0 20px rgba(251,146,60,0.25), inset 0 0 12px rgba(0,0,0,0.5)",
                    }}
                  >
                    <Flame className="w-7 h-7 md:w-8 md:h-8 text-amber-400" style={{ filter: "drop-shadow(0 0 6px #f97316)" }} />
                  </div>
                  <span
                    className="text-xs font-bold tracking-widest text-center"
                    style={{ color: "#d97706", fontSize: "0.6rem", maxWidth: "70px" }}
                  >
                    {dialogueSpeaker}
                  </span>
                </div>

                {/* Text area */}
                <div className="flex-1 min-h-[90px] flex flex-col justify-between">
                  {/* Dialogue text */}
                  <p
                    className="text-lg md:text-xl leading-relaxed font-light"
                    style={{ color: "#fef3c7" }}
                  >
                    {displayedText}
                    {isTyping && (
                      <span
                        className="inline-block w-[2px] h-5 ml-1 align-middle animate-pulse"
                        style={{ background: "#f59e0b" }}
                      />
                    )}
                  </p>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between mt-5 pt-3 border-t"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                  >
                    {/* Line counter */}
                    <div className="flex items-center gap-3">
                      {Array.from({ length: totalLines }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: i === dialogueLineIndex ? "20px" : "6px",
                            height: "6px",
                            background: i === dialogueLineIndex
                              ? "#d97706"
                              : i < dialogueLineIndex
                              ? "rgba(217,119,6,0.4)"
                              : "rgba(255,255,255,0.15)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Advance button */}
                    <button
                      onClick={handleAdvance}
                      className="flex items-center gap-2 font-semibold tracking-widest text-sm transition-all duration-200 hover:gap-3"
                      style={{ color: isTyping ? "#6b7280" : "#f59e0b" }}
                    >
                      {isTyping ? (
                        "READING..."
                      ) : isLastLine ? (
                        <>CLOSE <ChevronRight className="w-4 h-4" /></>
                      ) : (
                        <>CONTINUE <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Key hints */}
              <div className="mt-3 flex gap-4" style={{ color: "rgba(107,114,128,0.7)", fontSize: "0.65rem" }}>
                <span>
                  <kbd
                    className="rounded px-1 py-0.5 mr-1"
                    style={{ background: "rgba(255,255,255,0.08)", fontFamily: "monospace" }}
                  >
                    E
                  </kbd>
                  CONTINUE
                </span>
                <span>
                  <kbd
                    className="rounded px-1 py-0.5 mr-1"
                    style={{ background: "rgba(255,255,255,0.08)", fontFamily: "monospace" }}
                  >
                    ESC
                  </kbd>
                  SKIP
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
