"use client";

import { useGame } from "../../store/GameContext";
import { useVault } from "../../store/VaultContext";
import { GAME_ARTIFACTS_MAP as GAME_ARTIFACTS_DATA } from "../../data/gameArtifacts";
import Link from "next/link";
import { motion } from "framer-motion";
import { X, Lock, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function CodexUI() {
  const { setCodexActive, unlockedArtifacts, unlockedEchoes, xp } = useGame();
  const [activeTab, setActiveTab] = useState("ARTIFACTS");

  const { manuscripts } = useVault();

  const totalDiscoveries = unlockedArtifacts.length + unlockedEchoes.length;
  
  const artifactIds = ["manuscript_1", "seal", "manuscript_2", "manuscript_3"];

  const artifacts = artifactIds.map((id) => {
    const data = (GAME_ARTIFACTS_DATA as any)[id];
    const info = data?.manuscript;
    return {
      id,
      title: info?.title || (id === "seal" ? "Terracotta Monastic Seal" : "Palm-Leaf Fragment"),
      subtitle: info ? `${info.originalLanguage} • ${info.period}` : "Sanskrit • Ancient",
      translationSummary: info?.translationSummary || "",
      classification: info?.classification || (id === "seal" ? "3D ARTIFACT" : "MANUSCRIPT"),
      archiveId: info?.archiveId,
    };
  });

  return (
    <div className="w-full h-full p-8 md:p-16 flex flex-col max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-sm text-[#D4AF37] tracking-[0.3em] mb-2">ECHOES CODEX</h2>
          <h1 className="text-4xl md:text-5xl font-serif text-[#FDF5E6]">ARCHIVES</h1>
        </div>
        <button
          onClick={() => setCodexActive(false)}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <span className="text-sm tracking-widest font-mono">CLOSE [TAB]</span>
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-12 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex flex-col shrink-0">
          <div className="space-y-2 mb-12">
            {["ARTIFACTS", "ECHOES", "DISCOVERIES"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 border-l-2 transition-all cursor-pointer ${
                  activeTab === tab
                    ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10"
                    : "border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/30"
                }`}
              >
                <span className="tracking-widest text-sm font-bold">{tab}</span>
              </button>
            ))}
          </div>

          <div className="glass-panel p-6 mt-auto">
            <h3 className="text-xs text-gray-400 tracking-widest mb-4">PROGRESS</h3>
            <div className="mb-4">
              <div className="text-2xl text-[#FDF5E6] font-bold mb-1">
                {totalDiscoveries} / 5
              </div>
              <div className="text-xs text-[#D4AF37] tracking-widest">DISCOVERIES</div>
            </div>
            <div>
              <div className="text-2xl text-[#FDF5E6] font-bold mb-1">{xp}</div>
              <div className="text-xs text-[#D4AF37] tracking-widest">HERITAGE XP</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artifacts.map((item) => {
              const isUnlocked = unlockedArtifacts.includes(item.id as any);
              const data = (GAME_ARTIFACTS_DATA as any)[item.id];
              const info = data?.manuscript;

              return (
                <div
                  key={item.id}
                  className={`p-5 sm:p-6 border rounded-lg flex items-start gap-4 transition-all ${
                    isUnlocked
                      ? "border-[#D4AF37]/30 bg-[#D4AF37]/5"
                      : "border-white/5 bg-white/5 opacity-50"
                  }`}
                >
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded flex items-center justify-center shrink-0 ${
                      isUnlocked ? "bg-[#D4AF37]/20" : "bg-black/50"
                    }`}
                  >
                    {isUnlocked ? (
                      <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-serif text-base sm:text-lg mb-0.5 leading-snug ${
                        isUnlocked ? "text-[#FDF5E6]" : "text-gray-500"
                      }`}
                    >
                      {isUnlocked ? (info?.title || item.title) : "Unknown Artifact"}
                    </h4>

                    <div className="text-xs tracking-wider text-gray-400 font-mono mb-1.5">
                      {isUnlocked
                        ? info
                          ? `${info.originalLanguage} • ${info.period}`
                          : item.subtitle
                        : "LOCKED"}
                    </div>

                    {isUnlocked && (info?.translationSummary || item.translationSummary) && (
                      <p className="text-xs text-gray-300 italic line-clamp-2 my-1.5 font-serif leading-relaxed">
                        "{info?.translationSummary || item.translationSummary}"
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] font-mono tracking-widest text-gray-500 uppercase">
                        {isUnlocked ? (info?.classification || item.classification) : "LOCKED"}
                      </span>
                      {isUnlocked && (() => {
                        const vaultManuscript = manuscripts.find(
                          (m) => m.archiveId === (info?.archiveId || item.archiveId)
                        );
                        const targetHref = vaultManuscript
                          ? `/search/${vaultManuscript.id}`
                          : `/search`;

                        return (
                          <Link
                            href={targetHref}
                            className="text-xs font-mono text-[#D4AF37] hover:underline"
                          >
                            📖 View in Vault →
                          </Link>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
