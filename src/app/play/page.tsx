"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameProvider, useGame } from "../../store/GameContext";
import GameHUD from "../../components/game/HUD";
import Scene3D from "../../components/game/Scene3D";
import IntroCinematic from "../../components/game/IntroCinematic";
import CodexUI from "../../components/game/CodexUI";
import PuzzleOverlay from "../../components/game/PuzzleOverlay";
import ArtifactViewer from "../../components/game/ArtifactViewer";
import VictoryScreen from "../../components/game/VictoryScreen";
import DialoguePanel from "../../components/game/DialoguePanel";

function GameEngine() {
  const [introFinished, setIntroFinished] = useState(false);
  const { codexActive, puzzleActive, artifactViewActive, isCompleted } = useGame();

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {!introFinished ? (
        <IntroCinematic onComplete={() => setIntroFinished(true)} />
      ) : (
        <>
          {/* 3D WebGL Canvas */}
          <div className="absolute inset-0 z-0">
            <Scene3D />
          </div>

          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/50 rounded-full z-10 pointer-events-none mix-blend-difference" />

          {/* 2D UI Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <GameHUD />
          </div>

          {/* Modals & Overlays (pointer-events-auto to capture clicks) */}
          <AnimatePresence>
            {codexActive && (
              <div className="absolute inset-0 z-50 pointer-events-auto bg-black/80 backdrop-blur-sm">
                <CodexUI />
              </div>
            )}
            {puzzleActive && (
              <div className="absolute inset-0 z-40 pointer-events-auto bg-black/90 backdrop-blur-md">
                <PuzzleOverlay />
              </div>
            )}
            {artifactViewActive && (
              <div className="absolute inset-0 z-40 pointer-events-auto bg-black/80 backdrop-blur-sm">
                <ArtifactViewer />
              </div>
            )}
            <DialoguePanel />
            {isCompleted && (
              <div className="absolute inset-0 z-50 pointer-events-auto bg-black/95">
                <VictoryScreen />
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <GameProvider>
      <GameEngine />
    </GameProvider>
  );
}
