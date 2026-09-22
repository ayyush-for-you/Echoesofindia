"use client";

import { useGame } from "../../store/GameContext";
import { useVault } from "../../store/VaultContext";
import { syncGameArtifactToVault } from "../../lib/gameVaultBridge";
import { indexGameArtifactInRAG } from "../../lib/gameVaultRagSync";
import { GAME_ARTIFACTS_MAP as GAME_ARTIFACTS_DATA } from "../../data/gameArtifacts";
import Link from "next/link";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function ArtifactViewer() {
  const { artifactViewActive, setArtifactViewActive, addXp, unlockArtifact, incrementFragments } = useGame();
  const { addManuscript, manuscripts } = useVault();

  const artifactData = artifactViewActive ? GAME_ARTIFACTS_DATA[artifactViewActive] : null;
  const info = artifactData?.manuscript;

  const handleCollect = () => {
    if (artifactViewActive) {
      unlockArtifact(artifactViewActive);
      addXp(100);
      if (artifactViewActive.startsWith("manuscript")) {
        incrementFragments();
      }

      // Background auto-sync to Curator's Vault & RAG index
      if (addManuscript) {
        try {
          const synced = syncGameArtifactToVault(artifactViewActive, addManuscript, manuscripts);
          if (synced) {
            // Fire-and-forget RAG embedding
            indexGameArtifactInRAG(synced).catch(() => {});
          }
        } catch (syncErr) {
          console.warn("Silent game vault sync error:", syncErr);
        }
      }
    }
    setArtifactViewActive(null);
  };

  if (!artifactViewActive) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl max-h-[88vh] flex flex-col md:flex-row bg-[#0a0a0a] border border-[#D4AF37]/50 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.2)]"
      >
        {/* Left Side: Artifact Artwork Viewer */}
        <div className="w-full md:w-1/2 bg-neutral-900 flex items-center justify-center relative p-6 sm:p-8 overflow-hidden min-h-[220px]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
          
          {artifactData?.svgImage ? (
            <div className="relative w-full max-w-xs sm:max-w-sm rounded-xl overflow-hidden border border-[#D4AF37]/30 shadow-2xl z-10 bg-black/50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artifactData.svgImage}
                alt={info?.title || "Artifact Artwork"}
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
          ) : artifactViewActive === "seal" ? (
            <div className="w-44 h-44 rounded-full bg-[#8B4513] border-4 border-[#A0522D] shadow-2xl flex items-center justify-center">
              <span className="text-white/50 font-serif">SEAL</span>
            </div>
          ) : (
            <div className="w-60 h-28 bg-[#D2B48C] rounded shadow-2xl flex items-center justify-center rotate-[-5deg]">
              <div className="w-full h-full border-b-2 border-dashed border-[#8B4513]/30 m-4"></div>
            </div>
          )}
        </div>

        {/* Right Side: Historical Translation & Info */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-10 flex flex-col relative overflow-y-auto">
          <button
            onClick={() => setArtifactViewActive(null)}
            className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Classification Label */}
          <span className="text-[#D4AF37] tracking-widest text-xs font-bold font-mono mb-1.5 uppercase">
            {info?.classification || (artifactViewActive === "seal" ? "3D ARTIFACT" : "MANUSCRIPT")}
          </span>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-serif text-[#FDF5E6] mb-3 leading-tight">
            {info?.title || (artifactViewActive === "seal" ? "TERRACOTTA SEAL" : "PALM-LEAF MANUSCRIPT")}
          </h2>

          {/* Metadata Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {info?.originalLanguage && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[11px] font-mono text-[#D4AF37]">
                {info.originalLanguage}
              </span>
            )}
            {info?.period && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300">
                {info.period}
              </span>
            )}
            {info?.region && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300">
                {info.region}
              </span>
            )}
          </div>

          {/* Historical Echo / Translation Summary */}
          <div className="bg-[#D4AF37]/10 border-l-4 border-[#D4AF37] p-4 mb-4 rounded-r-lg">
            <h3 className="text-[#D4AF37] font-bold tracking-widest text-xs font-mono uppercase mb-1.5">
              HISTORICAL ECHO
            </h3>
            <p className="text-gray-300 leading-relaxed text-xs sm:text-sm italic font-serif">
              {info?.translationSummary || (artifactViewActive === "seal"
                ? "Seals were used for identification, administration and authentication, offering evidence of how societies recorded and organized information."
                : "Palm-leaf manuscripts were used across the Indian subcontinent to preserve literary, religious, scientific and philosophical knowledge.")}
            </p>
          </div>

          {/* Translation Preview with Vault Link */}
          {info?.translatedText && (
            <div className="p-3.5 bg-white/[0.03] border border-[#D4AF37]/20 rounded-lg mb-6">
              <h3 className="text-[#D4AF37] font-bold tracking-widest text-[11px] font-mono uppercase mb-1">
                📜 TRANSLATION
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed font-serif">
                {info.translatedText.slice(0, 200)}...
              </p>
              <Link
                href="/vault"
                className="text-xs text-[#D4AF37] hover:text-[#F3E5AB] hover:underline inline-block mt-2 font-mono transition-colors"
              >
                Read full translation in Vault →
              </Link>
            </div>
          )}

          {/* Reward & Action */}
          <div className="mt-auto pt-2">
            <div className="flex justify-between items-center mb-4 py-3 border-y border-white/10">
              <span className="text-gray-400 tracking-widest text-xs font-mono">REWARD</span>
              <span className="text-[#D4AF37] font-bold text-lg font-mono">+100 XP</span>
            </div>

            <button
              onClick={handleCollect}
              className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37]/25 to-[#F3E5AB]/20 hover:from-[#D4AF37]/35 hover:to-[#F3E5AB]/30 border border-[#D4AF37]/60 text-[#FDF5E6] font-bold tracking-widest rounded-lg transition-all cursor-pointer text-xs sm:text-sm uppercase font-mono shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              COLLECT ARTIFACT
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
