"use client";

import { useState, useRef, useEffect, DragEvent, ChangeEvent, FormEvent, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
  Clock,
  MapPin,
  Globe2,
  Tag,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  ZoomIn,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ArrowRight,
  Archive,
  Gamepad2,
  Landmark,
} from "lucide-react";
import { useVault } from "../../store/VaultContext";
import { useToast } from "../../store/ToastContext";
import { useGame } from "../../store/GameContext";
import { Manuscript } from "../../types/manuscript";
import { vectorStore } from "../../lib/vectorStore";
import { VectorDocument } from "../../types/rag";
import { prepareDocumentText, formatRelativeTime } from "../../lib/ragHelpers";
import { SEED_MANUSCRIPTS } from "../../data/seedManuscripts";
import { syncAllGameArtifacts } from "../../lib/gameVaultBridge";
import { indexGameArtifactInRAG } from "../../lib/gameVaultRagSync";

const LANGUAGE_OPTIONS = [
  "Sanskrit",
  "Pali",
  "Prakrit",
  "Tamil",
  "Telugu",
  "Kannada",
  "Bengali",
  "Hindi",
  "Urdu",
  "Persian",
  "Arabic",
  "Unknown",
];

type SortOption = "newest" | "oldest" | "alphabetical";
type LibraryFilter = "all" | "game" | "institutional" | "curator";

