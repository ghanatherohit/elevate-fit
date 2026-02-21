"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrthographicCamera } from "@react-three/drei";
import { CanvasTexture, MeshBasicMaterial } from "three";

type BodyHotspot2D = {
  id: string;
  label: string;
  targetId: string;
  position: [number, number];
};

type BodyMap2DProps = {
  view: "front" | "back";
  hotspots: BodyHotspot2D[];
  onSelect: (targetId: string) => void;
};

type HoveredSpot = BodyHotspot2D & { planePosition: [number, number, number] };

const createSilhouetteTexture = (view: "front" | "back") => {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 8;

  // Head
  ctx.beginPath();
  ctx.ellipse(256, 120, 70, 85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.beginPath();
  ctx.roundRect(222, 200, 68, 50, 24);
  ctx.fill();

  // Torso
  ctx.beginPath();
  ctx.moveTo(160, 250);
  ctx.quadraticCurveTo(256, 210, 352, 250);
  ctx.lineTo(380, 500);
  ctx.quadraticCurveTo(256, 560, 132, 500);
  ctx.closePath();
  ctx.fill();

  // Arms
  ctx.beginPath();
  ctx.roundRect(90, 270, 70, 320, 30);
  ctx.roundRect(352, 270, 70, 320, 30);
  ctx.fill();

  // Pelvis
  ctx.beginPath();
  ctx.roundRect(185, 520, 142, 90, 40);
  ctx.fill();

  // Legs
  ctx.beginPath();
  ctx.roundRect(180, 610, 70, 330, 35);
  ctx.roundRect(262, 610, 70, 330, 35);
  ctx.fill();

  // Feet
  ctx.beginPath();
  ctx.roundRect(170, 930, 90, 45, 20);
  ctx.roundRect(252, 930, 90, 45, 20);
  ctx.fill();

  // Back marker (subtle spine) for back view
  if (view === "back") {
    ctx.strokeStyle = "rgba(70, 90, 140, 0.5)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(256, 260);
    ctx.lineTo(256, 575);
    ctx.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = "srgb";
  return texture;
};

export default function BodyMap2D({ view, hotspots, onSelect }: BodyMap2DProps) {
  const [hoveredSpot, setHoveredSpot] = useState<HoveredSpot | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<HoveredSpot | null>(null);

  const texture = useMemo(() => createSilhouetteTexture(view), [view]);
  const material = useMemo(() => {
    if (!texture) return null;
    return new MeshBasicMaterial({ map: texture, transparent: true });
  }, [texture]);

  const width = 1;
  const height = 2;

  const mapToPlane = (spot: BodyHotspot2D) => {
    const x = (spot.position[0] - 0.5) * width;
    const y = (spot.position[1] - 0.5) * height;
    return [x, y, 0] as [number, number, number];
  };

  const updateHover = (uv: { x: number; y: number } | null) => {
    if (!uv) {
      setHoveredSpot(null);
      return null;
    }

    let closest: HoveredSpot | null = null;
    let minDistance = Infinity;
    const yWeight = 1.4;
    const hoverRadius = 0.18;

    hotspots.forEach((spot) => {
      const dx = uv.x - spot.position[0];
      const dy = uv.y - spot.position[1];
      const distance = Math.sqrt(dx * dx + dy * dy * yWeight);
      if (distance < minDistance) {
        minDistance = distance;
        closest = { ...spot, planePosition: mapToPlane(spot) };
      }
    });

    if (closest && minDistance <= hoverRadius) {
      setHoveredSpot(closest);
      return closest;
    }

    setHoveredSpot(null);
    return null;
  };

  return (
    <div className="h-[420px] w-full">
      <Canvas dpr={[1, 1.5]}>
        <color attach="background" args={["#0d111c"]} />
        <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={220} />
        <Suspense fallback={null}>
          {material ? (
            <mesh
              onPointerMove={(event) => updateHover(event.uv ?? null)}
              onPointerOut={() => setHoveredSpot(null)}
              onPointerMissed={() => setHoveredSpot(null)}
              onClick={(event) => {
                const hit = updateHover(event.uv ?? null) ?? hoveredSpot;
                if (hit) {
                  setSelectedSpot(hit);
                  onSelect(hit.targetId);
                }
              }}
            >
              <planeGeometry args={[width, height]} />
              <primitive object={material} attach="material" />
            </mesh>
          ) : null}
          {selectedSpot ? (
            <Html center position={selectedSpot.planePosition} distanceFactor={6} transform>
              <div className="pointer-events-none rounded-full border border-border bg-card-strong px-2 py-0.5 text-[9px] text-foreground shadow-sm">
                {selectedSpot.label}
              </div>
            </Html>
          ) : null}
          {hoveredSpot && (!selectedSpot || hoveredSpot.id !== selectedSpot.id) ? (
            <Html center position={hoveredSpot.planePosition} distanceFactor={6} transform>
              <div className="pointer-events-none rounded-full border border-border bg-card-strong px-2 py-0.5 text-[9px] text-foreground shadow-sm">
                {hoveredSpot.label}
              </div>
            </Html>
          ) : null}
        </Suspense>
      </Canvas>
    </div>
  );
}


