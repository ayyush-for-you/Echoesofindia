"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, Lock, PlayCircle } from "lucide-react";

export default function JourneyPage() {
  const chapters = [
    {
      id: "01",
      title: "THE LOST MANUSCRIPT",
      description:
        "A forgotten manuscript lies fragmented within an ancient archive. Recover its pieces before its story disappears forever.",
      status: "PLAY NOW",
      locked: false,
      href: "/play",
    },
    {
      id: "02",
      title: "RAJGRIHA — HOUSE OF MEMORY",
      description: "Explore the ancient ruins of the first capital.",
      status: "LOCKED",
      locked: true,
      href: "#",
    },
    {
      id: "03",
      title: "NALANDA — ECHOES OF KNOWLEDGE",
      description: "Walk the corridors of the world's oldest university.",
      status: "LOCKED",
      locked: true,
      href: "#",
    },
    {
      id: "04",
      title: "VOICES FROM HISTORY",
      description: "Listen to the echoes of forgotten scholars.",
      status: "LOCKED",
      locked: true,
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-16">
          <Link href="/">
            <button className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="tracking-widest text-sm font-semibold">RETURN</span>
            </button>
          </Link>
          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#FDF5E6]">
              YOUR JOURNEY
            </h1>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mt-4"></div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {chapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.8 }}
            >
              <Link href={chapter.href} className={chapter.locked ? "pointer-events-none" : ""}>
                <div
                  className={`relative h-full p-6 rounded-lg border transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
                    chapter.locked
                      ? "border-white/5 bg-white/5 opacity-60"
                      : "border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 cursor-pointer"
                  }`}
                >
                  {/* Subtle background glow on hover */}
                  {!chapter.locked && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  )}

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-sm font-mono text-[#D4AF37] tracking-widest">
                        CHAPTER {chapter.id}
                      </span>
                      {chapter.locked ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <PlayCircle className="w-5 h-5 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>

                    <h2
                      className={`text-xl font-bold mb-3 tracking-wide ${
                        chapter.locked ? "text-gray-400" : "text-[#FDF5E6]"
                      }`}
                    >
                      {chapter.title}
                    </h2>

                    <p className="text-sm text-gray-500 leading-relaxed mb-6">
                      {chapter.description}
                    </p>
                  </div>

                  <div className="relative z-10 mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                    <span
                      className={`text-xs font-bold tracking-widest ${
                        chapter.locked ? "text-gray-600" : "text-[#D4AF37] group-hover:text-glow"
                      }`}
                    >
                      {chapter.status}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
