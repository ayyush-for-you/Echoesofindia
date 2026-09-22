"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PointerLockControls, Text, Sparkles } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGame } from "../../store/GameContext";

// ─────────────────────────────────────────────────────────────────────────────
// FIRE LIGHT  — flickering point light + ember sparkles
// ─────────────────────────────────────────────────────────────────────────────
function FireLight({
  position,
  intensity = 2,
  color = "#FF6B1A",
  radius = 7,
  emberCount = 18,
}: {
  position: [number, number, number];
  intensity?: number;
  color?: string;
  radius?: number;
  emberCount?: number;
}) {
  const lightRef = useRef<THREE.PointLight>(null!);
  const seed = position[0] * 7.3 + position[2] * 3.1;

  useFrame((state) => {
    if (!lightRef.current) return;
    const t = state.clock.elapsedTime;
    const flicker =
      Math.sin(t * 8.7 + seed) * 0.22 +
      Math.sin(t * 14.3 + seed * 1.7) * 0.14 +
      Math.sin(t * 4.1 + seed) * 0.08;
    lightRef.current.intensity = intensity * (0.72 + flicker);
  });

  return (
    <group position={position}>
      <pointLight
        ref={lightRef}
        color={color}
        distance={radius}
        intensity={intensity}
        castShadow={false}
      />
      {/* Core flame glow mesh */}
      <mesh>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      {/* Rising embers */}
      <Sparkles
        count={emberCount}
        scale={[0.8, 2.0, 0.8]}
        size={2.5}
        speed={0.55}
        color="#FF8C42"
        opacity={0.85}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STONE COLUMN  — Nalanda-style carved sandstone pillar
// ─────────────────────────────────────────────────────────────────────────────
function StoneColumn({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base plinth */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.6, 1.2]} />
        <meshStandardMaterial color="#6B5742" roughness={0.96} metalness={0} />
      </mesh>
      {/* Decorative band */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[1.0, 0.12, 1.0]} />
        <meshStandardMaterial color="#7a6555" roughness={0.9} />
      </mesh>
      {/* Shaft */}
      <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.44, 6.2, 12]} />
        <meshStandardMaterial color="#786050" roughness={0.88} metalness={0} />
      </mesh>
      {/* Capital spread */}
      <mesh position={[0, 7.05, 0]} castShadow>
        <boxGeometry args={[1.0, 0.28, 1.0]} />
        <meshStandardMaterial color="#7a6555" roughness={0.9} />
      </mesh>
      <mesh position={[0, 7.35, 0]} castShadow>
        <boxGeometry args={[1.4, 0.32, 1.4]} />
        <meshStandardMaterial color="#6B5742" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANUSCRIPT BUNDLE
