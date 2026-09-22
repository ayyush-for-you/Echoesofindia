"use client";

import { useState } from "react";
import { useGame } from "../../store/GameContext";
import { GAME_ARTIFACTS_MAP as GAME_ARTIFACTS_DATA } from "../../data/gameArtifacts";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function PuzzleOverlay() {
  const { puzzleActive, setPuzzleActive, addXp, completeChapter, incrementFragments } = useGame();
  
  const [solved, setSolved] = useState(false);
  const [rotations, setRotations] = useState([90, 180, 270]); // For seal puzzle
  const [fragmentsPlaced, setFragmentsPlaced] = useState([false, false, false]); // For manuscript

  const handleRotate = (index: number) => {
    if (solved) return;
    const newRotations = [...rotations];
    newRotations[index] = (newRotations[index] + 90) % 360;
    setRotations(newRotations);

    if (newRotations.every((r) => r === 0)) {
      handleSolve();
    }
  };

  const handlePlaceFragment = (index: number) => {
    if (solved) return;
    const newPlaced = [...fragmentsPlaced];
    newPlaced[index] = true;
    setFragmentsPlaced(newPlaced);

    if (newPlaced.every((p) => p)) {
      handleSolve();
    }
  };

  const handleSolve = () => {
    setSolved(true);
    setTimeout(() => {
      addXp(250);
      if (puzzleActive === "manuscript_final") {
         completeChapter();
      }
      setPuzzleActive(null);
    }, 3000);
  };

  if (!puzzleActive) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-neutral-900 border border-[#D4AF37]/50 rounded-lg p-8 relative shadow-2xl"
      >
        <button
          onClick={() => setPuzzleActive(null)}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif text-[#FDF5E6] mb-2">
            {puzzleActive === "seal"
              ? "RESTORE THE NALANDA SEAL"
              : "RESTORE THE PRAJÑĀPĀRAMITĀ"}
          </h2>
          <p className="text-gray-400 italic">
            {puzzleActive === "seal"
              ? "Align the rings of the Dharmachakra to authenticate the official seal of Nalanda Mahavihara."
              : "Arrange the three palm-leaf fragments to restore the Prajñāpāramitā Sūtra — the Perfection of Wisdom."}
          </p>
        </div>

        <div className="h-64 flex items-center justify-center mb-8">
          {puzzleActive === "seal" && (
            <div className="relative w-48 h-48">
              {rotations.map((rot, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: rot }}
                  onClick={() => handleRotate(i)}
                  className={`absolute inset-0 rounded-full border-4 cursor-pointer hover:border-[#D4AF37] transition-colors`}
                  style={{
                    borderColor: solved ? "#D4AF37" : "#8B4513",
                    margin: `${i * 1}rem`,
                    borderStyle: i % 2 === 0 ? "dashed" : "solid",
                  }}
                >
                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-[#D4AF37] rounded-full -translate-x-1/2 -translate-y-1/2" />
                </motion.div>
              ))}
            </div>
          )}

          {puzzleActive === "manuscript_final" && (
            <div className="flex gap-4">
              {fragmentsPlaced.map((placed, i) => (
                <div
                  key={i}
                  onClick={() => handlePlaceFragment(i)}
                  className={`w-24 h-32 border-2 cursor-pointer transition-all flex items-center justify-center ${
                    placed
                      ? "bg-[#D2B48C] border-[#8B4513] shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                      : "bg-white/5 border-dashed border-white/20 hover:border-[#D4AF37]/50 hover:bg-white/10"
                  }`}
                >
                  {placed ? (
                    <span className="text-[#8B4513] font-serif text-2xl">
                      {["१", "२", "३"][i]}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-sm">Place Fragment</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {solved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-4 p-4 bg-black/40 rounded-lg border border-[#D4AF37]/30"
          >
            <h3 className="text-[#D4AF37] font-bold tracking-widest text-xs font-mono uppercase mb-1">
              {puzzleActive === "manuscript_final" ? "MEMORY RESTORED" : "PUZZLE SOLVED"}
            </h3>
            <h4 className="text-[#FDF5E6] font-serif font-bold text-lg mb-2">
              {puzzleActive === "seal"
                ? (GAME_ARTIFACTS_DATA.seal?.manuscript.title || "Terracotta Monastic Seal of Nalanda")
                : (GAME_ARTIFACTS_DATA.manuscript_1?.manuscript.title
                    ? "Prajñāpāramitā Sūtra — Complete Folio Restoration"
                    : "Prajñāpāramitā Sūtra")}
            </h4>
            <p className="text-gray-300 text-xs sm:text-sm italic font-serif mb-3 max-w-lg mx-auto leading-relaxed">
              {puzzleActive === "manuscript_final"
                ? "The three fragments unite to reveal the complete teaching on Impermanence, Emptiness, and Compassion."
                : (GAME_ARTIFACTS_DATA.seal?.manuscript.translatedText
                    ? GAME_ARTIFACTS_DATA.seal.manuscript.translatedText.slice(0, 220) + "..."
                    : "Official Sanskrit Inscription: 'Śrī-Nālandā-Mahāvihārasya Ārya-Bhikṣu-Saṅghasya'. The official seal confirms scholarly authority and institutional integrity.")}
            </p>
            <p className="text-[#D4AF37] font-mono font-bold tracking-wider text-sm">+250 HERITAGE XP</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
