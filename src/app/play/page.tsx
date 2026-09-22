"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "../../store/GameContext";
import GameHUD from "../../components/game/HUD";
import dynamic from "next/dynamic";
import IntroCinematic from "../../components/game/IntroCinematic";

const Scene3D = dynamic(() => import("../../components/game/Scene3D"), { ssr: false });
const ModernLibraryScene3D = dynamic(() => import("../../components/game/ModernLibraryScene3D"), { ssr: false });
import CodexUI from "../../components/game/CodexUI";
import PuzzleOverlay from "../../components/game/PuzzleOverlay";
import ArtifactViewer from "../../components/game/ArtifactViewer";
import VictoryScreen from "../../components/game/VictoryScreen";
import DialoguePanel from "../../components/game/DialoguePanel";

function GameEngine() {
  const { currentLevel, codexActive, puzzleActive, artifactViewActive, isCompleted } = useGame();

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {currentLevel === "portal" && (
        <IntroCinematic />
      )}

      {currentLevel !== "portal" && (
        <>
          {/* 3D WebGL Canvas with distinct keys to prevent hook count mismatch across dynamic scene components */}
          <div className="absolute inset-0 z-0">
            {currentLevel === "modern_library" ? (
              <ModernLibraryScene3D key="scene-modern-library" />
            ) : (
              <Scene3D key="scene-nalanda" />
            )}
          </div>

          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/50 rounded-full z-10 pointer-events-none mix-blend-difference" />

          {/* 2D UI Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {currentLevel === "nalanda" && <GameHUD />}
          </div>

          {/* Modals & Overlays (pointer-events-auto to capture clicks) with unique keys for AnimatePresence */}
          <AnimatePresence>
            {codexActive && (
              <motion.div
                key="overlay-codex"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 pointer-events-auto bg-black/80 backdrop-blur-sm"
              >
                <CodexUI />
              </motion.div>
            )}
            {puzzleActive && (
              <motion.div
                key="overlay-puzzle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 pointer-events-auto bg-black/90 backdrop-blur-md"
              >
                <PuzzleOverlay />
              </motion.div>
            )}
            {artifactViewActive && (
              <motion.div
                key="overlay-artifact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 pointer-events-auto bg-black/80 backdrop-blur-sm"
              >
                <ArtifactViewer />
              </motion.div>
            )}
            {isCompleted && (
              <motion.div
                key="overlay-victory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 pointer-events-auto bg-black/95"
              >
                <VictoryScreen />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dialogue panel handles its own internal AnimatePresence */}
          <DialoguePanel />
        </>
      )}
    </div>
  );
}

export default function PlayPage() {
  return <GameEngine />;
}