// ─────────────────────────────────────────────────────────────────────────────
function ManuscriptBundle({
  position,
  burned,
  seed,
}: {
  position: [number, number, number];
  burned: boolean;
  seed: number;
}) {
  const rotY = ((seed * 13.7) % 0.5) - 0.25;
  return (
    <mesh position={position} rotation={[0, rotY, 0]}>
      <boxGeometry args={[0.33, 0.07, 0.2]} />
      <meshStandardMaterial
        color={burned ? "#1f0e03" : "#C4A97A"}
        roughness={0.85}
        metalness={0}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKSHELF  — wooden shelf with palm-leaf manuscripts
// ─────────────────────────────────────────────────────────────────────────────
function BookShelf({
  position,
  rotation = 0,
  burning = false,
  burnLevel = 0,
}: {
  position: [number, number, number];
  rotation?: number;
  burning?: boolean;
  burnLevel?: number;
}) {
  const ROWS = 4;
  const ROW_H = 0.82;
  const totalH = ROWS * ROW_H + 0.3;

  const woodColor =
    burnLevel > 0.75 ? "#12060000" : burnLevel > 0.4 ? "#2d1505" : "#5c3317";
  const darkWood = burnLevel > 0.4 ? "#0e0400" : "#3a1f0a";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Back panel */}
      <mesh position={[0, totalH / 2, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[2.3, totalH, 0.07]} />
        <meshStandardMaterial color={woodColor} roughness={0.96} />
      </mesh>
      {/* Left side */}
      <mesh position={[-1.15, totalH / 2, 0]} castShadow>
        <boxGeometry args={[0.07, totalH, 0.35]} />
        <meshStandardMaterial color={woodColor} roughness={0.96} />
      </mesh>
      {/* Right side */}
      <mesh position={[1.15, totalH / 2, 0]} castShadow>
        <boxGeometry args={[0.07, totalH, 0.35]} />
        <meshStandardMaterial color={woodColor} roughness={0.96} />
      </mesh>

      {/* Shelf planks */}
      {Array.from({ length: ROWS + 1 }).map((_, i) => (
        <mesh key={`plank-${i}`} position={[0, i * ROW_H + 0.12, 0]} receiveShadow>
          <boxGeometry args={[2.3, 0.06, 0.35]} />
          <meshStandardMaterial color={darkWood} roughness={0.92} />
        </mesh>
      ))}

      {/* Manuscripts on each row */}
      {Array.from({ length: ROWS }).flatMap((_, row) =>
        Array.from({ length: 5 }).map((_, col) => (
          <ManuscriptBundle
            key={`ms-${row}-${col}`}
            position={[
              -0.76 + col * 0.38,
              row * ROW_H + 0.5,
              0,
            ] as [number, number, number]}
            burned={burnLevel > 0.4}
            seed={row * 5 + col}
          />
        ))
      )}

      {/* Fire when burning */}
      {burning && (
        <FireLight
          position={[0, totalH * 0.55, 0.1]}
          intensity={1.6 + burnLevel * 1.4}
          color={burnLevel > 0.7 ? "#FF3300" : "#FF6B1A"}
          radius={5}
          emberCount={12}
        />
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLEN BEAM  — collapsed wooden ceiling beam with fire
// ─────────────────────────────────────────────────────────────────────────────
function FallenBeam({
  position,
  rotation,
  burning = false,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  burning?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 5, 6]} />
        <meshStandardMaterial color={burning ? "#1a0800" : "#3a2415"} roughness={0.97} />
      </mesh>
      {burning && (
        <FireLight
          position={[0, 0.3, 0]}
          intensity={1.0}
          color="#FF4500"
          radius={3.5}
          emberCount={8}
        />
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER MOVEMENT
// ─────────────────────────────────────────────────────────────────────────────
function Movement() {
  const speed = 5.5;
  const runSpeed = 10.0;
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": moveState.current.forward = true; break;
        case "KeyS": moveState.current.backward = true; break;
        case "KeyA": moveState.current.left = true; break;
        case "KeyD": moveState.current.right = true; break;
        case "ShiftLeft": moveState.current.run = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": moveState.current.forward = false; break;
        case "KeyS": moveState.current.backward = false; break;
        case "KeyA": moveState.current.left = false; break;
        case "KeyD": moveState.current.right = false; break;
        case "ShiftLeft": moveState.current.run = false; break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();

  useFrame((state, delta) => {
    const { forward, backward, left, right, run } = moveState.current;
    const currentSpeed = run ? runSpeed : speed;

    frontVector.set(0, 0, Number(backward) - Number(forward));
    sideVector.set(Number(left) - Number(right), 0, 0);
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(currentSpeed * delta);

    state.camera.translateX(direction.x);
    state.camera.translateZ(direction.z);

    // Lock to player eye height
    state.camera.position.y = 1.6;

    // Corridor bounds
    state.camera.position.x = Math.max(-5.5, Math.min(5.5, state.camera.position.x));
    state.camera.position.z = Math.max(-22, Math.min(13, state.camera.position.z));
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
function PlayerController() {
  const { codexActive, puzzleActive, artifactViewActive, isCompleted, dialogueOpen } =
    useGame();
  const shouldEnable = !(
    codexActive ||
    puzzleActive ||
    artifactViewActive ||
    isCompleted ||
    dialogueOpen
  );

  return (
    <>
      <PointerLockControls selector="#canvas-container" enabled={shouldEnable} />
      <Movement />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ELDER MONK  — with proper in-world dialogue trigger
// ─────────────────────────────────────────────────────────────────────────────
function ElderMonk() {
  const { currentObjective, setObjective, openDialogue } = useGame();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const handleInteract = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && hovered) {
        if (currentObjective === "Speak to the Elder Monk") {
          openDialogue(
            "ELDER ARJUNA",
            [
              "Ah — a scholar, still standing amidst the chaos...",
              "Bakhtiyar Khilji's soldiers have set fire to the halls. Nine million manuscripts burn this very night.",
              "But three fragments of the Prajnaparamita Sutra survived — ancient palm-leaf pages of immeasurable wisdom.",
              "I have hidden them throughout these corridors. The smoke grows thicker with every passing moment.",
              "Find those fragments before the flames reach them. Bring them to the restoration altar at the far end of this hall.",
              "Go now. May Saraswati guide your steps through these flames.",
            ],
            () => {
              setObjective("Recover manuscript fragments");
            }
          );
        }
      }
    };
    window.addEventListener("keydown", handleInteract);
    return () => window.removeEventListener("keydown", handleInteract);
  }, [hovered, currentObjective, openDialogue, setObjective]);

  return (
    <group position={[0, 0, 6]}>
      {/* Robes */}
      <mesh
        position={[0, 0.95, 0]}
        castShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.32, 0.42, 1.9, 12]} />
        <meshStandardMaterial
          color={hovered ? "#C4A45A" : "#8B6914"}
          emissive={hovered ? "#D4AF37" : "#220e00"}
          emissiveIntensity={hovered ? 0.35 : 0.15}
          roughness={0.8}
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <sphereGeometry args={[0.24, 14, 14]} />
        <meshStandardMaterial color="#C8A882" roughness={0.75} />
      </mesh>
      {/* Interaction indicator */}
      {currentObjective === "Speak to the Elder Monk" && (
        <mesh position={[0, 2.9, 0]}>
          <coneGeometry args={[0.15, 0.32, 4]} />
          <meshBasicMaterial color="#D4AF37" />
        </mesh>
      )}
      {hovered && (
        <Text
          position={[0, 2.6, 0]}
          fontSize={0.18}
          color="#FDF5E6"
          anchorX="center"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          [E] Speak to Elder Arjuna
        </Text>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTIFACT  — floating, spinning collectible
// ─────────────────────────────────────────────────────────────────────────────
function Artifact({
  position,
  id,
  label,
  onClick,
}: {
  position: [number, number, number];
  id: string;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { unlockedArtifacts } = useGame();
  const meshRef = useRef<THREE.Mesh>(null!);

  const baseY = position[1] + 0.7;

  if (unlockedArtifacts.includes(id as any)) return null;

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 1.6;
    meshRef.current.position.y =
      baseY + Math.sin(state.clock.elapsedTime * 2.1 + position[0]) * 0.07;
  });

  useEffect(() => {
    const handleInteract = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && hovered) onClick();
    };
    window.addEventListener("keydown", handleInteract);
    return () => window.removeEventListener("keydown", handleInteract);
  }, [hovered, onClick]);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, baseY, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.42, 0.07, 0.26]} />
        <meshStandardMaterial
          color={hovered ? "#FDF5E6" : "#C4A97A"}
          emissive="#D4AF37"
          emissiveIntensity={hovered ? 0.9 : 0.35}
          roughness={0.5}
          metalness={0.15}
        />
      </mesh>
      {/* Aura sparkles */}
      <Sparkles
        count={14}
        scale={[0.9, 0.9, 0.9]}
        size={2.2}
        color="#D4AF37"
        position={[0, baseY, 0]}
        speed={0.3}
        opacity={0.7}
      />
      {hovered && (
        <Text
          position={[0, baseY + 0.7, 0]}
          fontSize={0.17}
          color="white"
          anchorX="center"
          outlineWidth={0.012}
          outlineColor="#000"
        >
          [E] EXAMINE {label}
        </Text>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL RESTORATION TABLE
// ─────────────────────────────────────────────────────────────────────────────
function FinalRestorationTable() {
  const [hovered, setHovered] = useState(false);
  const { fragmentsFound, setPuzzleActive } = useGame();

  useEffect(() => {
    const handleInteract = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && hovered && fragmentsFound === 3) {
        setPuzzleActive("manuscript_final");
      }
    };
    window.addEventListener("keydown", handleInteract);
    return () => window.removeEventListener("keydown", handleInteract);
  }, [hovered, fragmentsFound, setPuzzleActive]);

  return (
    <group position={[0, 0, -18]}>
      {/* Stone altar */}
      <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[3.0, 0.7, 1.8]} />
        <meshStandardMaterial color="#5c4a38" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.73, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.12, 1.5]} />
        <meshStandardMaterial color="#6B5742" roughness={0.92} />
      </mesh>

      {/* Sacred glow when all fragments collected */}
      {fragmentsFound === 3 && (
        <>
          <pointLight
            position={[0, 2, 0]}
            color="#D4AF37"
            intensity={3}
            distance={6}
          />
          <Sparkles
            count={40}
            scale={[2.5, 1.5, 1.5]}
            size={4}
            color="#D4AF37"
            position={[0, 1.2, 0]}
            speed={0.4}
          />
          <mesh position={[0, 2.8, 0]}>
            <coneGeometry args={[0.3, 0.6, 4]} />
            <meshBasicMaterial color="#D4AF37" />
          </mesh>
        </>
      )}

      {/* Invisible interaction zone */}
      <mesh
        position={[0, 1.5, 0]}
        visible={false}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[3, 2.5, 2.5]} />
        <meshBasicMaterial />
      </mesh>

      {hovered && (
        <Text
          position={[0, 2.3, 0]}
          fontSize={0.19}
          color="white"
          anchorX="center"
          outlineWidth={0.012}
          outlineColor="#000"
        >
          {fragmentsFound === 3
            ? "[E] RESTORE MANUSCRIPT"
            : `Fragments needed: ${3 - fragmentsFound} more`}
        </Text>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NALANDA ENVIRONMENT  — the burning library world
// ─────────────────────────────────────────────────────────────────────────────
function NalandaEnvironment() {
  // Bookshelf layout: [x, z, burning, burnLevel, yRotation]
  const shelves: Array<{
    pos: [number, number, number];
    burning: boolean;
    burnLevel: number;
    rot: number;
  }> = [
    // Right wall (rot = -PI/2 to face inward)
    { pos: [6.0, 0, 11], burning: false, burnLevel: 0.0, rot: -Math.PI / 2 },
    { pos: [6.0, 0, 6], burning: true, burnLevel: 0.35, rot: -Math.PI / 2 },
    { pos: [6.0, 0, 1], burning: true, burnLevel: 0.8, rot: -Math.PI / 2 },
    { pos: [6.0, 0, -4], burning: true, burnLevel: 1.0, rot: -Math.PI / 2 },
    { pos: [6.0, 0, -9], burning: false, burnLevel: 0.15, rot: -Math.PI / 2 },
    { pos: [6.0, 0, -14], burning: true, burnLevel: 0.6, rot: -Math.PI / 2 },
    { pos: [6.0, 0, -19], burning: true, burnLevel: 0.9, rot: -Math.PI / 2 },
    // Left wall (rot = PI/2)
    { pos: [-6.0, 0, 11], burning: false, burnLevel: 0.0, rot: Math.PI / 2 },
    { pos: [-6.0, 0, 6], burning: false, burnLevel: 0.1, rot: Math.PI / 2 },
    { pos: [-6.0, 0, 1], burning: true, burnLevel: 0.5, rot: Math.PI / 2 },
    { pos: [-6.0, 0, -4], burning: true, burnLevel: 0.85, rot: Math.PI / 2 },
    { pos: [-6.0, 0, -9], burning: true, burnLevel: 1.0, rot: Math.PI / 2 },
    { pos: [-6.0, 0, -14], burning: false, burnLevel: 0.05, rot: Math.PI / 2 },
    { pos: [-6.0, 0, -19], burning: true, burnLevel: 0.7, rot: Math.PI / 2 },
  ];

  // Stone pillar pairs [x, z]
  const pillarPairs: [number, number][] = [
    [4.2, 9], [-4.2, 9],
    [4.2, 3], [-4.2, 3],
    [4.2, -3], [-4.2, -3],
    [4.2, -9], [-4.2, -9],
    [4.2, -15], [-4.2, -15],
  ];

  // Floor fire sources
  const floorFires: Array<[number, number, number]> = [
    [2.5, 0.1, 4],
    [-2.0, 0.1, -2],
    [1.0, 0.1, -8],
    [-3.0, 0.1, -13],
    [0.0, 0.1, -20],
  ];

  return (
    <group>
      {/* ── FLOOR ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4.5]} receiveShadow>
        <planeGeometry args={[14, 40]} />
        <meshStandardMaterial color="#4a3828" roughness={0.97} metalness={0} />
      </mesh>
      {/* Stone tile grout lines - just darker strips */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={`groove-x-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-6 + i * 1.75, 0.003, -4.5]}
          receiveShadow
        >
          <planeGeometry args={[0.04, 40]} />
          <meshStandardMaterial color="#38291a" />
        </mesh>
      ))}

      {/* ── SIDE WALLS ── */}
      {/* Right */}
      <mesh position={[7.25, 3.75, -4.5]} receiveShadow>
        <boxGeometry args={[0.5, 7.5, 40]} />
        <meshStandardMaterial color="#7a6555" roughness={0.92} />
      </mesh>
      {/* Left */}
      <mesh position={[-7.25, 3.75, -4.5]} receiveShadow>
        <boxGeometry args={[0.5, 7.5, 40]} />
        <meshStandardMaterial color="#7a6555" roughness={0.92} />
      </mesh>
      {/* Back wall */}
      <mesh position={[0, 3.75, -24.5]} receiveShadow>
        <boxGeometry args={[15, 7.5, 0.5]} />
        <meshStandardMaterial color="#6B5742" roughness={0.95} />
      </mesh>
      {/* Entrance arch pillars (z ≈ 13.5) */}
      <mesh position={[5.5, 3.0, 13.5]} receiveShadow castShadow>
        <boxGeometry args={[1.5, 6, 0.8]} />
        <meshStandardMaterial color="#6B5742" roughness={0.95} />
      </mesh>
      <mesh position={[-5.5, 3.0, 13.5]} receiveShadow castShadow>
        <boxGeometry args={[1.5, 6, 0.8]} />
        <meshStandardMaterial color="#6B5742" roughness={0.95} />
      </mesh>
      <mesh position={[0, 6.4, 13.5]} receiveShadow>
        <boxGeometry args={[14, 0.8, 0.8]} />
        <meshStandardMaterial color="#5c4a38" roughness={0.95} />
      </mesh>

      {/* ── CEILING (partial — some sections burned through) ── */}
      {([-18, -12, -6, 0, 7] as number[]).map((z, i) => (
        <mesh key={`ceil-${i}`} position={[0, 7.5, z]} receiveShadow>
          <boxGeometry args={[14, 0.4, 5]} />
          <meshStandardMaterial color="#3a2818" roughness={0.97} />
        </mesh>
      ))}
      {/* Ceiling crossbeams */}
      {([-20, -15, -10, -5, 0, 5, 10] as number[]).map((z, i) => (
        <mesh key={`beam-${i}`} position={[0, 7.3, z]} castShadow>
          <boxGeometry args={[14, 0.28, 0.35]} />
          <meshStandardMaterial color="#2a1a0a" roughness={0.98} />
        </mesh>
      ))}

      {/* ── WALL FIRE SCONCES (decorative fire along upper walls) ── */}
      {([8, 2, -4, -10, -16] as number[]).map((z, i) => (
        <group key={`sconce-r-${i}`}>
          {/* Sconce bracket */}
          <mesh position={[6.5, 4.5, z]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
          <FireLight
            position={[5.8, 4.8, z]}
            intensity={1.4}
            color="#FF6B1A"
            radius={6}
            emberCount={10}
          />
        </group>
      ))}
      {([5, -1, -7, -13, -19] as number[]).map((z, i) => (
        <group key={`sconce-l-${i}`}>
          <mesh position={[-6.5, 4.5, z]}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#4a3020" />
          </mesh>
          <FireLight
            position={[-5.8, 4.8, z]}
            intensity={1.4}
            color="#FF5500"
            radius={6}
            emberCount={10}
          />
        </group>
      ))}

      {/* ── BOOKSHELVES ── */}
      {shelves.map((s, i) => (
        <BookShelf
          key={`shelf-${i}`}
          position={s.pos}
          rotation={s.rot}
          burning={s.burning}
          burnLevel={s.burnLevel}
        />
      ))}

      {/* ── STONE COLUMNS ── */}
      {pillarPairs.map(([x, z], i) => (
        <StoneColumn key={`col-${i}`} position={[x, 0, z]} />
      ))}

      {/* ── FLOOR FIRE SOURCES ── */}
      {floorFires.map((pos, i) => (
        <FireLight
          key={`floor-fire-${i}`}
          position={pos}
          intensity={1.0}
          color="#FF4500"
          radius={4}
          emberCount={8}
        />
      ))}

      {/* ── FALLEN DEBRIS ── */}
      <FallenBeam
        position={[2.5, 0.2, -6]}
        rotation={[Math.PI / 2, 0, 0.4]}
        burning={true}
      />
      <FallenBeam
        position={[-1.5, 0.2, 2]}
        rotation={[Math.PI / 2, 0, -0.3]}
        burning={false}
      />
      <FallenBeam
        position={[0.5, 0.2, -16]}
        rotation={[Math.PI / 2, 0, 0.1]}
        burning={true}
      />

      {/* Scattered stone debris blocks */}
      {[
        [1.5, 0.15, -3], [-2.5, 0.1, 5], [3.0, 0.12, -11],
        [-1.0, 0.1, -7], [2.0, 0.08, 8], [-3.5, 0.1, -17],
      ].map((p, i) => (
        <mesh key={`debris-${i}`} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[0.4 + (i % 3) * 0.15, 0.25, 0.35 + (i % 2) * 0.1]} />
          <meshStandardMaterial color="#5c4a38" roughness={0.98} />
        </mesh>
      ))}

      {/* ── GLOBAL AMBIENT EMBERS (floating throughout corridor) ── */}
      <Sparkles
        count={80}
        scale={[12, 7, 42]}
        position={[0, 3.5, -4.5]}
        size={1.8}
        speed={0.25}
        color="#FF7A2A"
        opacity={0.45}
      />

      {/* Smoke haze particles (slow, grey-brown) */}
      <Sparkles
        count={30}
        scale={[14, 4, 44]}
        position={[0, 6, -4.5]}
        size={10}
        speed={0.05}
        color="#3a2820"
        opacity={0.25}
      />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function Scene3D() {
  const { setArtifactViewActive, setPuzzleActive } = useGame();

  return (
    <div id="canvas-container" className="w-full h-full cursor-crosshair">
      <Canvas
        shadows
        camera={{ fov: 72, position: [0, 1.6, 12], near: 0.1, far: 60 }}
        gl={{ antialias: true }}
      >
        {/* Deep smoke atmosphere */}
        <color attach="background" args={["#0d0500"]} />
        <fog attach="fog" args={["#110700", 10, 28]} />

        {/* Extremely low ambient — fire is the only light source */}
        <ambientLight intensity={0.05} color="#FF4500" />

        <Suspense fallback={null}>
          <PlayerController />
          <NalandaEnvironment />
          <ElderMonk />

          {/* ── ARTIFACTS ── */}
          <Artifact
            id="manuscript_1"
            label="PALM-LEAF FRAGMENT"
            position={[4.5, 0, 3]}
            onClick={() => setArtifactViewActive("manuscript_1")}
          />
          <Artifact
            id="manuscript_2"
            label="PALM-LEAF FRAGMENT"
            position={[-4.0, 0, -6]}
            onClick={() => setArtifactViewActive("manuscript_2")}
          />
          <Artifact
            id="seal"
            label="TERRACOTTA SEAL"
            position={[-3.5, 0, 2]}
            onClick={() => {
              setArtifactViewActive("seal");
              setTimeout(() => setPuzzleActive("seal"), 100);
            }}
          />
          <Artifact
            id="manuscript_3"
            label="FINAL FRAGMENT"
            position={[3.0, 0, -14]}
            onClick={() => setArtifactViewActive("manuscript_3")}
          />

          <FinalRestorationTable />
        </Suspense>
      </Canvas>
    </div>
  );
}
