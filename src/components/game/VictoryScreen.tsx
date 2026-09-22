"use client";

import { useGame } from "../../store/GameContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, BookOpen, Compass, Sparkles } from "lucide-react";
import { useState } from "react";

export default function VictoryScreen() {
  const { xp, unlockedArtifacts, unlockedEchoes, setCodexActive } = useGame();
  const [askArchive, setAskArchive] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    // Mock AI response
    if (query.toLowerCase().includes("seal")) {
      setAnswer("Seals in ancient India were primarily used for administrative purposes, trade authentication, and marking ownership. They provide crucial insights into the language and symbology of the era.");
    } else if (query.toLowerCase().includes("manuscript") || query.toLowerCase().includes("palm")) {
      setAnswer("Palm-leaf manuscripts were created by drying and polishing palm leaves, then inscribing them with a stylus. They were the primary medium for preserving literature, science, and philosophy in ancient India.");
    } else {
      setAnswer("The archives contain many secrets. Every artifact you discover adds to our collective memory of ancient India.");
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/10 via-black to-black z-0" />
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        className="w-full max-w-4xl relative z-10 flex flex-col items-center text-center"
      >
        <Sparkles className="w-12 h-12 text-[#D4AF37] mb-6 animate-pulse" />
        <h1 className="text-5xl md:text-7xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-b from-[#FDF5E6] to-[#D4AF37] mb-4">
          MEMORY RESTORED
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 italic mb-2">
          "You didn't just find history."
        </p>
        <p className="text-xl md:text-2xl text-[#D4AF37] italic mb-12">
          "You helped it survive."
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full mb-12">
          {[
            { label: "HERITAGE XP", value: xp, icon: Trophy },
            { label: "ARTIFACTS", value: unlockedArtifacts.length, icon: Compass },
            { label: "PUZZLES SOLVED", value: "2", icon: Sparkles },
            { label: "ECHOES UNLOCKED", value: "1", icon: BookOpen },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.2 }}
              className="glass-panel p-6 flex flex-col items-center"
            >
              <stat.icon className="w-6 h-6 text-[#D4AF37] mb-3" />
              <span className="text-3xl font-bold text-[#FDF5E6] mb-1">{stat.value}</span>
              <span className="text-xs text-gray-400 tracking-widest">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {askArchive ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="w-full max-w-2xl glass-panel p-8 mb-8 text-left"
          >
            <h3 className="text-[#D4AF37] font-serif text-2xl mb-2">ASK THE ARCHIVE</h3>
            <p className="text-gray-400 text-sm mb-6">Ask something about what you discovered.</p>
            
            <form onSubmit={handleAsk} className="flex gap-2 mb-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. What were palm-leaf manuscripts used for?"
                className="flex-1 bg-black/50 border border-white/20 rounded px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded hover:bg-[#FDF5E6] transition-colors"
              >
                ASK
              </button>
            </form>

            {answer && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-l-2 border-[#D4AF37] pl-4 py-2"
              >
                <p className="text-[#FDF5E6] leading-relaxed mb-2">{answer}</p>
                <span className="text-xs text-[#D4AF37] tracking-widest">SOURCE: ECHOES CODEX</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center w-full"
          >
            <button
              onClick={() => setCodexActive(true)}
              className="px-8 py-4 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 text-[#FDF5E6] font-bold tracking-widest rounded-sm transition-colors"
            >
              VIEW CODEX
            </button>
            <button
              onClick={() => setAskArchive(true)}
              className="px-8 py-4 bg-transparent hover:bg-white/5 border border-white/20 text-gray-300 font-bold tracking-widest rounded-sm transition-colors"
            >
              ASK THE ARCHIVE
            </button>
            <Link href="/journey">
              <button className="px-8 py-4 bg-transparent hover:bg-white/5 border border-white/20 text-gray-300 font-bold tracking-widest rounded-sm transition-colors w-full h-full">
                EXPLORE MORE
              </button>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
