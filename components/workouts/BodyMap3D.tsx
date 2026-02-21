"use client";

import { Suspense, useMemo, useRef, useState, type ReactElement } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Box3, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

type BodyHotspot = {
  id: string;
  label: string;
  targetId: string;
  position: [number, number, number];
};

type BodyMap3DProps = {
  view: "front" | "back";
  modelUrl: string;
  hotspots: BodyHotspot[];
  onSelect: (targetId: string) => void;
  onHoverCoords?: (coords: [number, number, number] | null) => void;
};

const BodyModelGLTF = ({
  modelUrl,
  children,
}: {
  modelUrl: string;
  children: (data: { model: Object3D; size: Vector3; center: Vector3 }) => ReactElement;
}) => {
  const { scene } = useGLTF(modelUrl);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const { size, center } = useMemo(() => {
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
  }, [cloned]);

  return children({ model: cloned, size, center });
};

const BodyModelOBJ = ({
  modelUrl,
  children,
}: {
  modelUrl: string;
  children: (data: { model: Object3D; size: Vector3; center: Vector3 }) => ReactElement;
}) => {
  const object = useLoader(OBJLoader, modelUrl);
  const cloned = useMemo(() => {
    const clone = object.clone(true);
    const defaultMaterial = new MeshStandardMaterial({ color: "#d7d7d7", roughness: 0.55, metalness: 0.05 });
    clone.traverse((child: Object3D) => {
      if (child.type === "Mesh") {
        child.castShadow = true;
        child.receiveShadow = true;
        if (!(child as Mesh).material) {
          (child as Mesh).material = defaultMaterial;
        }
      }
    });
    return clone;
  }, [object]);
  const { size, center } = useMemo(() => {
    const box = new Box3().setFromObject(cloned);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
  }, [cloned]);

  return children({ model: cloned, size, center });
};

type HoveredSpot = BodyHotspot & { localPosition: [number, number, number] };

