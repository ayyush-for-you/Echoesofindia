"use client";

import { useGame } from "../../store/GameContext";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function ArtifactViewer() {
  const { artifactViewActive, setArtifactViewActive, addXp, unlockArtifact, incrementFragments } = useGame();

  const handleCollect = () => {
    if (artifactViewActive) {
      unlockArtifact(artifactViewActive);
      addXp(100);
      if (artifactViewActive.startsWith("manuscript")) {
        incrementFragments();
      }
    }
    setArtifactViewActive(null);
  };

  if (!artifactViewActive) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl h-[80vh] flex flex-col md:flex-row bg-[#0a0a0a] border border-[#D4AF37]/50 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)]"
      >
        {/* Left Side: 3D or Image viewer (Placeholder for now) */}
        <div className="w-full md:w-1/2 bg-neutral-900 flex items-center justify-center relative p-8">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
          {artifactViewActive === "seal" ? (
            <div className="w-48 h-48 rounded-full bg-[#8B4513] border-4 border-[#A0522D] shadow-2xl flex items-center justify-center">
              <span className="text-white/50 font-serif">SEAL</span>
            </div>
          ) : (
            <div className="w-64 h-32 bg-[#D2B48C] rounded shadow-2xl flex items-center justify-center rotate-[-5deg]">
              <div className="w-full h-full border-b-2 border-dashed border-[#8B4513]/30 m-4"></div>
            </div>
          )}
        </div>

        {/* Right Side: Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col relative overflow-y-auto">
          <button
            onClick={() => setArtifactViewActive(null)}
            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <span className="text-[#D4AF37] tracking-widest text-sm font-bold mb-2">
            {artifactViewActive === "seal" ? "ARTIFACT" : "MANUSCRIPT"}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-[#FDF5E6] mb-8">
            {artifactViewActive === "seal"
              ? "TERRACOTTA SEAL"
              : "PALM-LEAF MANUSCRIPT"}
          </h2>

          <div className="bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] p-6 mb-8">
            <h3 className="text-[#D4AF37] font-bold tracking-widest text-sm mb-3">
              HISTORICAL ECHO
            </h3>
            <p className="text-gray-300 leading-relaxed italic">
              {artifactViewActive === "seal"
                ? "Seals were used for identification, administration and authentication, offering evidence of how societies recorded and organized information."
                : "Palm-leaf manuscripts were used across the Indian subcontinent to preserve literary, religious, scientific and philosophical knowledge."}
            </p>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-center mb-6 py-4 border-y border-white/10">
              <span className="text-gray-400 tracking-widest text-sm">REWARD</span>
              <span className="text-[#D4AF37] font-bold text-xl">+100 XP</span>
            </div>

            <button
              onClick={handleCollect}
              className="w-full py-4 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#FDF5E6] font-bold tracking-widest rounded transition-colors"
            >
              COLLECT ARTIFACT
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
