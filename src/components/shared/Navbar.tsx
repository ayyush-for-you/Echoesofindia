"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Archive, Search, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // The navbar should NOT appear on the /play route (the actual 3D game page)
  if (pathname.startsWith("/play")) {
    return null;
  }

  // Active state matching rules:
  // - "/vault" → VAULT active
  // - "/search" + "/search/*" → SEARCH active
  // - "/journey" + "/play" → GAME active
  // - "/" → none active
  const isGameActive = pathname === "/journey" || pathname.startsWith("/play");
  const isVaultActive = pathname === "/vault" || pathname.startsWith("/vault/");
  const isSearchActive = pathname === "/search" || pathname.startsWith("/search/");

  const navLinks = [
    { name: "GAME", href: "/journey", icon: Gamepad2, isActive: isGameActive },
    { name: "VAULT", href: "/vault", icon: Archive, isActive: isVaultActive },
    { name: "SEARCH", href: "/search", icon: Search, isActive: isSearchActive },
  ];

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 w-full h-16 z-50 flex items-center justify-between px-6 md:px-12 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-[#D4AF37]/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
      >
        {/* Left side: Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-[#D4AF37] font-semibold text-xs tracking-[0.25em] transition-all hover:text-[#FDF5E6]"
        >
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] group-hover:scale-125 transition-transform shadow-[0_0_8px_#D4AF37]" />
          ECHOES OF INDIA
        </Link>

        {/* Desktop Navigation Links (>= 768px) */}
        <nav className="hidden md:flex items-center gap-2 md:gap-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = link.isActive;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider transition-all duration-200 ${
                  active
                    ? "bg-[#D4AF37] text-black border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)] font-semibold"
                    : "text-gray-300 hover:text-[#FDF5E6] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-black" : "text-[#D4AF37]"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button (< 768px) */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#D4AF37]/30 shadow-2xl overflow-hidden px-6 py-4 space-y-3"
          >
            <nav className="flex flex-col gap-2.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = link.isActive;

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium tracking-wider transition-all ${
                      active
                        ? "bg-[#D4AF37] text-black border border-[#D4AF37] font-semibold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                        : "text-gray-300 hover:text-white bg-white/5 border border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? "text-black" : "text-[#D4AF37]"}`} />
                      <span>{link.name}</span>
                    </div>
                    {active && <span className="w-2 h-2 rounded-full bg-black" />}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
