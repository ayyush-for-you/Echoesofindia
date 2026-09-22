"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type ArtifactId = "manuscript_1" | "manuscript_2" | "manuscript_3" | "seal";

export type GameLevel = "modern_library" | "portal" | "nalanda";

interface GameState {
  currentLevel: GameLevel;
  setLevel: (level: GameLevel) => void;
  xp: number;
  unlockedArtifacts: ArtifactId[];
  unlockedEchoes: string[];
  currentObjective: string;
  fragmentsFound: number;
  puzzleActive: string | null;
  artifactViewActive: ArtifactId | null;
  codexActive: boolean;
  isCompleted: boolean;
  // Dialogue system
  dialogueOpen: boolean;
  dialogueSpeaker: string;
  dialogueLines: string[];
  dialogueLineIndex: number;
  // Actions
  addXp: (amount: number) => void;
  unlockArtifact: (id: ArtifactId) => void;
  unlockEcho: (id: string) => void;
  setObjective: (objective: string) => void;
  incrementFragments: () => void;
  setPuzzleActive: (puzzle: string | null) => void;
  setArtifactViewActive: (artifact: ArtifactId | null) => void;
  setCodexActive: (active: boolean) => void;
  completeChapter: () => void;
  openDialogue: (speaker: string, lines: string[], onComplete?: () => void) => void;
  advanceDialogue: () => void;
  closeDialogue: () => void;
}

const defaultState: GameState = {
  currentLevel: "modern_library",
  setLevel: () => {},
  xp: 0,
  unlockedArtifacts: [],
  unlockedEchoes: [],
  currentObjective: "Speak to the Elder Monk at the desk.",
  fragmentsFound: 0,
  puzzleActive: null,
  artifactViewActive: null,
  codexActive: false,
  isCompleted: false,
  dialogueOpen: false,
  dialogueSpeaker: "",
  dialogueLines: [],
  dialogueLineIndex: 0,
  addXp: () => {},
  unlockArtifact: () => {},
  unlockEcho: () => {},
  setObjective: () => {},
  incrementFragments: () => {},
  setPuzzleActive: () => {},
  setArtifactViewActive: () => {},
  setCodexActive: () => {},
  completeChapter: () => {},
  openDialogue: () => {},
  advanceDialogue: () => {},
  closeDialogue: () => {},
};

const GameContext = createContext<GameState>(defaultState);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentLevel, setLevel] = useState<GameLevel>("modern_library");
  const [xp, setXp] = useState(0);
  const [unlockedArtifacts, setUnlockedArtifacts] = useState<ArtifactId[]>([]);
  const [unlockedEchoes, setUnlockedEchoes] = useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = useState("Speak to the Elder Monk at the desk.");
  const [fragmentsFound, setFragmentsFound] = useState(0);
  const [puzzleActive, setPuzzleActive] = useState<string | null>(null);
  const [artifactViewActive, setArtifactViewActive] = useState<ArtifactId | null>(null);
  const [codexActive, setCodexActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Dialogue state
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [dialogueSpeaker, setDialogueSpeaker] = useState("");
  const [dialogueLines, setDialogueLines] = useState<string[]>([]);
  const [dialogueLineIndex, setDialogueLineIndex] = useState(0);
  // Store callback as a ref-style state to avoid the lazy-init pitfall
  const [dialogueOnComplete, setDialogueOnComplete] = useState<(() => void) | null>(null);

  const addXp = (amount: number) => setXp((prev) => prev + amount);

  const unlockArtifact = (id: ArtifactId) => {
    setUnlockedArtifacts((prev) => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
  };

  const unlockEcho = (id: string) => {
    setUnlockedEchoes((prev) => {
      if (!prev.includes(id)) return [...prev, id];
      return prev;
    });
  };

  const incrementFragments = () => setFragmentsFound((prev) => prev + 1);
  const completeChapter = () => setIsCompleted(true);

  const openDialogue = (speaker: string, lines: string[], onComplete?: () => void) => {
    setDialogueSpeaker(speaker);
    setDialogueLines(lines);
    setDialogueLineIndex(0);
    // Store function via functional setter pattern to avoid React treating it as lazy init
    setDialogueOnComplete(() => onComplete ?? null);
    setDialogueOpen(true);
  };

  const advanceDialogue = () => {
    setDialogueLineIndex((prev) => {
      const isLast = prev >= dialogueLines.length - 1;
      if (isLast) {
        setDialogueOpen(false);
        // Call onComplete after state settles
        setTimeout(() => {
          setDialogueOnComplete((cb) => {
            cb?.();
            return null;
          });
        }, 0);
        return 0;
      }
      return prev + 1;
    });
  };

  const closeDialogue = () => {
    setDialogueOpen(false);
    setDialogueOnComplete((cb) => {
      cb?.();
      return null;
    });
  };

  return (
    <GameContext.Provider
      value={{
        currentLevel,
        setLevel,
        xp,
        unlockedArtifacts,
        unlockedEchoes,
        currentObjective,
        fragmentsFound,
        puzzleActive,
        artifactViewActive,
        codexActive,
        isCompleted,
        dialogueOpen,
        dialogueSpeaker,
        dialogueLines,
        dialogueLineIndex,
        addXp,
        unlockArtifact,
        unlockEcho,
        setObjective: setCurrentObjective,
        incrementFragments,
        setPuzzleActive,
        setArtifactViewActive,
        setCodexActive,
        completeChapter,
        openDialogue,
        advanceDialogue,
        closeDialogue,
      } as any}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