export default function BodyMap3D({
  view,
  modelUrl,
  hotspots,
  onSelect,
  onHoverCoords,
}: BodyMap3DProps) {
  const rotation = view === "back" ? Math.PI : 0;
  const cameraPosition: [number, number, number] = view === "back" ? [0, 0, -3.6] : [0, 0, 3.6];
  const isObj = modelUrl.toLowerCase().endsWith(".obj");
  const [hoveredSpot, setHoveredSpot] = useState<HoveredSpot | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<HoveredSpot | null>(null);
  const [debugPoint, setDebugPoint] = useState<Vector3 | null>(null);
  const [debugNormalized, setDebugNormalized] = useState<Vector3 | null>(null);
  const ModelWithHotspots = ({
    model,
    size,
    center,
  }: {
    model: Object3D;
    size: Vector3;
    center: Vector3;
  }) => {
    const maxSize = Math.max(size.x, size.y, size.z, 1);
    const scale = 1.8 / maxSize;
    const groupRef = useRef<Group>(null);
    const dragStart = useRef<{ x: number; y: number } | null>(null);
    const isDragging = useRef(false);
    const bounds = useMemo(() => {
      const box = new Box3().setFromObject(model);
      const min = box.min.clone();
      const max = box.max.clone();
      const center = new Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
      return { min, max, center };
    }, [model]);
    const mappedHotspots = useMemo(() => {
      return hotspots.map((spot) => {
        const normalized = new Vector3(
          bounds.center.x + spot.position[0] * size.x,
          bounds.center.y + spot.position[1] * size.y,
          bounds.center.z + spot.position[2] * size.z
        );
        return {
          ...spot,
          localPosition: [normalized.x, normalized.y, normalized.z] as [number, number, number],
          normalizedPosition: spot.position,
        };
      });
    }, [size, bounds]);
    const hoverRadius = 0.3;

    const updateHover = (point: Vector3, captureDebug = false) => {
      const group = groupRef.current;
      if (!group) return null;
      const localPoint = group.worldToLocal(point.clone());
      const normalizedLocal = new Vector3(
        (localPoint.x - bounds.center.x) / size.x,
        (localPoint.y - bounds.center.y) / size.y,
        (localPoint.z - bounds.center.z) / size.z
      );
      if (onHoverCoords) {
        onHoverCoords([normalizedLocal.x, normalizedLocal.y, normalizedLocal.z]);
      }
      if (captureDebug) {
        setDebugPoint(localPoint);
        setDebugNormalized(normalizedLocal);
      }
      let closest: HoveredSpot | null = null;
      let minDistance = Infinity;
      const yWeight = 1.8;
      const zWeight = 0.45;

      mappedHotspots.forEach((spot) => {
        const dx = normalizedLocal.x - spot.normalizedPosition[0];
        const dy = normalizedLocal.y - spot.normalizedPosition[1];
        const dz = normalizedLocal.z - spot.normalizedPosition[2];
        const distance = Math.sqrt(dx * dx + dy * dy * yWeight + dz * dz * zWeight);
        if (distance < minDistance) {
          minDistance = distance;
          closest = { ...spot, localPosition: spot.localPosition };
        }
      });

      if (closest && minDistance <= hoverRadius) {
        setHoveredSpot(closest);
      } else {
        setHoveredSpot(null);
      }
      return closest;
    };

    return (
      <group
        ref={groupRef}
        scale={scale}
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
        rotation={[0, rotation, 0]}
        onPointerDown={(event) => {
          dragStart.current = { x: event.clientX, y: event.clientY };
          isDragging.current = false;
        }}
        onPointerMove={(event) => {
          updateHover(event.point);
          if (!dragStart.current) return;
          const dx = event.clientX - dragStart.current.x;
          const dy = event.clientY - dragStart.current.y;
          if (Math.hypot(dx, dy) > 6) {
            isDragging.current = true;
          }
        }}
        onPointerOut={() => {
          setHoveredSpot(null);
          if (onHoverCoords) {
            onHoverCoords(null);
          }
        }}
        onPointerMissed={() => {
          setHoveredSpot(null);
          if (onHoverCoords) {
            onHoverCoords(null);
          }
        }}
        onPointerUp={() => {
          dragStart.current = null;
        }}
        onClick={(event) => {
          if (isDragging.current) {
            return;
          }
          const hit = updateHover(event.point, true) ?? hoveredSpot;
          if (hit) {
            setSelectedSpot(hit);
            onSelect(hit.targetId);
          }
        }}
      >
        <primitive object={model} />
        {selectedSpot ? (
          <Html center position={selectedSpot.localPosition} distanceFactor={5} transform>
            <div className="pointer-events-none rounded-full border border-border bg-card-strong px-2 py-0.5 text-[9px] text-foreground shadow-sm">
              {selectedSpot.label}
            </div>
          </Html>
        ) : null}
        {hoveredSpot && (!selectedSpot || hoveredSpot.id !== selectedSpot.id) ? (
          <Html center position={hoveredSpot.localPosition} distanceFactor={5} transform>
            <div className="pointer-events-none rounded-full border border-border bg-card-strong px-2 py-0.5 text-[9px] text-foreground shadow-sm">
              {hoveredSpot.label}
            </div>
          </Html>
        ) : null}
        {debugPoint && debugNormalized ? (
          <Html position={[bounds.min.x, bounds.min.y, bounds.min.z]} distanceFactor={6} transform>
            <div className="pointer-events-none rounded-xl border border-border bg-card-strong px-2 py-1 text-[9px] text-muted shadow-sm">
              Click: {debugNormalized.x.toFixed(2)}, {debugNormalized.y.toFixed(2)}, {debugNormalized.z.toFixed(2)}
            </div>
          </Html>
        ) : null}
      </group>
    );
  };

  return (
    <div className="h-[420px] w-full">
      <Canvas camera={{ position: cameraPosition, fov: 30 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#0d111c"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 3]} intensity={1.4} />
        <directionalLight position={[-4, 2, -3]} intensity={0.9} color="#6bd0ff" />
        <directionalLight position={[0, -2, 2]} intensity={0.6} color="#9ab2ff" />
        <Suspense
          fallback={
            <Html center>
              <div className="rounded-full border border-border bg-card-strong px-3 py-1 text-[11px] text-muted">
                Loading model
              </div>
            </Html>
          }
        >
          {isObj ? (
            <BodyModelOBJ modelUrl={modelUrl}>
              {({ model, size, center }) => <ModelWithHotspots model={model} size={size} center={center} />}
            </BodyModelOBJ>
          ) : (
            <BodyModelGLTF modelUrl={modelUrl}>
              {({ model, size, center }) => <ModelWithHotspots model={model} size={size} center={center} />}
            </BodyModelGLTF>
          )}
        </Suspense>
        <OrbitControls
          enablePan={false}
          target={[0, 0, 0]}
          minDistance={2.6}
          maxDistance={3.9}
          minPolarAngle={Math.PI / 2 - 0.5}
          maxPolarAngle={Math.PI / 2 + 0.3}
          minAzimuthAngle={-Math.PI}
          maxAzimuthAngle={Math.PI}
        />
      </Canvas>
    </div>
  );
}


