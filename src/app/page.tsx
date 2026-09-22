"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Compass } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background cinematic elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-heritage-gold-dark/20 via-[#0a0a0a]/80 to-[#0a0a0a] z-10" />
        {/* Placeholder for 3D background or image, for now a textured dark bg */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544921616-5cb3b3dcb724?q=80&w=2938&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        {/* Particle/fog simulation overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#FDF5E6] to-[#D4AF37] mb-2 drop-shadow-2xl font-[family-name:var(--font-outfit)]">
            ECHOES
          </h1>
          <h2 className="text-4xl md:text-6xl font-light tracking-[0.3em] text-[#D4AF37] mb-8 text-glow">
            OF INDIA
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <p className="text-xl md:text-2xl text-gray-300 italic mb-6">
            "Where India's forgotten stories come alive."
          </p>
          <p className="text-md md:text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Step beyond the textbook. Explore lost archives, uncover forgotten
            artifacts and restore fragments of India's cultural memory.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="flex flex-col sm:flex-row gap-6 w-full justify-center"
        >
          <Link href="/journey">
            <button className="group relative px-8 py-4 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-sm transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden w-full sm:w-auto">
              <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/20 to-[#D4AF37]/0 group-hover:w-full transition-all duration-700 ease-out" />
              <Play className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              <span className="font-semibold tracking-wider text-[#FDF5E6]">
                BEGIN JOURNEY
              </span>
            </button>
          </Link>
          
          <Link href="/journey">
            <button className="group px-8 py-4 bg-transparent hover:bg-white/5 border border-white/20 rounded-sm transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto">
              <Compass className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              <span className="font-semibold tracking-wider text-gray-300 group-hover:text-white transition-colors">
                EXPLORE THE WORLD
              </span>
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
