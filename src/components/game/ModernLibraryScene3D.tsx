"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { useGame } from "../../store/GameContext";

// ─────────────────────────────────────────────────────────────────────────────
// PROCEDURAL TEXTURE GENERATORS (SSR-SAFE)
// ─────────────────────────────────────────────────────────────────────────────

function createBookCoverTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture(null as any);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // Antique dark brown/cordovan leather background
  const grad = ctx.createRadialGradient(512, 512, 80, 512, 512, 650);
  grad.addColorStop(0, "#4e2613");
  grad.addColorStop(0.55, "#331609");
  grad.addColorStop(0.85, "#1f0c05");
  grad.addColorStop(1, "#120602");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle leather texture noise
  for (let i = 0; i < 7000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const alpha = Math.random() * 0.07;
    ctx.fillStyle = `rgba(255, 210, 160, ${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Worn leather corner scuffs
  const corners = [
    [0, 0],
    [1024, 0],
    [0, 1024],
    [1024, 1024],
  ];
  for (const [cx, cy] of corners) {
    const cgrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 200);
    cgrad.addColorStop(0, "rgba(220, 175, 110, 0.35)");
    cgrad.addColorStop(1, "transparent");
    ctx.fillStyle = cgrad;
    ctx.fillRect(0, 0, 1024, 1024);
  }

  // Heavy gold embossed outer border
  ctx.save();
  ctx.strokeStyle = "#ecc258";
  ctx.lineWidth = 14;
  ctx.strokeRect(55, 55, 914, 914);

  // Inner gold filigree border
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#d4a940";
  ctx.strokeRect(85, 85, 854, 854);

  // Corner decorative flourishes
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#f5d275";
  const cSize = 75;
  ctx.strokeRect(65, 65, cSize, cSize);
  ctx.strokeRect(1024 - 65 - cSize, 65, cSize, cSize);
  ctx.strokeRect(65, 1024 - 65 - cSize, cSize, cSize);
  ctx.strokeRect(1024 - 65 - cSize, 1024 - 65 - cSize, cSize, cSize);

  // Central Sacred Glowing "ॐ" (Om)
  ctx.font = "bold 250px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#ffaa22";
  ctx.shadowBlur = 35;
  ctx.fillStyle = "#ffedaa";
  ctx.fillText("ॐ", 512, 465);

  // Sanskrit Devanagari lettering
  ctx.font = "bold 44px serif";
  ctx.fillStyle = "#f5d061";
  ctx.shadowBlur = 14;
  ctx.fillText("प्रज्ञापारमिता सूत्रम्", 512, 675);

  ctx.font = "italic 26px serif";
  ctx.fillStyle = "#cca245";
  ctx.shadowBlur = 6;
  ctx.fillText("THE PRAJNAPARAMITA SUTRA • NALANDA", 512, 735);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createBookPagesTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture(null as any);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e5cfab";
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 2) {
    ctx.fillStyle = y % 4 === 0 ? "#b89a6c" : "#dfc69e";
    ctx.fillRect(0, y, 256, 1.2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function createBookshelfTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture(null as any);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1c1008";
  ctx.fillRect(0, 0, 1024, 1024);

  const rows = 4;
  const rowHeight = 1024 / rows;
  const shelfThickness = 24;

  const bookSpineColors = [
    "#75211a", "#942a1e", "#1f3f2a", "#2e563a",
    "#193659", "#244c7d", "#4d2f19", "#6e4325",
    "#3f2618", "#612d16", "#754c27", "#271a13",
    "#873f1d", "#572033", "#204441", "#694c30"
  ];

  for (let r = 0; r < rows; r++) {
    const yTop = r * rowHeight;
    const yBottom = yTop + rowHeight - shelfThickness;

    let x = 8;
    while (x < 1012) {
      const bookWidth = 14 + Math.floor(Math.sin(x * 11 + r * 7) * 7 + 14);
      const bookHeight = (rowHeight - shelfThickness) * (0.83 + Math.cos(x * 5.3) * 0.14);
      const color = bookSpineColors[(Math.floor(x * 4.3 + r * 7)) % bookSpineColors.length];
      const y = yBottom - bookHeight;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, bookWidth, bookHeight);

      const grad = ctx.createLinearGradient(x, 0, x + bookWidth, 0);
      grad.addColorStop(0, "rgba(0,0,0,0.5)");
      grad.addColorStop(0.3, "rgba(255,255,255,0.18)");
      grad.addColorStop(0.7, "rgba(255,255,255,0.06)");
      grad.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, bookWidth, bookHeight);

      ctx.fillStyle = "rgba(235, 195, 75, 0.85)";
      const ribs = 3 + (bookWidth % 3);
      for (let rib = 1; rib <= ribs; rib++) {
        const ry = y + (bookHeight / (ribs + 1)) * rib;
        ctx.fillRect(x + 2, ry, bookWidth - 4, 2.5);
      }

      x += bookWidth + 2;
    }

    const woodGrad = ctx.createLinearGradient(0, yBottom, 0, yBottom + shelfThickness);
    woodGrad.addColorStop(0, "#4a2a16");
    woodGrad.addColorStop(0.4, "#361e10");
    woodGrad.addColorStop(1, "#1c0d06");
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, yBottom, 1024, shelfThickness);

    ctx.fillStyle = "rgba(215, 178, 58, 0.4)";
    ctx.fillRect(0, yBottom, 1024, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWoodDeskTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture(null as any);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#3e2213";
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 140; i++) {
    const y = (i / 140) * 1024;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(32, 16, 8, 0.6)" : "rgba(80, 45, 24, 0.45)";
    ctx.lineWidth = 3 + (i % 3) * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(340, y + Math.sin(i * 0.7) * 20, 700, y - Math.cos(i * 0.8) * 18, 1024, y);
    ctx.stroke();
  }

  const sheen = ctx.createRadialGradient(512, 512, 50, 512, 512, 600);
  sheen.addColorStop(0, "rgba(220, 130, 50, 0.2)");
  sheen.addColorStop(0.6, "rgba(160, 80, 25, 0.1)");
  sheen.addColorStop(1, "rgba(20, 10, 5, 0.4)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createManuscriptPageTexture(): THREE.CanvasTexture {
  if (typeof document === "undefined") {
    return new THREE.CanvasTexture(null as any);
  }
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#eddab5";
  ctx.fillRect(0, 0, 512, 512);

  const edge = ctx.createRadialGradient(256, 256, 140, 256, 256, 256);
  edge.addColorStop(0, "transparent");
  edge.addColorStop(0.8, "rgba(130, 80, 30, 0.25)");
  edge.addColorStop(1, "rgba(70, 35, 12, 0.6)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, 512, 512);

  ctx.fillStyle = "#3e2412";
  for (let l = 0; l < 13; l++) {
    const y = 65 + l * 30;
    ctx.fillRect(50, y, 412, 2.5);
    for (let w = 0; w < 9; w++) {
      ctx.fillRect(55 + w * 45 + (l % 4) * 4, y - 6, 26 + (w % 4) * 3, 5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS ON READING TABLE (MATCHING THE USER'S PHOTO VIEW)
// ─────────────────────────────────────────────────────────────────────────────

function AncientManuscriptBook({
  coverTex,
  pagesTex,
  canReadBook,
  onInteract,
}: {
  coverTex: THREE.CanvasTexture;
  pagesTex: THREE.CanvasTexture;
  canReadBook: boolean;
  onInteract: () => void;
}) {
  const bookRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (canReadBook && bookRef.current) {
      const t = state.clock.elapsedTime;
      bookRef.current.position.y = 0.92 + Math.sin(t * 2.5) * 0.005;
    }
  });

  return (
    <group
      ref={bookRef}
      position={[0.0, 0.92, 0.15]}
      rotation={[-0.1, 0.15, 0]}
      onClick={onInteract}
    >
      {/* Top Leather Board with Gold Embossing */}
      <mesh position={[0, 0.075, 0]}>
        <boxGeometry args={[0.74, 0.028, 1.02]} />
        <meshStandardMaterial
          map={coverTex}
          roughness={0.4}
          metalness={0.25}
        />
      </mesh>

      {/* Pages Block */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.7, 0.075, 0.96]} />
        <meshStandardMaterial map={pagesTex} roughness={0.7} color="#f0dfc0" />
      </mesh>

      {/* Bottom Leather Board */}
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[0.74, 0.028, 1.02]} />
        <meshStandardMaterial color="#221008" roughness={0.6} />
      </mesh>

      {/* Curved Leather Spine */}
      <mesh position={[-0.35, 0.035, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 1.02, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#2d150b" roughness={0.5} />
      </mesh>

      {/* Golden Radiance on Book */}
      <pointLight
        position={[0, 0.35, 0]}
        color="#ffcc66"
        intensity={canReadBook ? 4.5 : 2.2}
        distance={4.0}
        decay={2}
      />

      {/* Aura Sparkles when ready to open */}
      {canReadBook && (
        <>
          <Sparkles
            count={45}
            scale={[1.0, 0.6, 1.2]}
            position={[0, 0.25, 0]}
            size={2.8}
            speed={0.4}
            color="#ffdd77"
            opacity={0.85}
          />
          <mesh position={[0, 0.095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.78, 1.05]} />
            <meshBasicMaterial
              color="#ffaa33"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

function DeskLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Heavy circular brass base */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.16, 0.19, 0.06, 32]} />
        <meshStandardMaterial color="#b38438" roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Brass column */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.028, 0.038, 0.6, 16]} />
        <meshStandardMaterial color="#c99742" roughness={0.25} metalness={0.88} />
      </mesh>

      {/* Curved brass arm */}
      <mesh position={[0.14, 0.7, 0]} rotation={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.025, 0.025, 0.28, 16]} />
        <meshStandardMaterial color="#c99742" roughness={0.25} metalness={0.88} />
      </mesh>

      {/* Conical Amber Warm Lamp Shade */}
      <mesh position={[0.22, 0.68, 0]} rotation={[0, 0, -0.18]}>
        <cylinderGeometry args={[0.13, 0.33, 0.33, 32, 1, true]} />
        <meshStandardMaterial
          color="#ff9933"
          emissive="#d46011"
          emissiveIntensity={0.85}
          roughness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glowing light bulb inside */}
      <mesh position={[0.22, 0.62, 0]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshBasicMaterial color="#fff4d0" />
      </mesh>

      {/* Primary Warm Desk Lamp Light illuminating the desk */}
      <pointLight
        position={[0.22, 0.58, 0]}
        color="#ffaa44"
        intensity={7.0}
        distance={8.0}
        decay={1.8}
      />
    </group>
  );
}

function DeskAccessories({
  manuscriptTex,
}: {
  manuscriptTex: THREE.CanvasTexture;
}) {
  return (
    <group>
      {/* Inkwell Bottle */}
      <group position={[0.55, 0.9, 0.22]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
          <meshStandardMaterial color="#1a1510" roughness={0.15} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
          <meshStandardMaterial color="#b38438" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>

      {/* Brass Fountain Stylus Pen */}
      <mesh
        position={[0.58, 0.915, 0.36]}
        rotation={[0, 0.35, 0]}
      >
        <cylinderGeometry args={[0.009, 0.009, 0.3, 12]} />
        <meshStandardMaterial color="#c49341" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Open Parchment Manuscript Sheet */}
      <mesh
        position={[0.42, 0.905, -0.1]}
        rotation={[-Math.PI / 2, 0, 0.12]}
      >
        <planeGeometry args={[0.38, 0.28]} />
        <meshStandardMaterial map={manuscriptTex} roughness={0.75} />
      </mesh>

      {/* Secondary Closed Dark Tome to the far right */}
      <mesh
        position={[0.95, 0.92, 0.05]}
        rotation={[0, -0.2, 0]}
      >
        <boxGeometry args={[0.48, 0.08, 0.7]} />
        <meshStandardMaterial color="#1f1109" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAND CATHEDRAL LIBRARY ARCHITECTURE (BACKGROUND & MEZZANINE)
// ─────────────────────────────────────────────────────────────────────────────

function GrandLibraryHall({
  shelfTex,
  woodTex,
}: {
  shelfTex: THREE.CanvasTexture;
  woodTex: THREE.CanvasTexture;
}) {
  return (
    <group>
      {/* Parquet Wood Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -15]}>
        <planeGeometry args={[30, 75]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.55}
          metalness={0.1}
          color="#422515"
        />
      </mesh>

      {/* Vaulted Gothic Timber Ceiling */}
      <mesh position={[0, 14.5, -15]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[12, 12, 75, 36, 1, false, 0, Math.PI]} />
        <meshStandardMaterial
          color="#16202c"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Gothic Ceiling Arches & Pillars */}
      {[-33, -21, -9, 3, 15].map((z, idx) => (
        <group key={`arch-${idx}`}>
          <mesh position={[0, 14.4, z]}>
            <torusGeometry args={[11.9, 0.4, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#1a120b" roughness={0.85} />
          </mesh>
          <mesh position={[-11.8, 7.2, z]}>
            <cylinderGeometry args={[0.45, 0.55, 14.5, 16]} />
            <meshStandardMaterial color="#21160e" roughness={0.88} />
          </mesh>
          <mesh position={[11.8, 7.2, z]}>
            <cylinderGeometry args={[0.45, 0.55, 14.5, 16]} />
            <meshStandardMaterial color="#21160e" roughness={0.88} />
          </mesh>
        </group>
      ))}

      {/* Ground-Floor Bookshelves (Left & Right) */}
      <mesh position={[-9.5, 2.75, -15]}>
        <boxGeometry args={[3.0, 5.5, 72]} />
        <meshStandardMaterial map={shelfTex} roughness={0.7} />
      </mesh>
      <mesh position={[9.5, 2.75, -15]}>
        <boxGeometry args={[3.0, 5.5, 72]} />
        <meshStandardMaterial map={shelfTex} roughness={0.7} />
      </mesh>

      {/* Mezzanine Balconies (Left & Right) */}
      <group position={[-7.8, 5.5, -15]}>
        <mesh>
          <boxGeometry args={[3.4, 0.3, 72]} />
          <meshStandardMaterial color="#22140c" roughness={0.85} />
        </mesh>
        <mesh position={[1.5, 1.0, 0]}>
          <boxGeometry args={[0.15, 0.12, 72]} />
          <meshStandardMaterial color="#140b06" roughness={0.9} />
        </mesh>
      </group>

      <group position={[7.8, 5.5, -15]}>
        <mesh>
          <boxGeometry args={[3.4, 0.3, 72]} />
          <meshStandardMaterial color="#22140c" roughness={0.85} />
        </mesh>
        <mesh position={[-1.5, 1.0, 0]}>
          <boxGeometry args={[0.15, 0.12, 72]} />
          <meshStandardMaterial color="#140b06" roughness={0.9} />
        </mesh>
      </group>

      {/* Upper-Tier Bookshelves */}
      <mesh position={[-9.5, 8.5, -15]}>
        <boxGeometry args={[3.0, 5.5, 72]} />
        <meshStandardMaterial map={shelfTex} roughness={0.75} />
      </mesh>
      <mesh position={[9.5, 8.5, -15]}>
        <boxGeometry args={[3.0, 5.5, 72]} />
        <meshStandardMaterial map={shelfTex} roughness={0.75} />
      </mesh>

      {/* Hanging Pendant Globe Chandeliers down Central Nave */}
      {[-26, -14, -2, 10].map((z, idx) => (
        <group key={`pendant-${idx}`} position={[0, 9.0, z]}>
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 4.5]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.18, 0.1, 0.12, 16]} />
            <meshStandardMaterial color="#c99742" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.38, 24, 24]} />
            <meshBasicMaterial color="#ffe6b3" />
          </mesh>
          <pointLight
            position={[0, -0.2, 0]}
            color="#ffbe66"
            intensity={4.0}
            distance={20}
            decay={1.6}
          />
        </group>
      ))}

      {/* Distant background reading tables */}
      <group position={[0, 0, -8]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[4.5, 0.08, 1.6]} />
          <meshStandardMaterial color="#2d170b" roughness={0.65} />
        </mesh>
        <DeskLamp position={[-1.4, 0.92, 0]} />
        <DeskLamp position={[1.4, 0.92, 0]} />
      </group>

      <group position={[0, 0, -20]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[4.5, 0.08, 1.6]} />
          <meshStandardMaterial color="#2d170b" roughness={0.65} />
        </mesh>
        <DeskLamp position={[-1.4, 0.92, 0]} />
        <DeskLamp position={[1.4, 0.92, 0]} />
      </group>

      {/* Distant Cathedral Wall with Gothic Window */}
      <group position={[0, 7.5, -45]}>
        <mesh>
          <boxGeometry args={[26, 16, 1]} />
          <meshStandardMaterial color="#151b24" roughness={0.9} />
        </mesh>
        <mesh position={[0, 2, 0.55]}>
          <planeGeometry args={[6, 10]} />
          <meshBasicMaterial color="#1b2a3d" />
        </mesh>
        <pointLight
          position={[0, 3, -1]}
          color="#335577"
          intensity={2.2}
          distance={28}
        />
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOREGROUND READING DESK COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function ForegroundReadingDesk({
  coverTex,
  pagesTex,
  woodTex,
  manuscriptTex,
  onInteract,
}: {
  coverTex: THREE.CanvasTexture;
  pagesTex: THREE.CanvasTexture;
  woodTex: THREE.CanvasTexture;
  manuscriptTex: THREE.CanvasTexture;
  onInteract: () => void;
}) {
  const { currentObjective, dialogueOpen } = useGame();
  const canReadBook = currentObjective === "Open the Prajnaparamita Sutra on the desk.";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && !dialogueOpen) {
        onInteract();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogueOpen, onInteract]);

  return (
    <group position={[0, 0, 0]}>
      {/* Heavy Antique Wooden Reading Table Top */}
      <mesh position={[0, 0.88, 0.15]}>
        <boxGeometry args={[4.2, 0.08, 1.7]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.4}
          metalness={0.12}
          color="#522f18"
        />
      </mesh>

      {/* Raised Back Wooden Ridge / Book-rest Edge */}
      <mesh position={[0, 1.02, -0.65]}>
        <boxGeometry args={[4.2, 0.2, 0.08]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.4}
          metalness={0.12}
          color="#422513"
        />
      </mesh>

      {/* Wooden Table Legs */}
      {[-1.9, 1.9].map((x) =>
        [-0.55, 0.85].map((z) => (
          <mesh key={`leg-${x}-${z}`} position={[x, 0.44, z]}>
            <boxGeometry args={[0.14, 0.88, 0.14]} />
            <meshStandardMaterial color="#2d170c" roughness={0.7} />
          </mesh>
        ))
      )}

      {/* Classic Brass Study Lamp on Left */}
      <DeskLamp position={[-1.1, 0.9, 0.15]} />

      {/* The Glowing Prajnaparamita Sutra in Center */}
      <AncientManuscriptBook
        coverTex={coverTex}
        pagesTex={pagesTex}
        canReadBook={canReadBook}
        onInteract={onInteract}
      />

      {/* Inkwell, Stylus Pen, and Open Manuscript */}
      <DeskAccessories manuscriptTex={manuscriptTex} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMOOTH CAMERA & EXPLORATION CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

function PlayerSeatedController() {
  const { camera } = useThree();
  const { dialogueOpen, codexActive, puzzleActive, artifactViewActive, isCompleted } =
    useGame();

  const moveSpeed = 0.06;
  const sprintSpeed = 0.12;

  const movement = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  // Camera framing: seated comfortably at the desk, looking down the grand library
  useEffect(() => {
    camera.position.set(0.0, 1.38, 1.45);
    camera.lookAt(0.0, 1.05, -1.8);
  }, [camera]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": movement.current.forward = true; break;
        case "KeyS": movement.current.backward = true; break;
        case "KeyA": movement.current.left = true; break;
        case "KeyD": movement.current.right = true; break;
        case "ShiftLeft": movement.current.sprint = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": movement.current.forward = false; break;
        case "KeyS": movement.current.backward = false; break;
        case "KeyA": movement.current.left = false; break;
        case "KeyD": movement.current.right = false; break;
        case "ShiftLeft": movement.current.sprint = false; break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame(() => {
    if (dialogueOpen || codexActive || puzzleActive || artifactViewActive || isCompleted)
      return;

    const { forward, backward, left, right, sprint } = movement.current;
    if (!forward && !backward && !left && !right) return;

    const speed = sprint ? sprintSpeed : moveSpeed;
    const dir = new THREE.Vector3();
    const side = new THREE.Vector3();

    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    side.crossVectors(camera.up, dir).normalize();

    const nextPos = camera.position.clone();
    if (forward) nextPos.addScaledVector(dir, speed);
    if (backward) nextPos.addScaledVector(dir, -speed);
    if (left) nextPos.addScaledVector(side, speed);
    if (right) nextPos.addScaledVector(side, -speed);

    // Bounds for library hall
    nextPos.x = Math.max(-7, Math.min(7, nextPos.x));
    nextPos.z = Math.max(-40, Math.min(5, nextPos.z));

    // Collision around foreground desk
    const inDesk =
      nextPos.x > -2.3 && nextPos.x < 2.3 && nextPos.z > -0.9 && nextPos.z < 1.0;
    if (!inDesk) {
      camera.position.copy(nextPos);
    }
    camera.position.y = 1.38;
  });

  const shouldEnable =
    !dialogueOpen && !codexActive && !puzzleActive && !artifactViewActive && !isCompleted;

  return <PointerLockControls enabled={shouldEnable} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODERN LIBRARY SCENE 3D (MAIN EXPORT)
// ─────────────────────────────────────────────────────────────────────────────

export default function ModernLibraryScene3D() {
  const { currentObjective, setLevel, openDialogue, setObjective } = useGame();
  const canReadBook = currentObjective === "Open the Prajnaparamita Sutra on the desk.";

  const coverTex = useMemo(() => createBookCoverTexture(), []);
  const pagesTex = useMemo(() => createBookPagesTexture(), []);
  const shelfTex = useMemo(() => createBookshelfTexture(), []);
  const woodTex = useMemo(() => createWoodDeskTexture(), []);
  const manuscriptTex = useMemo(() => createManuscriptPageTexture(), []);

  const handleAction = () => {
    if (canReadBook) {
      if (typeof document !== "undefined" && document.pointerLockElement) {
        document.exitPointerLock();
      }
      setLevel("portal");
    } else {
      openDialogue(
        "ELDER ARJUNA",
        [
          "Welcome, seeker. You stand within the Sacred Archive.",
          "Centuries ago, Nalanda was the intellectual heart of the ancient world. For eight hundred years, scholars studied here in peace.",
          "Over nine million sacred manuscripts filled three majestic multi-story libraries: Ratnasagara, Ratnodadhi, and Ratnaranjaka.",
          "In 1193 CE, tragedy struck. Invading armies set fire to Nalanda, burning the great library for three months.",
          "This manuscript before you is the Prajnaparamita Sutra — a temporal bridge bound to the memories of that day.",
          "Open it to enter the burning sanctuary and recover the three lost palm-leaf fragments before history is turned to ash."
        ],
        () => {
          setObjective("Open the Prajnaparamita Sutra on the desk.");
        }
      );
    }
  };

  return (
    <div id="canvas-container" className="w-full h-full relative cursor-crosshair bg-[#0a0705]">
      <Canvas
        camera={{ fov: 56, near: 0.1, far: 180 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#0c0805"]} />
        <fog attach="fog" args={["#0e0906", 28, 85]} />

        {/* Warm Golden Ambient & Directional Lighting */}
        <ambientLight intensity={2.0} color="#f5d29d" />
        <directionalLight position={[0, 14, 0]} color="#ffd699" intensity={1.4} />

        <Suspense fallback={null}>
          <GrandLibraryHall shelfTex={shelfTex} woodTex={woodTex} />
          <ForegroundReadingDesk
            coverTex={coverTex}
            pagesTex={pagesTex}
            woodTex={woodTex}
            manuscriptTex={manuscriptTex}
            onInteract={handleAction}
          />
          <PlayerSeatedController />

          {/* Floating warm ambient dust motes */}
          <Sparkles
            count={240}
            scale={[16, 12, 45]}
            position={[0, 5, -12]}
            size={2.2}
            speed={0.2}
            color="#ffcc66"
            opacity={0.45}
          />
        </Suspense>
      </Canvas>

      {/* Top Archive Badge */}
      <div className="absolute top-6 left-8 z-20 pointer-events-none">
        <div className="glass-panel px-5 py-3 border border-amber-600/30 rounded-xl bg-black/60 backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-500 font-serif tracking-widest text-xs font-bold uppercase mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Nalanda Manuscript Archive
          </div>
          <p className="text-amber-100 font-medium text-sm">
            {currentObjective}
          </p>
        </div>
      </div>

      {/* Central Interactive Action Banner */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <button
          onClick={handleAction}
          className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-amber-950/85 hover:bg-amber-900 border border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer group"
        >
          <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-xs font-bold">
            E
          </span>
          <span className="text-amber-100 font-serif font-semibold text-sm tracking-wide group-hover:text-white">
            {canReadBook
              ? "Open Prajnaparamita Sutra (Enter Nalanda)"
              : "Speak with Elder Arjuna / Examine Manuscript"}
          </span>
        </button>
      </div>

      {/* Bottom Controls Bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-3 px-5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-700/20 text-xs text-amber-200/70 font-mono">
        <span>Click to look around</span>
        <span>•</span>
        <span>[WASD] Walk</span>
        <span>•</span>
        <span>[E] Interact</span>
        <span>•</span>
        <span>[ESC] Unlock cursor</span>
      </div>
    </div>
  );
}
