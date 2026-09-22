"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  SearchX,
  BookOpen,
  ArrowRight,
  Clock,
  MapPin,
  Globe2,
  Tag,
  AlertCircle,
  ExternalLink,
  History,
  Loader2,
  ChevronRight,
  Check,
  Copy,
  CornerDownLeft,
} from "lucide-react";
import { useVault } from "../../store/VaultContext";
import { vectorStore } from "../../lib/vectorStore";
import { RAGSearchResult, RAGSource } from "../../types/rag";
import { Manuscript } from "../../types/manuscript";
import { formatRelativeTime } from "../../lib/ragHelpers";

const SUGGESTED_QUERIES = [
  "What is the Prajnaparamita?",
  "Game discoveries",
  "Chapter 1 artifacts",
  "Nalanda fragments",
  "Buddhist philosophy",
  "Constitution Article 32",
  "Sanskrit sutras",
];

const SEARCH_HISTORY_KEY = "echoes_search_history";

/**
 * Highlight matching query terms within a snippet
 */
function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  if (!text) return null;
  if (!query || !query.trim()) {
    return <span>{text}</span>;
  }

  // Extract query keywords (2+ chars)
  const keywords = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (keywords.length === 0) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${keywords.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => {
        const isMatch = keywords.some((k) => k.toLowerCase() === part.toLowerCase());
        return isMatch ? (
          <mark
            key={i}
            className="bg-[#D4AF37]/25 text-[#F3E5AB] font-semibold px-0.5 rounded border-b border-[#D4AF37]/40"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

export default function SearchPage() {
  const { manuscripts, searchManuscripts, isLoading: isVaultLoading } = useVault();

  // Search input and submission state
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Search results state
  const [ragResult, setRagResult] = useState<RAGSearchResult | null>(null);
  const [keywordMatches, setKeywordMatches] = useState<Manuscript[]>([]);
  const [ragError, setRagError] = useState<string | null>(null);

  // Search history state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [indexedCount, setIndexedCount] = useState(0);

  // Copy answer state
  const [isAnswerCopied, setIsAnswerCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync vectorStore count & search history
  useEffect(() => {
    vectorStore.loadFromStorage();
    setIndexedCount(vectorStore.getDocumentCount());

    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSearchHistory(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      console.error("Failed to load search history:", e);
    }
  }, []);

  useEffect(() => {
    setIndexedCount(vectorStore.getDocumentCount());
  }, [manuscripts]);

  // Keyboard shortcut: Press "/" anywhere to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveToHistory = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setSearchHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save search history:", e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.error("Failed to clear search history:", e);
    }
    setSearchHistory([]);
  };

  // Perform Dual-Mode Search with 200ms smoothing delay
  const executeSearch = async (searchTerm: string) => {
    const targetQuery = searchTerm.trim();
    if (!targetQuery) return;

    setQuery(targetQuery);
    setSubmittedQuery(targetQuery);
    setHasSearched(true);
    setIsSearching(true);
    setRagError(null);
    setRagResult(null);
    setIsAnswerCopied(false);

    saveToHistory(targetQuery);

    // 200ms brief artificial delay for perceived smoothness
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Instant keyword search
    const kwResults = searchManuscripts(targetQuery);

    vectorStore.loadFromStorage();
    const storedVectors = vectorStore.documents;

    try {
      // RAG Semantic Search
      const res = await fetch("/api/rag-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: targetQuery,
          vectors: storedVectors,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retrieve RAG response.");
      }

      setRagResult(data);

      const ragSourceIds = new Set((data.sources || []).map((s: RAGSource) => s.id));
      const additionalKw = kwResults.filter((m) => !ragSourceIds.has(m.id));
      setKeywordMatches(additionalKw);
    } catch (err: any) {
      console.warn("RAG search failed, using keyword fallback:", err);
      setRagError(err.message || "AI search temporarily unavailable. Showing keyword results.");
      setKeywordMatches(kwResults);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleCopyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsAnswerCopied(true);
    setTimeout(() => setIsAnswerCopied(false), 2000);
  };

  const getScoreBadgeClasses = (score: number) => {
    const pct = Math.round(score * 100);
    if (pct >= 80) {
      return "text-emerald-400 bg-emerald-950/70 border-emerald-500/40";
    }
    if (pct >= 50) {
      return "text-[#D4AF37] bg-[#D4AF37]/15 border-[#D4AF37]/40";
    }
    return "text-gray-400 bg-gray-900/70 border-gray-700/40";
  };

  const isVaultEmpty = !isVaultLoading && manuscripts.length === 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0A0A0A] text-[#FDF5E6] px-4 sm:px-6 lg:px-8 py-8 flex flex-col font-[family-name:var(--font-inter)]">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        {/* ── HERO VIEW (BEFORE ANY SEARCH HAS BEEN PERFORMED) ── */}
        {!hasSearched ? (
          <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Neural Archive Retrieval • RAG
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-[0.25em] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] bg-clip-text text-transparent font-[family-name:var(--font-outfit)] uppercase">
                MANUSCRIPT SEARCH
              </h1>

              <p className="text-gray-400 text-sm sm:text-base tracking-wide mt-3 max-w-xl mx-auto leading-relaxed">
                AI-powered search across India&apos;s ancient manuscripts. Ask questions in natural
                language — our archive scholar will find answers.
              </p>
            </motion.div>

            {/* Prominent Search Bar */}
            <motion.form
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onSubmit={handleFormSubmit}
              className="w-full max-w-2xl"
            >
              <motion.div
                animate={{
                  scale: isInputFocused ? 1.015 : 1,
                  boxShadow: isInputFocused
                    ? "0 0 35px rgba(212, 175, 55, 0.25)"
                    : "0 0 20px rgba(0, 0, 0, 0.6)",
                }}
                transition={{ duration: 0.25 }}
                className={`relative flex items-center glass-panel rounded-2xl border transition-all duration-300 p-2 sm:p-2.5 ${
                  isInputFocused ? "border-[#D4AF37]" : "border-[#D4AF37]/30"
                }`}
              >
                <Search className="w-5 h-5 text-[#D4AF37] ml-3 flex-shrink-0" />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  disabled={isVaultEmpty}
                  placeholder={
                    isVaultEmpty
                      ? "The vault is empty. Upload manuscripts first..."
                      : "Ask anything... e.g. 'What does the Prajnaparamita say about wisdom?' or 'Buddhist manuscripts from Nalanda'"
                  }
                  className="w-full bg-transparent px-4 py-3.5 text-sm sm:text-base text-[#FDF5E6] placeholder:text-gray-500 outline-none font-[family-name:var(--font-inter)]"
                />

                <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-gray-500 border border-white/10 rounded px-1.5 py-0.5 mr-2">
                  <span>Press</span>
                  <span className="text-[#D4AF37]">/</span>
                </div>

                <button
                  type="submit"
                  disabled={isVaultEmpty || !query.trim()}
                  className="flex-shrink-0 px-4 sm:px-6 py-3 rounded-xl font-bold font-[family-name:var(--font-outfit)] text-xs sm:text-sm tracking-wider uppercase bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>🔮</span>
                  <span className="hidden sm:inline">ASK THE ARCHIVE</span>
                  <span className="sm:hidden">SEARCH</span>
                </button>
              </motion.div>
            </motion.form>

            {/* Suggested Queries Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 w-full max-w-2xl text-center"
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-gray-500 font-mono mr-1">Suggestions:</span>
                {SUGGESTED_QUERIES.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => executeSearch(suggestion)}
                    className="px-3 py-1.5 rounded-full text-xs font-mono bg-white/[0.03] border border-[#D4AF37]/25 text-[#FDF5E6]/80 hover:text-white hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Recent Searches Pills */}
            {searchHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="mt-5 w-full max-w-2xl text-center"
              >
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                    <History className="w-3 h-3 text-gray-400" />
                    Recent:
                  </span>
                  {searchHistory.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => executeSearch(item)}
                      className="px-2.5 py-1 rounded-full text-xs font-mono bg-white/[0.02] border border-white/10 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-all cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-[11px] text-gray-500 hover:text-red-400 underline transition-colors cursor-pointer ml-1 font-mono"
                  >
                    Clear history
                  </button>
                </div>
              </motion.div>
            )}

            {/* Info Line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-gray-500"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span>Powered by RAG</span>
              <span className="text-gray-700">•</span>
              <span className="text-gray-400">
                <span className="text-[#D4AF37] font-semibold">{indexedCount}</span> manuscripts indexed
              </span>
            </motion.div>

            {/* Empty Vault Decorative Illustration / Notice */}
            {isVaultEmpty && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mt-8 p-6 rounded-2xl glass-panel border border-amber-500/40 bg-amber-950/25 text-amber-200 text-xs flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg shadow-[0_0_30px_rgba(245,158,11,0.1)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-center sm:text-left flex-1 space-y-1">
                  <p className="font-bold font-[family-name:var(--font-outfit)] text-sm text-[#F3E5AB]">
                    The Archive is Empty
                  </p>
                  <p className="text-gray-300 text-xs">
                    Upload manuscripts to the Curator&apos;s Vault to enable semantic search and AI synthesis.
                  </p>
                </div>
                <Link
                  href="/vault"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#F3E5AB] text-black font-bold font-[family-name:var(--font-outfit)] text-xs uppercase transition-colors whitespace-nowrap"
                >
                  Upload first
                </Link>
              </motion.div>
            )}
          </div>
        ) : (
          /* ── RESULTS VIEW (SEARCH PERFORMED) ── */
          <div className="w-full flex-1 flex flex-col space-y-6">
            {/* Top Compact Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="sticky top-20 z-20 pb-2"
            >
              <form onSubmit={handleFormSubmit} className="w-full">
                <div
                  className={`flex items-center glass-panel rounded-xl border p-1.5 sm:p-2 shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all ${
                    isInputFocused ? "border-[#D4AF37]" : "border-[#D4AF37]/30"
                  }`}
                >
                  <Search className="w-4 h-4 text-[#D4AF37] ml-2.5 flex-shrink-0" />

                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="Ask a question or search manuscripts..."
                    className="w-full bg-transparent px-3 py-2 text-sm text-[#FDF5E6] placeholder:text-gray-500 outline-none font-[family-name:var(--font-inter)]"
                  />

                  <button
                    type="submit"
                    disabled={isSearching || !query.trim()}
                    className="flex-shrink-0 px-4 py-2 rounded-lg font-bold font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase bg-[#D4AF37] text-black hover:bg-[#F3E5AB] transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    ) : (
                      <span>Search</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Suggestions row in top bar */}
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 text-xs no-scrollbar">
                <span className="text-gray-500 font-mono text-[11px] flex-shrink-0">Try:</span>
                {SUGGESTED_QUERIES.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => executeSearch(suggestion)}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/5 border border-white/10 text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Loading & Skeleton States */}
            {isSearching && (
              <div className="space-y-6 py-4">
                {/* Pulsing Skeleton for RAG Answer */}
                <div className="glass-panel rag-answer-card rounded-2xl border-l-4 border-l-[#D4AF37] border-y border-r border-[#D4AF37]/25 p-6 sm:p-8 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full skeleton-shimmer" />
                    <div className="h-4 w-56 rounded skeleton-shimmer" />
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="h-4 w-full rounded skeleton-shimmer" />
                    <div className="h-4 w-11/12 rounded skeleton-shimmer" />
                    <div className="h-4 w-4/5 rounded skeleton-shimmer" />
                  </div>
                  <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="h-20 rounded-xl skeleton-shimmer" />
                    <div className="h-20 rounded-xl skeleton-shimmer" />
                  </div>
                </div>

                {/* Skeleton list items for search results */}
                <div className="space-y-3 pt-2">
                  <div className="h-4 w-48 rounded skeleton-shimmer mb-4" />
                  {[1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="glass-panel p-5 rounded-2xl border border-[#D4AF37]/20 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <div className="h-5 w-2/5 rounded skeleton-shimmer" />
                        <div className="h-4 w-20 rounded-full skeleton-shimmer" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-3 w-16 rounded-full skeleton-shimmer" />
                        <div className="h-3 w-20 rounded-full skeleton-shimmer" />
                      </div>
                      <div className="h-14 w-full rounded-xl skeleton-shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Display */}
            {!isSearching && (
              <div className="space-y-8 pb-16">
                {/* 1. RAG Fallback Notice */}
                {ragError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3 shadow-md"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="flex-1">
                      AI search temporarily unavailable. Showing keyword results. ({ragError})
                    </p>
                  </motion.div>
                )}

                {/* 2. AI Answer Card (Prominent at the top) */}
                {ragResult && ragResult.answer && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="glass-panel rounded-2xl border-l-4 border-l-[#D4AF37] border-y border-r border-[#D4AF37]/25 p-6 sm:p-8 shadow-[0_4px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
                  >
                    <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">📜</span>
                        <h2 className="text-sm sm:text-base font-bold font-[family-name:var(--font-outfit)] text-[#D4AF37] tracking-widest uppercase flex items-center gap-2">
                          ARCHIVE SCHOLAR&apos;S ANSWER
                          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </h2>
                      </div>

                      <button
                        onClick={() => handleCopyAnswer(ragResult.answer)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy answer"
                      >
                        {isAnswerCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* AI Answer Text */}
                    <div className="text-[#FDF5E6]/95 text-sm sm:text-base leading-relaxed space-y-3 font-[family-name:var(--font-inter)] font-normal whitespace-pre-wrap">
                      {ragResult.answer}
                    </div>

                    {/* Sources Section below answer */}
                    {ragResult.sources && ragResult.sources.length > 0 && (
                      <div className="mt-6 pt-5 border-t border-white/10">
                        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span>Cited Sources &amp; Excerpts:</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {ragResult.sources.map((src, i) => {
                            const scorePct = Math.round(src.relevanceScore * 100);
                            const m = manuscripts.find((doc) => doc.id === src.id);
                            const isGameArtifact = m?.archiveId?.startsWith("GAME-");

                            return (
                              <motion.div
                                key={src.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.08 }}
                              >
                                <Link
                                  href={`/search/${src.id}`}
                                  className="block p-3.5 rounded-xl bg-black/40 border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/[0.05] transition-all group"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h4 className="text-xs font-bold font-[family-name:var(--font-outfit)] text-[#D4AF37] group-hover:text-[#F3E5AB] group-hover:underline transition-colors truncate flex-1 flex items-center gap-1.5">
                                      {isGameArtifact && <span title="Discovered in Chapter 1">🎮</span>}
                                      <span className="truncate">{src.title}</span>
                                    </h4>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold flex-shrink-0 ${getScoreBadgeClasses(
                                        src.relevanceScore
                                      )}`}
                                    >
                                      {scorePct}% match
                                    </span>
                                  </div>

                                  {/* Percentage bar */}
                                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mb-2">
                                    <div
                                      className="relevance-bar"
                                      style={{ width: `${Math.min(100, Math.max(5, scorePct))}%` }}
                                    />
                                  </div>

                                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                                    <HighlightedSnippet text={src.snippet} query={submittedQuery} />
                                  </p>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. Source Manuscripts List (Google-style) */}
                {ragResult && ragResult.sources && ragResult.sources.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-sm font-bold font-[family-name:var(--font-outfit)] text-gray-300 tracking-wider uppercase flex items-center gap-2">
                      <span>📚 SOURCE MANUSCRIPTS ({ragResult.sources.length} results)</span>
                    </h2>

                    <div className="space-y-3">
                      {ragResult.sources.map((src, i) => {
                        const m = manuscripts.find((doc) => doc.id === src.id);
                        const scorePct = Math.round(src.relevanceScore * 100);

                        return (
                          <motion.div
                            key={src.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.05 }}
                            className="glass-panel p-5 rounded-2xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:shadow-[0_0_25px_rgba(212,175,55,0.15)] transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <Link
                                href={`/search/${src.id}`}
                                className="text-base sm:text-lg font-bold font-[family-name:var(--font-outfit)] text-[#D4AF37] hover:text-[#F3E5AB] hover:underline transition-colors flex items-center gap-2 group flex-wrap"
                              >
                                {m?.archiveId?.startsWith("GAME-") && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-semibold">
                                    🎮 Chapter 1 Discovery
                                  </span>
                                )}
                                <span>{src.title}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-colors" />
                              </Link>

                              <span
                                className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-mono border font-semibold ${getScoreBadgeClasses(
                                  src.relevanceScore
                                )}`}
                              >
                                {scorePct}% match
                              </span>
                            </div>

                            {/* Metadata Badges */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {m?.originalLanguage && (
                                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-mono text-[#D4AF37]">
                                  {m.originalLanguage}
                                </span>
                              )}
                              {m?.period && (
                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300">
                                  {m.period}
                                </span>
                              )}
                              {m?.region && (
                                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-gray-300">
                                  {m.region}
                                </span>
                              )}
                            </div>

                            {/* Snippet with Query Highlighted */}
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-[family-name:var(--font-inter)] mb-3 bg-black/40 p-3 rounded-xl border border-white/5">
                              <HighlightedSnippet text={src.snippet} query={submittedQuery} />
                            </p>

                            {/* Footer: Tags & Upload date */}
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500 font-mono pt-1">
                              <div className="flex flex-wrap gap-1">
                                {m?.tags?.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded border border-white/10 text-gray-400 text-[10px]"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>

                              {m?.uploadedAt && (
                                <span>Uploaded {formatRelativeTime(m.uploadedAt)}</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Additional Keyword Matches */}
                {keywordMatches.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h2 className="text-sm font-bold font-[family-name:var(--font-outfit)] text-gray-300 tracking-wider uppercase flex items-center gap-2">
                      <span>🔤 ADDITIONAL KEYWORD MATCHES ({keywordMatches.length})</span>
                    </h2>

                    <div className="space-y-3">
                      {keywordMatches.map((m, i) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          className="glass-panel p-4 rounded-xl border border-white/10 hover:border-[#D4AF37]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <Link
                              href={`/search/${m.id}`}
                              className="text-sm sm:text-base font-bold font-[family-name:var(--font-outfit)] text-[#D4AF37] hover:text-[#F3E5AB] hover:underline transition-colors flex items-center gap-1.5"
                            >
                              {m.archiveId?.startsWith("GAME-") && (
                                <span title="Discovered in Chapter 1">🎮</span>
                              )}
                              <span>{m.title}</span>
                            </Link>

                            <p className="text-xs text-gray-400 line-clamp-1">
                              <HighlightedSnippet
                                text={m.translationSummary || m.description || m.translatedText}
                                query={submittedQuery}
                              />
                            </p>

                            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 pt-1">
                              <span>{m.originalLanguage}</span>
                              {m.period && <span>• {m.period}</span>}
                              {m.region && <span>• {m.region}</span>}
                            </div>
                          </div>

                          <Link
                            href={`/search/${m.id}`}
                            className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-mono text-[#D4AF37] flex items-center gap-1 transition-colors flex-shrink-0"
                          >
                            <span>View</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. No Results Edge Case with CSS Decorative Ornaments */}
                {(!ragResult || (ragResult.sources?.length === 0 && !ragResult.answer)) &&
                  keywordMatches.length === 0 &&
                  !ragError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative glass-panel p-10 text-center rounded-2xl border border-[#D4AF37]/30 max-w-md mx-auto my-8 overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)]"
                    >
                      {/* CSS-only decorative borders & radial glow */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />
                      <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]/50" />
                      <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]/50" />
                      <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]/50" />
                      <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]/50" />

                      <SearchX className="w-16 h-16 text-[#D4AF37]/40 mx-auto mb-4 stroke-1" />
                      <h3 className="text-xl font-bold font-[family-name:var(--font-outfit)] text-[#FDF5E6] tracking-wider mb-2">
                        No manuscripts found
                      </h3>
                      <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                        Try different keywords, questions, or upload new manuscripts to the Vault to expand the
                        archive knowledge.
                      </p>
                      <Link
                        href="/vault"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-black bg-[#D4AF37] hover:bg-[#F3E5AB] transition-colors text-xs uppercase cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        Go to Vault
                      </Link>
                    </motion.div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
