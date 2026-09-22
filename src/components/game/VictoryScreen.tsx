"use client";

import { useGame } from "../../store/GameContext";
import { useVault } from "../../store/VaultContext";
import { GAME_ARTIFACTS_MAP as GAME_ARTIFACTS_DATA } from "../../data/gameArtifacts";
import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, BookOpen, Compass, Sparkles } from "lucide-react";
import { useState } from "react";

export default function VictoryScreen() {
  const { xp, unlockedArtifacts, unlockedEchoes, setCodexActive } = useGame();
  const [askArchive, setAskArchive] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState("ECHOES CODEX");

  let vaultManuscripts: any[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const vault = useVault();
    vaultManuscripts = vault?.manuscripts || [];
  } catch {
    vaultManuscripts = [];
  }

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return;

    if (cleanQuery.includes("seal")) {
      const seal = GAME_ARTIFACTS_DATA.seal?.manuscript;
      setAnswer(
        seal
          ? `${seal.translatedText}\n\nHistorical Context: ${seal.description}`
          : "Terracotta seals served as official institutional stamps verifying authenticity and monastic authority."
      );
      setSource(seal?.title || "Terracotta Monastic Seal of Nalanda");
    } else if (
      cleanQuery.includes("manuscript") ||
      cleanQuery.includes("palm") ||
      cleanQuery.includes("impermanence")
    ) {
      const m1 = GAME_ARTIFACTS_DATA.manuscript_1?.manuscript;
      setAnswer(
        m1?.translatedText ||
          "All conditioned dharmas are like a dream, a phantom, a bubble, a shadow, like dew or a lightning flash — thus should they be contemplated."
      );
      setSource(m1?.title || "Palm-Leaf Fragment I — Prajñāpāramitā Verse on Impermanence");
    } else if (cleanQuery.includes("emptiness") || cleanQuery.includes("sunyata")) {
      const m2 = GAME_ARTIFACTS_DATA.manuscript_2?.manuscript;
      setAnswer(
        m2?.translatedText ||
          "Form is emptiness, emptiness is form; emptiness does not differ from form, nor form from emptiness; whatever is form, that is emptiness; whatever is emptiness, that is form."
      );
      setSource(m2?.title || "Palm-Leaf Fragment II — Prajñāpāramitā Verse on Emptiness");
    } else if (cleanQuery.includes("compassion") || cleanQuery.includes("karuna")) {
      const m3 = GAME_ARTIFACTS_DATA.manuscript_3?.manuscript;
      setAnswer(
        m3?.translatedText ||
          "Just as the great ocean receives all rivers without overflowing or drying up, so does the heart of the bodhisattva embrace all living beings with boundless compassion. Wisdom without compassion is sterile; compassion without wisdom is blind."
      );
      setSource(m3?.title || "Palm-Leaf Fragment III — Prajñāpāramitā Verse on Compassion");
    } else if (cleanQuery.includes("nalanda")) {
      const m1 = GAME_ARTIFACTS_DATA.manuscript_1?.manuscript;
      const m2 = GAME_ARTIFACTS_DATA.manuscript_2?.manuscript;
      const m3 = GAME_ARTIFACTS_DATA.manuscript_3?.manuscript;
      const seal = GAME_ARTIFACTS_DATA.seal?.manuscript;

      const descriptions = [
        m1 ? `• ${m1.title}: ${m1.description}` : "",
        m2 ? `• ${m2.title}: ${m2.description}` : "",
        m3 ? `• ${m3.title}: ${m3.description}` : "",
        seal ? `• ${seal.title}: ${seal.description}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      setAnswer(
        descriptions ||
          "Nalanda Mahavihara was ancient India's premier international monastic university, home to the Dharma Gunj library complex and scholars from across Asia."
      );
      setSource("Nalanda Mahavihara Unified Archive");
    } else {
      // Keyword match across vault manuscripts
      let match = null;
      if (vaultManuscripts && vaultManuscripts.length > 0) {
        const words = cleanQuery.split(/\s+/).filter((w) => w.length > 2);
        match = vaultManuscripts.find((m: any) => {
          const haystack = `${m.translatedText || ""} ${m.description || ""} ${m.title || ""}`.toLowerCase();
          return words.some((w) => haystack.includes(w));
        });
      }

      if (match) {
        setAnswer(match.translatedText || match.description || match.translationSummary || "Manuscript record located.");
        setSource(match.title || "Curator's Vault");
      } else {
        setAnswer(
          "Try asking about specific artifacts you discovered: impermanence, emptiness, compassion, or the Nalanda seal."
        );
        setSource("ECHOES ARCHIVE SCHOLAR");
      }
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
                <p className="text-[#FDF5E6] leading-relaxed mb-2 whitespace-pre-line text-sm sm:text-base font-serif">
                  {answer}
                </p>
                <span className="text-xs text-[#D4AF37] tracking-widest font-mono uppercase">
                  SOURCE: {source}
                </span>
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
