"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Scroll,
  FileText,
  Copy,
  Check,
  ZoomIn,
  Clock,
  MapPin,
  Globe2,
  Tag,
  BookOpen,
  Search,
  Sparkles,
  Loader2,
  X,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useVault } from "../../../store/VaultContext";
import { vectorStore } from "../../../lib/vectorStore";
import { formatRelativeTime } from "../../../lib/ragHelpers";

export default function ManuscriptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getManuscript, isLoading } = useVault();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const manuscript = getManuscript(id);

  // Lightbox full-screen state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Inline RAG search state
  const [inlineQuestion, setInlineQuestion] = useState("");
  const [inlineAnswer, setInlineAnswer] = useState<string | null>(null);
  const [isInlineSearching, setIsInlineSearching] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Keyboard shortcut: Escape to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxOpen) {
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInlineSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!manuscript || !inlineQuestion.trim()) return;

    setIsInlineSearching(true);
    setInlineError(null);
    setInlineAnswer(null);

    try {
      vectorStore.loadFromStorage();
      // Filter vector store to ONLY this manuscript's vector
      const singleDocVector = vectorStore.documents.filter((d) => d.id === manuscript.id);

      if (singleDocVector.length === 0) {
        throw new Error(
          "This manuscript is not currently indexed in the vector store. You can index it in the Vault."
        );
      }

      const res = await fetch("/api/rag-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: inlineQuestion.trim(),
          vectors: singleDocVector,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search this manuscript.");
      }

      setInlineAnswer(data.answer || "No specific answer found in this manuscript.");
    } catch (err: any) {
      console.error("Inline RAG error:", err);
      setInlineError(err.message || "An error occurred during query processing.");
    } finally {
      setIsInlineSearching(false);
    }
  };

  // Loading state while vault hydrates
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0A0A0A] text-[#FDF5E6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
          <p className="text-xs font-mono text-gray-400">Loading archival manuscript...</p>
        </div>
      </div>
    );
  }

  // Not Found state
  if (!manuscript) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0A0A0A] text-[#FDF5E6] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 sm:p-12 text-center rounded-2xl border border-[#D4AF37]/30 max-w-md w-full shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        >
          <BookOpen className="w-16 h-16 text-[#D4AF37]/40 mx-auto mb-4 stroke-1" />
          <h2 className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-[#FDF5E6] mb-2 tracking-wide">
            Manuscript Not Found
          </h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            The requested archival document may have been removed or does not exist in your local vault.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#F3E5AB] text-xs font-mono font-bold text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Search
            </Link>
            <Link
              href="/vault"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-colors"
            >
              Curator Vault
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const isIndexed = vectorStore.hasDocument(manuscript.id);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0A0A0A] text-[#FDF5E6] px-4 sm:px-6 lg:px-8 py-8 font-[family-name:var(--font-inter)]">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto space-y-6"
      >
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#D4AF37] hover:text-[#F3E5AB] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>← Back to Search</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* RAG Status Badge */}
            {isIndexed ? (
              <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ✓ Indexed in RAG Archive
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm">
                ⚠️ Not indexed
              </span>
            )}

            <Link
              href="/vault"
              className="text-xs font-mono text-gray-400 hover:text-[#D4AF37] transition-colors hidden sm:inline"
            >
              Vault Repository
            </Link>
          </div>
        </div>

        {/* Game-Discovered Artifact Banner */}
        {manuscript.archiveId?.startsWith("GAME-") && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-black/40 to-transparent border-l-4 border-l-emerald-400 border-y border-r border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <div className="flex items-center gap-2.5 font-[family-name:var(--font-outfit)]">
              <span className="text-base">🎮</span>
              <span className="font-semibold text-[#F3E5AB]">
                This artifact was discovered during gameplay in Chapter 1: The Lost Manuscript
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase tracking-wider hidden sm:inline">
              In-Game Relic
            </span>
          </div>
        )}

        {/* Header & Title */}
        <div className="space-y-3 pb-2 border-b border-white/10">
          <h1 className="text-3xl sm:text-5xl font-extrabold font-[family-name:var(--font-outfit)] tracking-wide bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] bg-clip-text text-transparent">
            {manuscript.title}
          </h1>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {manuscript.classification && (
              <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-mono font-semibold uppercase">
                {manuscript.classification}
              </span>
            )}

            <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] text-xs font-mono font-semibold flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              {manuscript.originalLanguage}
            </span>

            {manuscript.period && (
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                {manuscript.period}
              </span>
            )}

            {manuscript.region && (
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                {manuscript.region}
              </span>
            )}

            {manuscript.sourceInstitution && (
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-mono flex items-center gap-1.5">
                <span>Source:</span>
                {manuscript.sourceUrl ? (
                  <a
                    href={manuscript.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    <span>{manuscript.sourceInstitution}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[#D4AF37]">{manuscript.sourceInstitution}</span>
                )}
              </span>
            )}

            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono">
              Uploaded {formatRelativeTime(manuscript.uploadedAt)}
            </span>
          </div>
        </div>

        {/* Two-Column Layout (Stacks on mobile, 40% Left / 60% Right on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (40% / 5 cols) */}
          <div className="lg:col-span-5 space-y-4 sticky top-24">
            <div
              onClick={() => setLightboxOpen(true)}
              className="relative rounded-2xl overflow-hidden bg-black/80 border border-[#D4AF37]/40 hover:border-[#D4AF37] shadow-[0_4px_30px_rgba(0,0,0,0.8)] cursor-pointer group transition-all duration-300 min-h-[300px] flex items-center justify-center"
            >
              {manuscript.fileType === "application/pdf" || manuscript.fileName?.endsWith(".pdf") ? (
                <div className="p-12 flex flex-col items-center gap-3 text-center">
                  <FileText className="w-20 h-20 text-[#D4AF37]" />
                  <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">
                    PDF Manuscript Document
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {manuscript.fileName}
                  </span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={manuscript.originalImageUrl}
                  alt={manuscript.title}
                  className="w-full h-auto max-h-[550px] object-cover rounded-2xl group-hover:scale-102 transition-transform duration-300"
                />
              )}

              {/* Lightbox hint banner */}
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/80 border border-white/20 text-xs text-[#FDF5E6] font-mono flex items-center gap-1.5 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Click for Fullscreen</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 font-mono text-center">
              Click image to inspect folio in high-resolution lightbox
            </p>
          </div>

          {/* Right Column (60% / 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Section: TRANSLATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-[#D4AF37]" />
                  TRANSLATION
                </h3>

                <button
                  onClick={() => handleCopy(manuscript.translatedText)}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-[#D4AF37]/30 text-xs font-mono text-[#D4AF37] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 Copy Translation</span>
                    </>
                  )}
                </button>
              </div>

              {/* Parchment Styled Card */}
              <div className="p-6 rounded-2xl bg-[#FDF5E6]/5 border border-[#D4AF37]/25 text-[#FDF5E6] font-[family-name:var(--font-inter)] leading-relaxed text-sm whitespace-pre-wrap shadow-inner max-h-[420px] overflow-y-auto">
                {manuscript.translatedText}
              </div>
            </div>

            {/* Section: SUMMARY */}
            {manuscript.translationSummary && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  SUMMARY
                </h3>
                <div className="p-4 rounded-xl bg-black/40 border-l-4 border-l-[#D4AF37] border-y border-r border-white/10 text-sm text-gray-300 leading-relaxed font-[family-name:var(--font-inter)]">
                  {manuscript.translationSummary}
                </div>
              </div>
            )}

            {/* Section: CURATOR'S NOTES */}
            {manuscript.description && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold">
                  CURATOR&apos;S NOTES
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-gray-300 leading-relaxed">
                  {manuscript.description}
                </div>
              </div>
            )}

            {/* Section: TAGS */}
            {manuscript.tags && manuscript.tags.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                  TAGS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {manuscript.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-black/40 border border-[#D4AF37]/35 text-xs font-mono text-[#FDF5E6]/90 hover:border-[#D4AF37] transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Section: 🔮 ASK ABOUT THIS MANUSCRIPT (Inline mini RAG) */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold flex items-center gap-2">
                <span>🔮 ASK ABOUT THIS MANUSCRIPT</span>
              </h3>

              <form onSubmit={handleInlineSearch} className="space-y-3">
                <div className="flex items-center glass-panel rounded-xl border border-[#D4AF37]/30 focus-within:border-[#D4AF37] p-1.5 transition-all">
                  <Search className="w-4 h-4 text-[#D4AF37] ml-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={inlineQuestion}
                    onChange={(e) => setInlineQuestion(e.target.value)}
                    disabled={isInlineSearching}
                    placeholder="Ask a question about this specific manuscript..."
                    className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[#FDF5E6] placeholder:text-gray-500 outline-none font-[family-name:var(--font-inter)]"
                  />
                  <button
                    type="submit"
                    disabled={isInlineSearching || !inlineQuestion.trim()}
                    className="flex-shrink-0 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-bold font-[family-name:var(--font-outfit)] text-xs uppercase tracking-wider hover:bg-[#F3E5AB] transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
                  >
                    {isInlineSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Ask</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Inline RAG Result */}
              {isInlineSearching && (
                <div className="p-4 rounded-xl glass-panel border border-[#D4AF37]/20 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span className="text-xs text-gray-300 font-mono">
                    Analyzing folio context and answering...
                  </span>
                </div>
              )}

              {inlineError && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{inlineError}</span>
                </div>
              )}

              {inlineAnswer && !isInlineSearching && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl glass-panel border-l-4 border-l-[#D4AF37] border-y border-r border-[#D4AF37]/20 space-y-2 shadow-lg"
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono text-[#D4AF37] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Folio Scholar Answer:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#FDF5E6]/90 leading-relaxed whitespace-pre-wrap font-[family-name:var(--font-inter)]">
                    {inlineAnswer}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Lightbox Overlay */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Lightbox Header Bar */}
            <div
              className="w-full max-w-5xl flex items-center justify-between pb-4 mb-2 border-b border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-sm sm:text-base font-bold font-[family-name:var(--font-outfit)] text-[#D4AF37] truncate max-w-md">
                {manuscript.title}
              </h2>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">
                  Press ESC to close
                </span>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Image View */}
            <div
              className="max-w-5xl max-h-[80vh] overflow-auto flex items-center justify-center p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {manuscript.fileType === "application/pdf" || manuscript.fileName?.endsWith(".pdf") ? (
                <div className="p-12 glass-panel rounded-2xl border border-[#D4AF37]/40 flex flex-col items-center gap-3 text-center">
                  <FileText className="w-24 h-24 text-[#D4AF37]" />
                  <span className="text-sm font-mono text-[#D4AF37]">
                    PDF Manuscript ({manuscript.fileName})
                  </span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={manuscript.originalImageUrl}
                  alt={manuscript.title}
                  className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl border border-[#D4AF37]/30"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
