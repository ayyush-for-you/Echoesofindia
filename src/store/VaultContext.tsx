"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Manuscript } from "../types/manuscript";

const STORAGE_KEY = "echoes_vault_manuscripts";

interface VaultContextType {
  manuscripts: Manuscript[];
  isLoading: boolean;
  addManuscript: (manuscript: Manuscript) => void;
  removeManuscript: (id: string) => void;
  getManuscript: (id: string) => Manuscript | undefined;
  searchManuscripts: (query: string) => Manuscript[];
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Safely hydrate state from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setManuscripts(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load manuscripts from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addManuscript = useCallback((manuscript: Manuscript) => {
    setManuscripts((prev) => {
      const updated = [manuscript, ...prev.filter((m) => m.id !== manuscript.id)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to persist manuscript to localStorage:", error);
      }
      return updated;
    });
  }, []);

  const removeManuscript = useCallback((id: string) => {
    setManuscripts((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to remove manuscript from localStorage:", error);
      }
      return updated;
    });
  }, []);

  const getManuscript = useCallback(
    (id: string): Manuscript | undefined => {
      return manuscripts.find((m) => m.id === id);
    },
    [manuscripts]
  );

  const searchManuscripts = useCallback(
    (query: string): Manuscript[] => {
      if (!query || !query.trim()) {
        return manuscripts;
      }
      const lower = query.toLowerCase().trim();

      return manuscripts.filter((m) => {
        const titleMatch = m.title?.toLowerCase().includes(lower);
        const descMatch = m.description?.toLowerCase().includes(lower);
        const langMatch = m.originalLanguage?.toLowerCase().includes(lower);
        const periodMatch = m.period?.toLowerCase().includes(lower);
        const regionMatch = m.region?.toLowerCase().includes(lower);
        const translatedMatch = m.translatedText?.toLowerCase().includes(lower);
        const summaryMatch = m.translationSummary?.toLowerCase().includes(lower);
        const tagsMatch = m.tags?.some((t) => t.toLowerCase().includes(lower));

        return (
          titleMatch ||
          descMatch ||
          langMatch ||
          periodMatch ||
          regionMatch ||
          translatedMatch ||
          summaryMatch ||
          tagsMatch
        );
      });
    },
    [manuscripts]
  );

  return (
    <VaultContext.Provider
      value={{
        manuscripts,
        isLoading,
        addManuscript,
        removeManuscript,
        getManuscript,
        searchManuscripts,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextType {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