export default function VaultPage() {
  const { addManuscript, removeManuscript, manuscripts, isLoading } = useVault();
  const { addToast } = useToast();
  const gameContext = useGame();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"upload" | "library">("upload");
  const tabInitializedRef = useRef(false);

  // Once manuscripts load, default to library if manuscripts exist
  useEffect(() => {
    if (!isLoading && !tabInitializedRef.current) {
      if (manuscripts.length > 0) {
        setActiveTab("library");
      }
      tabInitializedRef.current = true;
    }
  }, [isLoading, manuscripts.length]);

  // Vector store reactive version tracker
  const [vectorVersion, setVectorVersion] = useState(0);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState("Sanskrit");
  const [period, setPeriod] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");

  // Upload & Translation progress state
  const [uploadPhase, setUploadPhase] = useState<"idle" | "translating" | "indexing">("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  // Library state: filters, sorting & modal
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedModalManuscript, setSelectedModalManuscript] = useState<Manuscript | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);

  // Seeding from Institutional Repositories State
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgressStep, setSeedProgressStep] = useState(0);
  const [seedCurrentTitle, setSeedCurrentTitle] = useState("");
  const [seedErrors, setSeedErrors] = useState<string[]>([]);

  // Syncing Game Discoveries State
  const [isSyncingGame, setIsSyncingGame] = useState(false);

  // Check if all 6 institutional seed artifacts are already in the vault
  const seedArchiveIds = useMemo(() => SEED_MANUSCRIPTS.map((s) => s.archiveId), []);
  const allSeeded = useMemo(() => {
    return seedArchiveIds.every((arcId) =>
      manuscripts.some((m) => m.archiveId === arcId)
    );
  }, [seedArchiveIds, manuscripts]);

  // Keyboard shortcut: Press Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedModalManuscript) {
        setSelectedModalManuscript(null);
        setIsImageZoomed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedModalManuscript]);

  // Handle file selection & convert to base64
  const processFile = (file: File) => {
    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".pdf")) {
      alert("Please upload an image (PNG, JPG, WEBP) or a PDF manuscript document.");
      return;
    }

    setSelectedFile(file);
    setApiError(null);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFilePreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl("");
    setApiError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle Form Submission: Translation -> Save -> RAG Indexing
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !filePreviewUrl) {
      alert("Please upload a manuscript file first.");
      return;
    }
    if (!title.trim()) {
      alert("Please provide a title for the manuscript.");
      return;
    }

    setApiError(null);

    // ── PHASE 1: TRANSLATING WITH AI ──
    setUploadPhase("translating");

    let translatedData: {
      translation: string;
      summary: string;
      detectedLanguage?: string;
    } | null = null;

    try {
      const translateRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: filePreviewUrl,
          title: title.trim(),
          originalLanguage,
          period: period.trim(),
          region: region.trim(),
        }),
      });

      const data = await translateRes.json();
      if (!translateRes.ok) {
        throw new Error(data.error || "Failed to translate manuscript with AI.");
      }
      translatedData = data;
    } catch (err: any) {
      console.error("Translation error:", err);
      setApiError(err.message || "Translation failed. Check GEMINI_API_KEY in .env.local.");
      addToast("Translation failed", "error");
      setUploadPhase("idle");
      return;
    }

    // Prepare Manuscript Object
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const finalLanguage =
      originalLanguage !== "Unknown"
        ? originalLanguage
        : translatedData?.detectedLanguage || "Unknown";

    const newManuscript: Manuscript = {
      id: crypto.randomUUID(),
      title: title.trim(),
      classification: "MANUSCRIPT",
      originalLanguage: finalLanguage,
      period: period.trim() || "Unknown Era",
      region: region.trim() || "Unknown Region",
      description: description.trim(),
      tags: parsedTags.length > 0 ? parsedTags : ["archive", "ancient-text"],
      originalImageUrl: filePreviewUrl,
      translatedText: translatedData?.translation || "Translation pending.",
      translationSummary: translatedData?.summary || "Summary pending.",
      uploadedAt: new Date().toISOString(),
      fileType: selectedFile.type || "application/octet-stream",
      fileName: selectedFile.name,
    };

    // Save manuscript to VaultContext
    addManuscript(newManuscript);

    // ── PHASE 2: AUTOMATIC RAG VECTOR INDEXING ──
    setUploadPhase("indexing");
    let indexingSuccess = false;

    try {
      const textToEmbed = prepareDocumentText(newManuscript);
      const embedRes = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEmbed }),
      });

      const embedData = await embedRes.json();
      if (embedRes.ok && embedData.embedding && Array.isArray(embedData.embedding)) {
        const vectorDoc: VectorDocument = {
          id: newManuscript.id,
          content: textToEmbed,
          embedding: embedData.embedding,
          metadata: {
            title: newManuscript.title,
            originalLanguage: newManuscript.originalLanguage,
            period: newManuscript.period,
            region: newManuscript.region,
            tags: newManuscript.tags,
            translationSummary: newManuscript.translationSummary,
            uploadedAt: newManuscript.uploadedAt,
          },
        };
        vectorStore.addDocument(vectorDoc);
        setVectorVersion((v) => v + 1);
        indexingSuccess = true;
      } else {
        console.warn("Embedding generation warning:", embedData.error);
      }
    } catch (embedErr) {
      console.warn("Automatic RAG indexing failed:", embedErr);
    }

    setUploadPhase("idle");

    if (indexingSuccess) {
      addToast("Manuscript archived & indexed ✓", "success");
    } else {
      addToast("RAG indexing failed — manuscript saved without search", "info");
    }

    // Reset Form
    setSelectedFile(null);
    setFilePreviewUrl("");
    setTitle("");
    setOriginalLanguage("Sanskrit");
    setPeriod("");
    setRegion("");
    setDescription("");
    setTags("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Automatically switch to Library tab to view the result
    setTimeout(() => {
      setActiveTab("library");
      setLibraryFilter("curator");
    }, 1200);
  };

  // Seed Vault from Verified Institutional Repositories
  const handleSeedFromArchives = async () => {
    setIsSeeding(true);
    setSeedProgressStep(0);
    setSeedCurrentTitle("Connecting to National Archives & Institutional Portals...");
    setSeedErrors([]);

    try {
      const res = await fetch("/api/seed-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to seed institutional artifacts.");
      }

      const seededList: (Manuscript & { embedding?: number[] })[] = data.seeded || [];
      let countAdded = 0;

      for (let i = 0; i < seededList.length; i++) {
        const art = seededList[i];
        setSeedProgressStep(i + 1);
        setSeedCurrentTitle(art.title);

        const exists = manuscripts.some((m) => m.archiveId === art.archiveId || m.id === art.id);
        if (!exists) {
          addManuscript(art);
          countAdded++;
        }

        // Add to vector store
        if (art.embedding && Array.isArray(art.embedding)) {
          vectorStore.addDocument({
            id: art.id,
            content: prepareDocumentText(art),
            embedding: art.embedding,
            metadata: {
              title: art.title,
              originalLanguage: art.originalLanguage,
              period: art.period,
              region: art.region,
              tags: art.tags,
              translationSummary: art.translationSummary,
              uploadedAt: art.uploadedAt,
            },
          });
        } else {
          await indexGameArtifactInRAG(art);
        }
      }

      setVectorVersion((v) => v + 1);

      if (data.errors && data.errors.length > 0) {
        setSeedErrors(data.errors);
        addToast(`🏛️ Imported ${countAdded} artifacts (${data.errors.length} warnings)`, "info");
      } else {
        addToast("🏛️ 6 artifacts imported from National Archives", "success");
      }

      setTimeout(() => {
        setIsSeeding(false);
        setActiveTab("library");
        setLibraryFilter("institutional");
      }, 1000);
    } catch (err: any) {
      setSeedErrors([err.message || "Seeding failed"]);
      addToast(`Seeding failed: ${err.message}`, "error");
      setTimeout(() => {
        setIsSeeding(false);
      }, 2500);
    }
  };

  // Sync discovered game artifacts into Vault and RAG
  const handleSyncGameProgress = async () => {
    setIsSyncingGame(true);
    try {
      let unlockedList: string[] = gameContext?.unlockedArtifacts || [];
      try {
        const stored = localStorage.getItem("echoes_unlocked_artifacts");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            unlockedList = Array.from(new Set([...unlockedList, ...parsed]));
          }
        }
      } catch (e) {
        // ignore parse error
      }

      if (unlockedList.length === 0) {
        addToast("No artifacts found in game progress yet. Play Chapter 1 to discover artifacts!", "info");
        setIsSyncingGame(false);
        return;
      }

      const newlyAdded = syncAllGameArtifacts(unlockedList, addManuscript, manuscripts);

      if (newlyAdded.length === 0) {
        addToast("All discovered game artifacts are already synced to your vault.", "info");
        setIsSyncingGame(false);
        return;
      }

      // Index newly added game artifacts into RAG
      for (const item of newlyAdded) {
        await indexGameArtifactInRAG(item);
      }
      setVectorVersion((v) => v + 1);

      addToast(`Synced ${newlyAdded.length} new game discover${newlyAdded.length === 1 ? "y" : "ies"} to vault!`, "success");
      setActiveTab("library");
      setLibraryFilter("game");
    } catch (err: any) {
      addToast("Failed to sync game progress: " + err.message, "error");
    } finally {
      setIsSyncingGame(false);
    }
  };

  // Re-index a manuscript from modal
  const handleReindex = async (m: Manuscript) => {
    setIsReindexing(true);
    try {
      const textToEmbed = prepareDocumentText(m);
      const embedRes = await fetch("/api/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEmbed }),
      });
      const data = await embedRes.json();
      if (!embedRes.ok) {
        throw new Error(data.error || "Failed to generate embedding.");
      }

      vectorStore.addDocument({
        id: m.id,
        content: textToEmbed,
        embedding: data.embedding,
        metadata: {
          title: m.title,
          originalLanguage: m.originalLanguage,
          period: m.period,
          region: m.region,
          tags: m.tags,
          translationSummary: m.translationSummary,
          uploadedAt: m.uploadedAt,
        },
      });

      setVectorVersion((v) => v + 1);
      addToast(`"${m.title}" re-indexed successfully!`, "success");
    } catch (err: any) {
      addToast(`Re-indexing failed: ${err.message}`, "error");
    } finally {
      setIsReindexing(false);
    }
  };

  // Remove a manuscript from vault & vector store
  const handleDelete = (id: string, mTitle: string) => {
    if (confirm(`Are you sure you want to permanently remove "${mTitle}" from the Curator's Vault?`)) {
      removeManuscript(id);
      vectorStore.removeDocument(id);
      setVectorVersion((v) => v + 1);
      setSelectedModalManuscript(null);
      addToast("Manuscript removed from vault", "info");
    }
  };

  // Copy translation to clipboard
  const handleCopyTranslation = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Filter counts
  const filterCounts = useMemo(() => {
    const game = manuscripts.filter((m) => m.archiveId?.startsWith("GAME-")).length;
    const institutional = manuscripts.filter(
      (m) =>
        m.archiveId?.startsWith("ARC-") ||
        m.sourceInstitution?.toLowerCase().includes("national") ||
        m.sourceInstitution?.toLowerCase().includes("archive") ||
        m.sourceInstitution?.toLowerCase().includes("mission") ||
        m.sourceInstitution?.toLowerCase().includes("baws") ||
        m.sourceInstitution?.toLowerCase().includes("survey")
    ).length;
    const curator = manuscripts.filter(
      (m) => !m.archiveId?.startsWith("GAME-") && !m.archiveId?.startsWith("ARC-")
    ).length;
    return { all: manuscripts.length, game, institutional, curator };
  }, [manuscripts]);

  // Filtered & Sorted manuscripts list
  const filteredManuscripts = useMemo(() => {
    let list = [...manuscripts];

    if (libraryFilter === "game") {
      list = list.filter((m) => m.archiveId?.startsWith("GAME-"));
    } else if (libraryFilter === "institutional") {
      list = list.filter(
        (m) =>
          m.archiveId?.startsWith("ARC-") ||
          m.sourceInstitution?.toLowerCase().includes("national") ||
          m.sourceInstitution?.toLowerCase().includes("archive") ||
          m.sourceInstitution?.toLowerCase().includes("mission") ||
          m.sourceInstitution?.toLowerCase().includes("baws") ||
          m.sourceInstitution?.toLowerCase().includes("survey")
      );
    } else if (libraryFilter === "curator") {
      list = list.filter(
        (m) => !m.archiveId?.startsWith("GAME-") && !m.archiveId?.startsWith("ARC-")
      );
    }

    if (sortBy === "newest") {
      return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    }
    if (sortBy === "oldest") {
      return list.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
    }
    if (sortBy === "alphabetical") {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [manuscripts, libraryFilter, sortBy]);

  // Indexed count calculation
  const indexedCount = useMemo(() => {
    void vectorVersion;
    return manuscripts.filter((m) => vectorStore.hasDocument(m.id)).length;
  }, [manuscripts, vectorVersion]);

  const isPdf = selectedFile?.type === "application/pdf" || selectedFile?.name.endsWith(".pdf");

  // Classification Badge Helper
  const getClassificationBadge = (classification?: string) => {
    if (!classification) return null;
    const upper = classification.toUpperCase();
    if (upper === "CHARTER") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/50 text-blue-300 text-[10px] font-mono font-semibold">
          📜 CHARTER
        </span>
      );
    }
    if (upper === "MANUSCRIPT") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono font-semibold">
          📖 MANUSCRIPT
        </span>
      );
    }
    if (upper === "AUDIO") {
      return (
        <span className="px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[10px] font-mono font-semibold">
          🎙️ AUDIO
        </span>
      );
    }
    if (upper.includes("3D") || upper.includes("ARTIFACT")) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-semibold">
          🏺 3D ARTIFACT
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-mono">
        {classification}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FDF5E6] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Curator Repository &amp; RAG Archive
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[0.25em] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] bg-clip-text text-transparent font-[family-name:var(--font-outfit)] uppercase">
            CURATOR&apos;S VAULT
          </h1>

          <p className="text-[#FDF5E6]/70 text-sm sm:text-base font-[family-name:var(--font-inter)] tracking-wide mt-2 max-w-2xl mx-auto">
            Upload ancient manuscripts. AI will translate and preserve them in the digital archive.
          </p>

          <div className="h-px w-full max-w-lg bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mx-auto mt-6" />
        </motion.div>

        {/* ── TAB TOGGLE (UPLOAD vs LIBRARY) ── */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-8 sm:gap-12 border-b border-[#D4AF37]/20 relative">
            <button
              onClick={() => setActiveTab("upload")}
              className={`relative pb-3 pt-1 px-4 text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center gap-2 font-[family-name:var(--font-outfit)] ${
                activeTab === "upload"
                  ? "text-[#D4AF37]"
                  : "text-[#FDF5E6]/60 hover:text-[#FDF5E6]"
              }`}
            >
              <span>📤 UPLOAD</span>
              {activeTab === "upload" && (
                <motion.div
                  layoutId="vault-active-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab("library")}
              className={`relative pb-3 pt-1 px-4 text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors cursor-pointer flex items-center gap-2 font-[family-name:var(--font-outfit)] ${
                activeTab === "library"
                  ? "text-[#D4AF37]"
                  : "text-[#FDF5E6]/60 hover:text-[#FDF5E6]"
              }`}
            >
              <span>📚 LIBRARY</span>
              {manuscripts.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === "library"
                    ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
                    : "bg-white/10 text-white/70"
                }`}>
                  {manuscripts.length}
                </span>
              )}
              {activeTab === "library" && (
                <motion.div
                  layoutId="vault-active-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* ── TAB 1: UPLOAD VIEW ── */}
        {activeTab === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            {/* Secondary Seed Banner in Upload Tab */}
            {!allSeeded && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent border border-[#D4AF37]/40 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] flex-shrink-0 shadow-sm">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold font-[family-name:var(--font-outfit)] text-[#F3E5AB] uppercase tracking-wide">
                      Pre-populate Institutional Repositories
                    </h4>
                    <p className="text-xs text-[#FDF5E6]/60">
                      Import 6 verified artifacts from National Archives, ASI &amp; Gyan Bharatam
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSeedFromArchives}
                  disabled={isSeeding}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold font-[family-name:var(--font-outfit)] text-xs tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_15px_rgba(212,175,55,0.15)] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                >
                  <Archive className="w-4 h-4" />
                  <span>🏛️ SEED FROM NATIONAL ARCHIVES</span>
                </button>
              </div>
            )}

            <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-[#D4AF37]/25 shadow-[0_4px_40px_rgba(0,0,0,0.8)]">
              {/* Dropzone */}
              <div className="mb-8">
                <label className="block text-xs font-semibold tracking-widest text-[#D4AF37] uppercase font-[family-name:var(--font-outfit)] mb-3">
                  1. Select Manuscript Image or Document
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, application/pdf"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                      isDragging
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]"
                        : "border-[#D4AF37]/35 bg-white/[0.02] hover:border-[#D4AF37] hover:bg-[#D4AF37]/[0.04]"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base sm:text-lg font-semibold text-[#FDF5E6] font-[family-name:var(--font-outfit)] tracking-wide">
                        Drop your manuscript here or click to browse
                      </p>
                      <p className="text-xs text-[#FDF5E6]/50 mt-1 font-mono">
                        Supports high-resolution images (PNG, JPG, WEBP) and PDF scrolls
                      </p>
                    </div>
                    <div className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#D4AF37]/90 font-mono tracking-wider">
                      MAX FILE SIZE: 20MB
                    </div>
                  </div>
                ) : (
                  /* File Preview Area */
                  <div className="relative rounded-2xl border border-[#D4AF37]/40 bg-black/60 p-4 sm:p-6 overflow-hidden">
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-black/70 border border-[#D4AF37]/30 text-[#FDF5E6]/70 hover:text-white hover:bg-black transition-all cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-black/80 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0 shadow-inner">
                        {isPdf ? (
                          <div className="flex flex-col items-center gap-2 p-4 text-center">
                            <FileText className="w-12 h-12 text-[#D4AF37]" />
                            <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-wider">
                              PDF Document
                            </span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={filePreviewUrl}
                            alt="Manuscript Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Document Ready for Translation &amp; Indexing
                        </div>
                        <h3 className="text-lg font-bold text-[#FDF5E6] font-[family-name:var(--font-outfit)] truncate max-w-md">
                          {selectedFile.name}
                        </h3>
                        <p className="text-xs font-mono text-[#FDF5E6]/50">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || "Document"}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-[#D4AF37] hover:underline font-medium inline-block pt-1 cursor-pointer"
                        >
                          Change document
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Area */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    onSubmit={handleSubmit}
                    className="space-y-6 pt-4 border-t border-[#D4AF37]/20"
                  >
                    <div>
                      <h3 className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase font-[family-name:var(--font-outfit)] mb-4">
                        2. Manuscript Metadata &amp; Provenance
                      </h3>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#FDF5E6]/80 mb-1.5">
                        Title <span className="text-[#D4AF37]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Prajnaparamita Sutra Folio 12"
                        className="w-full rounded-xl bg-white/5 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 px-4 py-2.5 text-[#FDF5E6] text-sm outline-none transition-all placeholder:text-[#FDF5E6]/30 font-[family-name:var(--font-inter)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#FDF5E6]/80 mb-1.5 flex items-center gap-1.5">
                          <Globe2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Original Language
                        </label>
                        <select
                          value={originalLanguage}
                          onChange={(e) => setOriginalLanguage(e.target.value)}
                          className="w-full rounded-xl bg-[#141414] border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 px-4 py-2.5 text-[#FDF5E6] text-sm outline-none transition-all cursor-pointer font-[family-name:var(--font-inter)]"
                        >
                          {LANGUAGE_OPTIONS.map((lang) => (
                            <option key={lang} value={lang} className="bg-[#141414] text-[#FDF5E6]">
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#FDF5E6]/80 mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Period / Era
                        </label>
                        <input
                          type="text"
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          placeholder="e.g. 6th Century CE"
                          className="w-full rounded-xl bg-white/5 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 px-4 py-2.5 text-[#FDF5E6] text-sm outline-none transition-all placeholder:text-[#FDF5E6]/30 font-[family-name:var(--font-inter)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#FDF5E6]/80 mb-1.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Region / Origin
                        </label>
                        <input
                          type="text"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          placeholder="e.g. Nalanda, Bihar"
                          className="w-full rounded-xl bg-white/5 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 px-4 py-2.5 text-[#FDF5E6] text-sm outline-none transition-all placeholder:text-[#FDF5E6]/30 font-[family-name:var(--font-inter)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#FDF5E6]/80 mb-1.5 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Tags
                        </label>
                        <input
                          type="text"
                          value={tags}
                          onChange={(e) => setTags(e.target.value)}
                          placeholder="Comma-separated, e.g. buddhism, philosophy, sutra"
                          className="w-full rounded-xl bg-white/5 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 px-4 py-2.5 text-[#FDF5E6] text-sm outline-none transition-all placeholder:text-[#FDF5E6]/30 font-[family-name:var(--font-inter)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#FDF5E6]/80 mb-1.5">
                        Description / Curator&apos;s Notes
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter provenance, archaeological discovery context, physical condition, script type..."
                        className="w-full rounded-xl bg-white/5 border border-[#D4AF37]/30 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50 px-4 py-2.5 text-[#FDF5E6] text-sm outline-none transition-all placeholder:text-[#FDF5E6]/30 font-[family-name:var(--font-inter)] resize-none"
                      />
                    </div>

                    {/* Submit Action Button with 2-Phase Progress */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={uploadPhase !== "idle"}
                        className="w-full py-3.5 px-6 rounded-xl font-bold font-[family-name:var(--font-outfit)] tracking-wider text-black bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base uppercase"
                      >
                        {uploadPhase === "translating" ? (
                          <div className="flex items-center justify-center gap-2 animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin text-black" />
                            <span>🔮 Translating...</span>
                          </div>
                        ) : uploadPhase === "indexing" ? (
                          <div className="flex items-center justify-center gap-2 animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin text-black" />
                            <span>📡 Indexing into archive...</span>
                          </div>
                        ) : (
                          <>
                            <span>🔮</span>
                            <span>TRANSLATE &amp; ARCHIVE</span>
                          </>
                        )}
                      </button>

                      {apiError && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="truncate">{apiError}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleSubmit(e)}
                              className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800/80 text-red-100 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Retry
                            </button>
                            <button
                              type="button"
                              onClick={() => setApiError(null)}
                              className="text-red-400 hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── TAB 2: LIBRARY VIEW ── */}
        {activeTab === "library" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── STATS BAR & ACTION TOOLBAR ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl glass-panel border border-[#D4AF37]/25 mb-6">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[#FDF5E6]/80">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="font-bold text-[#D4AF37]">{manuscripts.length}</span> artifacts archived
                <span className="text-[#D4AF37]/40">•</span>
                <span className="font-bold text-emerald-400">{indexedCount}</span> indexed for search
              </div>

              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-xs text-[#FDF5E6]/60 font-mono">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg bg-black/60 border border-[#D4AF37]/30 text-xs px-3 py-1.5 text-[#FDF5E6] outline-none cursor-pointer font-mono"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>

            {/* ── SUB-FILTER PILLS & SYNC CONTROLS ── */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLibraryFilter("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    libraryFilter === "all"
                      ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                      : "bg-white/5 text-[#FDF5E6]/70 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <span>ALL</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/25">
                    {filterCounts.all}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLibraryFilter("game")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    libraryFilter === "game"
                      ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : "bg-white/5 text-[#FDF5E6]/70 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <span>🎮 GAME DISCOVERIES</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/25">
                    {filterCounts.game}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLibraryFilter("institutional")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    libraryFilter === "institutional"
                      ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                      : "bg-white/5 text-[#FDF5E6]/70 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <span>🏛️ NATIONAL ARCHIVES</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/25">
                    {filterCounts.institutional}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLibraryFilter("curator")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    libraryFilter === "curator"
                      ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                      : "bg-white/5 text-[#FDF5E6]/70 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <span>📤 CURATOR UPLOADS</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/25">
                    {filterCounts.curator}
                  </span>
                </button>
              </div>

              {/* Action Buttons: Sync Game & Seed Archives */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncGameProgress}
                  disabled={isSyncingGame}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  title="Sync discovered artifacts from Chapter 1 to the vault"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGame ? "animate-spin" : ""}`} />
                  <span>{isSyncingGame ? "Syncing Game..." : "🔄 SYNC GAME PROGRESS"}</span>
                </button>

                {!allSeeded && (
                  <button
                    type="button"
                    onClick={handleSeedFromArchives}
                    disabled={isSeeding}
                    className="px-3.5 py-2 rounded-xl border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.15)]"
                    title="Seed institutional artifacts from National Archives"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>🏛️ SEED ARCHIVES</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── EMPTY STATE & SKELETONS ── */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass-panel rounded-2xl border border-[#D4AF37]/20 overflow-hidden space-y-4 pb-5"
                  >
                    <div className="h-[200px] w-full skeleton-shimmer" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 w-3/4 rounded skeleton-shimmer" />
                      <div className="flex gap-2">
                        <div className="h-4 w-16 rounded-full skeleton-shimmer" />
                        <div className="h-4 w-20 rounded-full skeleton-shimmer" />
                      </div>
                      <div className="h-10 w-full rounded-xl skeleton-shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredManuscripts.length === 0 ? (
              <div className="relative glass-panel p-12 text-center rounded-2xl border border-[#D4AF37]/30 max-w-lg mx-auto my-12 overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                {/* CSS Decorative borders & radial glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)] pointer-events-none" />
                <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-[#D4AF37]/50" />
                <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-[#D4AF37]/50" />
                <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-[#D4AF37]/50" />
                <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-[#D4AF37]/50" />

                <BookOpen className="w-20 h-20 text-[#D4AF37]/35 mx-auto mb-4 stroke-1" />
                <h3 className="text-2xl font-bold font-[family-name:var(--font-outfit)] text-[#FDF5E6] tracking-wider mb-2">
                  {manuscripts.length === 0
                    ? "The vault is empty"
                    : "No artifacts match this filter"}
                </h3>
                <p className="text-sm text-gray-400 mb-6 font-[family-name:var(--font-inter)] leading-relaxed">
                  {manuscripts.length === 0
                    ? "Upload your first manuscript or seed verified institutional historical records to begin preserving history."
                    : "Switch back to 'ALL' to view all archived artifacts."}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {manuscripts.length === 0 && !allSeeded && (
                    <button
                      type="button"
                      onClick={handleSeedFromArchives}
                      disabled={isSeeding}
                      className="px-6 py-2.5 rounded-xl font-bold border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all tracking-wide text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                      <Archive className="w-4 h-4" />
                      <span>🏛️ SEED FROM NATIONAL ARCHIVES</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (manuscripts.length === 0) {
                        setActiveTab("upload");
                      } else {
                        setLibraryFilter("all");
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-black bg-[#D4AF37] hover:bg-[#F3E5AB] transition-colors tracking-wide text-xs uppercase cursor-pointer"
                  >
                    {manuscripts.length === 0 ? "Go to Upload" : "View All"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── RESPONSIVE GRID (1 col mobile, 2 cols tablet, 3 cols desktop) ── */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredManuscripts.map((m) => {
                  const isIndexed = vectorStore.hasDocument(m.id);
                  const isGameArtifact = m.archiveId?.startsWith("GAME-");

                  return (
                    <motion.div
                      key={m.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedModalManuscript(m)}
                      className="glass-panel rounded-2xl border border-[#D4AF37]/25 hover:border-[#D4AF37]/60 hover:shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all overflow-hidden flex flex-col cursor-pointer group"
                    >
                      {/* Thumbnail with Sepia tone */}
                      <div className="h-[200px] w-full relative overflow-hidden bg-black/80 flex items-center justify-center">
                        {m.fileType === "application/pdf" || m.fileName?.endsWith(".pdf") ? (
                          <div className="flex flex-col items-center gap-2 text-center p-4">
                            <FileText className="w-14 h-14 text-[#D4AF37]" />
                            <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">
                              PDF Manuscript
                            </span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.originalImageUrl}
                            alt={m.title}
                            className="w-full h-full object-cover sepia-[0.35] group-hover:scale-105 group-hover:sepia-0 transition-all duration-300"
                          />
                        )}

                        {/* Top Badges (Classification & RAG Status) */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                          {getClassificationBadge(m.classification)}
                        </div>

                        <div className="absolute top-3 right-3 z-10">
                          {isIndexed ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-semibold flex items-center gap-1 backdrop-blur-md shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              🔗 RAG Indexed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-semibold flex items-center gap-1 backdrop-blur-md shadow-sm">
                              ⚠️ Not Indexed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          {/* In-Game Discovery Badge */}
                          {isGameArtifact && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-semibold">
                                🎮 Discovered in Chapter 1
                              </span>
                            </div>
                          )}

                          <h3 className="text-lg font-bold font-[family-name:var(--font-outfit)] text-[#D4AF37] group-hover:text-[#F3E5AB] transition-colors truncate">
                            {m.title}
                          </h3>

                          {/* Badges: Language, Period, Region */}
                          <div className="flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-mono text-[#D4AF37]">
                              {m.originalLanguage}
                            </span>
                            {m.period && (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#FDF5E6]/70 truncate max-w-[120px]">
                                {m.period}
                              </span>
                            )}
                            {m.region && (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#FDF5E6]/70 truncate max-w-[120px]">
                                {m.region}
                              </span>
                            )}
                          </div>

                          {/* Source Institution with Clickable External Link */}
                          {m.sourceInstitution && (
                            <div className="pt-1 text-[11px] text-[#FDF5E6]/60 flex items-center gap-1 font-mono">
                              <span>Source:</span>
                              {m.sourceUrl ? (
                                <a
                                  href={m.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#D4AF37] hover:underline flex items-center gap-1 inline-flex max-w-[200px] truncate"
                                  title={`Visit ${m.sourceInstitution}`}
                                >
                                  <span className="truncate">{m.sourceInstitution}</span>
                                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                </a>
                              ) : (
                                <span className="text-[#D4AF37]/90 truncate max-w-[200px]">
                                  {m.sourceInstitution}
                                </span>
                              )}
                            </div>
                          )}

                          {/* 2-line clamped summary preview */}
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-[family-name:var(--font-inter)] pt-1">
                            {m.translationSummary || m.description || "No preview summary available."}
                          </p>
                        </div>

                        {/* Footer info: tags & date */}
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[#FDF5E6]/40 font-mono">
                          <div className="flex gap-1 overflow-hidden">
                            {m.tags?.slice(0, 2).map((t, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded border border-[#D4AF37]/20 text-[#D4AF37]/80 text-[9px]"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                          <span>
                            {new Date(m.uploadedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── MANUSCRIPT EXPANDED DETAIL MODAL ── */}
        <AnimatePresence>
          {selectedModalManuscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
              onClick={() => {
                setSelectedModalManuscript(null);
                setIsImageZoomed(false);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-panel w-full max-w-3xl rounded-2xl border border-[#D4AF37]/40 shadow-[0_10px_60px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-[#D4AF37]/20 flex items-start justify-between gap-4 bg-black/40">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getClassificationBadge(selectedModalManuscript.classification)}

                      <span className="px-2.5 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono font-semibold">
                        {selectedModalManuscript.originalLanguage}
                      </span>

                      {selectedModalManuscript.archiveId?.startsWith("GAME-") && (
                        <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold">
                          🎮 Chapter 1 Discovery
                        </span>
                      )}

                      {vectorStore.hasDocument(selectedModalManuscript.id) ? (
                        <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-medium">
                          🔗 RAG Indexed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-medium">
                          ⚠️ Not Indexed
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-outfit)] text-[#D4AF37]">
                      {selectedModalManuscript.title}
                    </h2>

                    {selectedModalManuscript.sourceInstitution && (
                      <div className="text-xs text-[#FDF5E6]/70 mt-1 flex items-center gap-1 font-mono">
                        <span>Institution:</span>
                        {selectedModalManuscript.sourceUrl ? (
                          <a
                            href={selectedModalManuscript.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D4AF37] hover:underline flex items-center gap-1 inline-flex"
                          >
                            <span>{selectedModalManuscript.sourceInstitution}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[#D4AF37]">
                            {selectedModalManuscript.sourceInstitution}
                          </span>
                        )}
                        {selectedModalManuscript.archiveId && (
                          <span className="text-[#FDF5E6]/40 ml-2">
                            ({selectedModalManuscript.archiveId})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedModalManuscript(null)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Manuscript Image Viewer with Click-to-Zoom */}
                  <div
                    onClick={() => setIsImageZoomed(!isImageZoomed)}
                    className={`relative rounded-xl overflow-hidden bg-black/80 border border-[#D4AF37]/30 cursor-pointer transition-all duration-300 ${
                      isImageZoomed ? "max-h-[600px]" : "max-h-64"
                    } flex items-center justify-center group`}
                  >
                    {selectedModalManuscript.fileType === "application/pdf" ||
                    selectedModalManuscript.fileName?.endsWith(".pdf") ? (
                      <div className="p-8 flex flex-col items-center gap-3">
                        <FileText className="w-16 h-16 text-[#D4AF37]" />
                        <span className="text-xs font-mono text-[#D4AF37]">
                          PDF Manuscript Document ({selectedModalManuscript.fileName})
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedModalManuscript.originalImageUrl}
                        alt={selectedModalManuscript.title}
                        className="w-full h-full object-contain"
                      />
                    )}

                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/75 border border-white/20 text-[11px] text-[#FDF5E6]/80 font-mono flex items-center gap-1.5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-3.5 h-3.5" />
                      {isImageZoomed ? "Click to shrink" : "Click to zoom"}
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] font-mono text-[#D4AF37] uppercase block mb-1">
                        Language
                      </span>
                      <span className="text-sm font-semibold text-[#FDF5E6]">
                        {selectedModalManuscript.originalLanguage}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] font-mono text-[#D4AF37] uppercase block mb-1">
                        Period / Era
                      </span>
                      <span className="text-sm font-semibold text-[#FDF5E6]">
                        {selectedModalManuscript.period || "Unknown"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] font-mono text-[#D4AF37] uppercase block mb-1">
                        Region
                      </span>
                      <span className="text-sm font-semibold text-[#FDF5E6]">
                        {selectedModalManuscript.region || "Unknown"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-[10px] font-mono text-[#D4AF37] uppercase block mb-1">
                        Uploaded
                      </span>
                      <span className="text-sm font-semibold text-[#FDF5E6]">
                        {formatRelativeTime(selectedModalManuscript.uploadedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedModalManuscript.tags && selectedModalManuscript.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs text-[#D4AF37] font-mono mr-1">Tags:</span>
                      {selectedModalManuscript.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-mono text-[#FDF5E6]/80"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Translation Summary */}
                  {selectedModalManuscript.translationSummary && (
                    <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30">
                      <h4 className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Translation Summary
                      </h4>
                      <p className="text-sm text-[#FDF5E6] font-[family-name:var(--font-inter)] leading-relaxed">
                        {selectedModalManuscript.translationSummary}
                      </p>
                    </div>
                  )}

                  {/* Complete Translated Text (Parchment Styled Card) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#D4AF37]" />
                        Complete English Translation
                      </h4>
                      <button
                        onClick={() => handleCopyTranslation(selectedModalManuscript.translatedText)}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-[#D4AF37]/30 text-xs font-mono text-[#D4AF37] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <span>📋</span>
                            <span>Copy Translation</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-6 rounded-xl bg-[#FDF5E6]/5 border border-[#D4AF37]/25 text-[#FDF5E6] font-[family-name:var(--font-inter)] leading-relaxed text-sm whitespace-pre-wrap shadow-inner max-h-72 overflow-y-auto">
                      {selectedModalManuscript.translatedText}
                    </div>
                  </div>

                  {/* Curator Description */}
                  {selectedModalManuscript.description && (
                    <div>
                      <h4 className="text-xs font-mono text-[#D4AF37]/80 uppercase tracking-wider font-bold mb-1">
                        Curator Notes
                      </h4>
                      <p className="text-xs text-[#FDF5E6]/70 leading-relaxed font-[family-name:var(--font-inter)]">
                        {selectedModalManuscript.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="p-4 sm:p-6 border-t border-[#D4AF37]/20 bg-black/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* View Full Page Link */}
                    <Link
                      href={`/search/${selectedModalManuscript.id}`}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37]/20 to-[#F3E5AB]/20 hover:from-[#D4AF37]/35 hover:to-[#F3E5AB]/35 border border-[#D4AF37]/40 text-xs font-mono font-bold text-[#F3E5AB] flex items-center gap-1.5 transition-all"
                    >
                      <span>View Full Page →</span>
                    </Link>

                    {/* Re-Index Button */}
                    <button
                      onClick={() => handleReindex(selectedModalManuscript)}
                      disabled={isReindexing}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono font-semibold text-gray-300 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? "animate-spin" : ""}`} />
                      {isReindexing ? "Indexing..." : "🔄 Re-Index"}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(selectedModalManuscript.id, selectedModalManuscript.title)}
                      className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-xs font-mono text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🗑️</span>
                      <span>Remove from Vault</span>
                    </button>

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedModalManuscript(null)}
                      className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SEEDING PROGRESS MODAL OVERLAY ── */}
        <AnimatePresence>
          {isSeeding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="glass-panel w-full max-w-md p-8 rounded-2xl border border-[#D4AF37]/50 shadow-[0_0_50px_rgba(212,175,55,0.25)] text-center space-y-5"
              >
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                  <Archive className="w-8 h-8 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-[family-name:var(--font-outfit)] text-[#F3E5AB] tracking-wide">
                    Importing from Verified Institutional Repository...
                  </h3>
                  <p className="text-xs text-gray-300 font-mono">
                    {seedProgressStep > 0
                      ? `Importing artifact ${seedProgressStep}/6: ${seedCurrentTitle}`
                      : seedCurrentTitle}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B]"
                    animate={{ width: `${Math.max(8, (seedProgressStep / 6) * 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#D4AF37]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing metadata, AI translations &amp; RAG vectors...</span>
                </div>

                {seedErrors.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-left space-y-1">
                    <div className="font-semibold text-red-200">Warnings/Errors:</div>
                    {seedErrors.map((err, idx) => (
                      <div key={idx} className="truncate">• {err}</div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
