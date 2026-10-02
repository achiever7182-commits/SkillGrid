"use client";

import { useMemo, useRef, useState, useEffect, Component, ReactNode, ErrorInfo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { motion, useScroll, useTransform } from "framer-motion";
import { PiShoppingBagBold } from "react-icons/pi";

class HeartCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  override getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    t = t * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    return optionalTarget.set(x * 0.002, (y + 6) * 0.002, 0);
  }
}

const sharedHeartCurve = new HeartCurve();

export function ResponsiveGroup({
  children,
  scale = 1,
}: {
  children: React.ReactNode;
  scale?: number;
}) {
  const { viewport } = useThree();
  // Mobile responsive scaling
  const s = Math.min(1.5, viewport.width / 3.5) * scale;
  return <group scale={s}>{children}</group>;
}

function GlassCapsule({
  color,
  power,
  intensity,
}: {
  color: string;
  power: number;
  intensity: number;
}) {
  const materialRef = useRef<any>(null);

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color("#ffffff") },
      power: { value: 2.5 },
      intensity: { value: 0.6 },
    }),
    [],
  );

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.set(color);
      materialRef.current.uniforms.power.value = power;
      materialRef.current.uniforms.intensity.value = intensity;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[0.3, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          uniform float power;
          uniform float intensity;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
            fresnel = pow(fresnel, power);
            gl_FragColor = vec4(color, fresnel * intensity);
          }
        `}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

const earBaseMat = new THREE.MeshStandardMaterial({
  color: "#f0f0f0",
  roughness: 0.5,
});
const earRingMat = new THREE.MeshStandardMaterial({
  color: "#ffffff",
  roughness: 0.3,
});
const earCenterMat = new THREE.MeshStandardMaterial({
  color: "#cccccc",
  roughness: 0.8,
});
const antennaBaseMat = new THREE.MeshStandardMaterial({
  color: "#999999",
  roughness: 0.4,
  metalness: 0.5,
});
const antennaStickMat = new THREE.MeshStandardMaterial({
  color: "#d0d0d0",
  roughness: 0.4,
  metalness: 0.2,
});
const antennaTipMat = new THREE.MeshStandardMaterial({
  color: "#ff3366",
  roughness: 0.2,
  toneMapped: false,
});

function RobotEar({
  position,
  scale = 1,
  isLeft = false,
}: {
  position: [number, number, number];
  scale?: number;
  isLeft?: boolean;
}) {
  const dir = isLeft ? -1 : 1;

  return (
    <group position={position} scale={scale}>
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earBaseMat}
      >
        <cylinderGeometry args={[0.04, 0.04, 0.025, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earRingMat}
      >
        <torusGeometry args={[0.032, 0.008, 16, 32]} />
      </mesh>

      <mesh
        position={[dir * 0.012, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
        receiveShadow
        material={earCenterMat}
      >
        <cylinderGeometry args={[0.03, 0.03, 0.005, 32]} />
      </mesh>

      <group position={[dir * 0.015, 0.035, 0]} rotation={[-0.4, 0, 0]}>
        <mesh
          position={[0, 0.01, 0]}
          castShadow
          receiveShadow
          material={antennaBaseMat}
        >
          <cylinderGeometry args={[0.006, 0.008, 0.02, 16]} />
        </mesh>
        <mesh
          position={[0, 0.06, 0]}
          castShadow
          receiveShadow
          material={antennaStickMat}
        >
          <cylinderGeometry args={[0.003, 0.003, 0.1, 8]} />
        </mesh>
        <mesh
          position={[0, 0.11, 0]}
          castShadow
          receiveShadow
          material={antennaTipMat}
        >
          <sphereGeometry args={[0.006, 16, 16]} />
        </mesh>
      </group>
    </group>
  );
}

const eyeMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color(2, 2, 2),
  toneMapped: false,
  transparent: true,
});
const heartMat = new THREE.MeshBasicMaterial({
  color: "#ff3366",
  toneMapped: false,
});

function RobotEye({
  position,
  rotation,
  scale = 1,
  blinkDuration = 0.15,
  blinkCycle = 3.0,
  isLovedRef,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  blinkDuration?: number;
  blinkCycle?: number;
  isLovedRef: React.MutableRefObject<boolean>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const normalEyesRef = useRef<THREE.Group>(null);
  const heartEyeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !normalEyesRef.current || !heartEyeRef.current)
      return;

    const isHeart = isLovedRef.current;

    normalEyesRef.current.visible = !isHeart;
    heartEyeRef.current.visible = isHeart;

    const cycle = clock.getElapsedTime() % blinkCycle;

    let targetScaleY = 1;

    if (cycle < blinkDuration && !isHeart) {
      const progress = cycle / blinkDuration;
      const blinkClose = Math.sin(progress * Math.PI);

      targetScaleY = Math.max(0.05, 1.0 - blinkClose);
    }

    groupRef.current.scale.set(scale, scale * targetScaleY, scale);
  });

  const { topPath, bottomPath } = useMemo(() => {
    const w = 0.025;
    const h = 0.035;
    const r = 0.02;
    const g = 0.005;

    const tPath = new THREE.CurvePath<THREE.Vector3>();
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, g, 0),
        new THREE.Vector3(-w, h - r, 0),
      ),
    );
    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, h - r, 0),
        new THREE.Vector3(-w, h, 0),
        new THREE.Vector3(-w + r, h, 0),
      ),
    );
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, h, 0),
        new THREE.Vector3(w - r, h, 0),
      ),
    );
    tPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, h, 0),
        new THREE.Vector3(w, h, 0),
        new THREE.Vector3(w, h - r, 0),
      ),
    );
    tPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, h - r, 0),
        new THREE.Vector3(w, g, 0),
      ),
    );

    const bPath = new THREE.CurvePath<THREE.Vector3>();
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w, -g, 0),
        new THREE.Vector3(-w, -(h - r), 0),
      ),
    );
    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-w, -(h - r), 0),
        new THREE.Vector3(-w, -h, 0),
        new THREE.Vector3(-w + r, -h, 0),
      ),
    );
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-w + r, -h, 0),
        new THREE.Vector3(w - r, -h, 0),
      ),
    );
    bPath.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(w - r, -h, 0),
        new THREE.Vector3(w, -h, 0),
        new THREE.Vector3(w, -(h - r), 0),
      ),
    );
    bPath.add(
      new THREE.LineCurve3(
        new THREE.Vector3(w, -(h - r), 0),
        new THREE.Vector3(w, -g, 0),
      ),
    );

    return { topPath: tPath, bottomPath: bPath };
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh ref={heartEyeRef} visible={false} material={heartMat}>
        <tubeGeometry args={[sharedHeartCurve, 64, 0.0035, 8, true]} />
      </mesh>

      <group ref={normalEyesRef}>
        <mesh material={eyeMat}>
          <tubeGeometry args={[topPath, 20, 0.0035, 8, false]} />
        </mesh>
        <mesh material={eyeMat}>
          <tubeGeometry args={[bottomPath, 20, 0.0035, 8, false]} />
        </mesh>
      </group>
    </group>
  );
}

function generatePbrTexturesAsync(): Promise<{
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const size = 512;
      const canvasC = document.createElement("canvas");
      const canvasB = document.createElement("canvas");
      canvasC.width = canvasB.width = size;
      canvasC.height = canvasB.height = size;
      const ctxC = canvasC.getContext("2d");
      const ctxB = canvasB.getContext("2d");

      if (ctxC && ctxB) {
        ctxC.fillStyle = "#dcdcdc";
        ctxC.fillRect(0, 0, size, size);
        ctxB.fillStyle = "#808080";
        ctxB.fillRect(0, 0, size, size);

        for (let i = 0; i < 10000; i++) {
          const x = Math.random() * size;
          const y = Math.random() * size;
          const r = 0.5 + Math.random() * 1.5;
          const isDark = Math.random() > 0.15;

          ctxC.beginPath();
          ctxC.arc(x, y, r, 0, Math.PI * 2);
          ctxC.fillStyle = isDark ? "#222222" : "#dddddd";
          ctxC.fill();

          ctxB.beginPath();
          ctxB.arc(x, y, r, 0, Math.PI * 2);
          ctxB.fillStyle = isDark ? "#000000" : "#ffffff";
          ctxB.fill();
        }
      }

      const texC = new THREE.CanvasTexture(canvasC);
      const texB = new THREE.CanvasTexture(canvasB);
      texC.wrapS = texB.wrapS = THREE.RepeatWrapping;
      texC.wrapT = texB.wrapT = THREE.RepeatWrapping;

      texC.repeat.set(6, 3);
      texB.repeat.set(6, 3);
      texC.needsUpdate = true;
      texB.needsUpdate = true;

      resolve({ colorMap: texC, bumpMap: texB });
    }, 0);
  });
}

export function RobotPrototype({
  neckParams = {
    baseR: 0.25,
    baseH: -0.01,
    midR: 0.23,
    midH: 0.02,
    lipBottomR: 0.27,
    lipBottomH: 0.025,
    lipTopR: 0.28,
    lipTopH: 0.05,
    innerR: 0.24,
    innerDropH: 0.03,
  },
  bodyParams = { bodyBevelR: 0.21, bodyBevelY: 0.38, bodyBevelT: 0.015 },
  color = "#c4c4c4",
  pantallaColor = "#00ffc6",
  pantallaBrillo = 1.2,
  blinkCycle = 3.0,
  metalness = 0.0,
  lookState = "idle",
  success = false
}: {
  neckParams?: any;
  bodyParams?: any;
  color?: string;
  pantallaColor?: string;
  pantallaBrillo?: number;
  blinkCycle?: number;
  metalness?: number;
  lookState?: "idle" | "email" | "password";
  success?: boolean;
}) {
  const walkTimeRef = useRef(0);
  const isLovedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const [textures, setTextures] = useState<{
    colorMap: THREE.CanvasTexture | null;
    bumpMap: THREE.CanvasTexture | null;
  }>({ colorMap: null, bumpMap: null });

  const design = {
    pantallaColor: pantallaColor,
    pantallaGrosor: 3.8,
    pantallaBrillo: pantallaBrillo,
    separacionOjos: 0.07,
    tamañoOrejas: 1.3,
    escalaOjos: 1.1,
    parpadeoFrecuencia: blinkCycle,
    parpadeoDuracion: 0.45,
    colorChasis: color,
    alturaCabeza: 0.6,
  };

  const config = {
    moveSpeed: 4.8,
    bodyRotSpeed: 8.0,
    headRotSpeed: 16.0,
    bodyTiltX: 0.05,
    bodyTiltY: 0.85,
    headLookX: 0.45,
    headLookY: 1.6,
  };

  useEffect(() => {
    isLovedRef.current = success;
  }, [success]);

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) return;

    const dt = Math.min(delta, 0.1);

    let tx = state.pointer.x;
    let ty = state.pointer.y;

    if (lookState === "password") {
      tx = -1.0;
      ty = 0.5;
    } else if (lookState === "email") {
      tx = 0.6;
      ty = -0.1;
    }

    const vw = state.viewport.width;
    const vh = state.viewport.height;
    const isNarrow = vw < 4.5;

    let targetPosX: number;
    let targetPosY: number;

    if (isNarrow) {
      // On narrow/mobile screens, keep it centered above the login block
      targetPosX = THREE.MathUtils.clamp(tx * 0.4, -0.4, 0.4);
      targetPosY = 0.2;
    } else {
      // Full-screen desktop view:
      // The login card is centered in the right column at x = +vw * 0.25.
      // Left edge of the login card with safety buffer:
      const screenW = typeof window !== "undefined" ? window.innerWidth : 1440;
      const cardHalfWidthIn3D = (208 / screenW) * vw;
      const cardLeftEdge = (vw * 0.25) - cardHalfWidthIn3D;

      // The robot can walk "more far" across the entire left and center of the website,
      // but strictly stops before the login block (maxX) so it never touches or goes behind it.
      const maxX = cardLeftEdge - 0.6;
      const minX = -vw * 0.40;

      // Map cursor movement across the screen to [minX, maxX]
      const normalizedMouseX = Math.max(0, Math.min(1, (tx + 0.85) / 1.5));
      targetPosX = THREE.MathUtils.lerp(minX, maxX, normalizedMouseX);

      // Flexible vertical movement following cursor
      targetPosY = THREE.MathUtils.clamp(ty * (vh * 0.32) - 0.2, -1.2, 1.2);
    }

    // Dynamic walking / hover physics
    const currentPosX = bodyRef.current.position.x;
    const currentPosY = bodyRef.current.position.y;
    const dist = Math.hypot(targetPosX - currentPosX, targetPosY - currentPosY);
    const isMoving = dist > 0.05;

    walkTimeRef.current += dt * (isMoving ? 9.0 : 2.5);
    const walkBob = Math.sin(walkTimeRef.current) * (isMoving ? 0.07 : 0.02);
    const walkSway = Math.cos(walkTimeRef.current * 0.5) * (isMoving ? 0.05 : 0.015);

    // Highly responsive, agile, flexible lerp
    bodyRef.current.position.x = THREE.MathUtils.lerp(
      currentPosX,
      targetPosX,
      config.moveSpeed * dt,
    );
    bodyRef.current.position.y = THREE.MathUtils.lerp(
      currentPosY,
      targetPosY + walkBob,
      config.moveSpeed * dt,
    );

    // Dynamic body and head rotation tracking mouse anywhere across the entire website
    const relativeX = tx - bodyRef.current.position.x / (vw / 2.2);
    const bodyTargetRotY = -relativeX * config.bodyTiltY;
    const bodyTargetRotX = (isMoving ? 0.08 : 0.0) - ty * 0.15;
    const bodyTargetRotZ = -relativeX * 0.12 + walkSway;

    bodyRef.current.rotation.y = THREE.MathUtils.lerp(
      bodyRef.current.rotation.y,
      bodyTargetRotY,
      config.bodyRotSpeed * dt,
    );
    bodyRef.current.rotation.x = THREE.MathUtils.lerp(
      bodyRef.current.rotation.x,
      bodyTargetRotX,
      config.bodyRotSpeed * dt,
    );
    bodyRef.current.rotation.z = THREE.MathUtils.lerp(
      bodyRef.current.rotation.z,
      bodyTargetRotZ,
      config.bodyRotSpeed * dt,
    );

    const headTargetRotY = relativeX * config.headLookY;
    const headTargetRotX = -ty * config.headLookX;

    headRef.current.rotation.y = THREE.MathUtils.lerp(
      headRef.current.rotation.y,
      headTargetRotY,
      config.headRotSpeed * dt,
    );
    headRef.current.rotation.x = THREE.MathUtils.lerp(
      headRef.current.rotation.x,
      headTargetRotX,
      config.headRotSpeed * dt,
    );
  });

  useEffect(() => {
    let mounted = true;
    let generatedMaps: {
      colorMap: THREE.CanvasTexture;
      bumpMap: THREE.CanvasTexture;
    } | null = null;

    generatePbrTexturesAsync().then((res) => {
      if (mounted) {
        generatedMaps = res;
        setTextures(res);
      } else {
        res.colorMap.dispose();
        res.bumpMap.dispose();
      }
    });

    return () => {
      mounted = false;

      if (generatedMaps) {
        generatedMaps.colorMap.dispose();
        generatedMaps.bumpMap.dispose();
      }
    };
  }, []);

  const handlePointerDown = (
    e: import("@react-three/fiber").ThreeEvent<PointerEvent>,
  ) => {
    e.stopPropagation();
    isLovedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isLovedRef.current = false;
    }, 2000);
  };

  const neckProfile = useMemo(() => {
    const points = [];
    points.push(new THREE.Vector2(neckParams.innerR, neckParams.baseH));
    points.push(new THREE.Vector2(neckParams.baseR, neckParams.baseH));
    points.push(new THREE.Vector2(neckParams.midR, neckParams.midH));
    points.push(
      new THREE.Vector2(neckParams.lipBottomR, neckParams.lipBottomH),
    );
    points.push(new THREE.Vector2(neckParams.lipTopR, neckParams.lipTopH));
    points.push(new THREE.Vector2(neckParams.innerR, neckParams.lipTopH));
    points.push(
      new THREE.Vector2(
        neckParams.innerR,
        neckParams.lipTopH - neckParams.innerDropH,
      ),
    );
    return points;
  }, [neckParams]);

  const headMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "#111111",
      roughness: 1.0,
      metalness: 0.0,
    });
  }, []);

  if (!textures.colorMap) return null;

  return (
    <group
      ref={bodyRef}
      position={[-0.8, -0.2, 0]}
      onPointerDown={handlePointerDown}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry
          args={[0.43, 64, 64, 0, Math.PI * 2, Math.PI * 0.15, Math.PI * 0.85]}
        />
        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap || null}
          bumpMap={textures.bumpMap || null}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      {bodyParams.bodyBevelT > 0 && (
        <mesh
          position={[0, bodyParams.bodyBevelY, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <torusGeometry
            args={[bodyParams.bodyBevelR, bodyParams.bodyBevelT, 32, 64]}
          />
          <meshStandardMaterial
            color={design.colorChasis}
            map={textures.colorMap || undefined}
            bumpMap={textures.bumpMap || undefined}
            bumpScale={0.005}
            roughness={1.0}
            metalness={metalness}
            envMapIntensity={0.0}
          />
        </mesh>
      )}

      <mesh position={[0, 0.38, 0]} receiveShadow castShadow>
        <latheGeometry args={[neckProfile, 64]} />
        <meshStandardMaterial
          color={design.colorChasis}
          map={textures.colorMap || null}
          bumpMap={textures.bumpMap || null}
          bumpScale={0.005}
          roughness={1.0}
          metalness={metalness}
          envMapIntensity={0.0}
        />
      </mesh>

      <group ref={headRef} position={[0, design.alturaCabeza, 0]}>
        <mesh material={headMat} castShadow receiveShadow>
          <sphereGeometry args={[0.28, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
        </mesh>

        <GlassCapsule
          color={design.pantallaColor}
          power={design.pantallaGrosor}
          intensity={design.pantallaBrillo}
        />

        <group position={[0, -0.02, 0.29]}>
          <RobotEye
            position={[-design.separacionOjos, 0, 0]}
            rotation={[0, -0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
            isLovedRef={isLovedRef}
          />
          <RobotEye
            position={[design.separacionOjos, 0, 0]}
            rotation={[0, 0.2, 0]}
            scale={design.escalaOjos}
            blinkDuration={design.parpadeoDuracion}
            blinkCycle={design.parpadeoFrecuencia}
            isLovedRef={isLovedRef}
          />
        </group>

        <RobotEar
          position={[-0.29, 0, 0]}
          isLeft={true}
          scale={design.tamañoOrejas}
        />
        <RobotEar
          position={[0.29, 0, 0]}
          isLeft={false}
          scale={design.tamañoOrejas}
        />
      </group>
    </group>
  );
}

export function LuxuryMascotFallback({
  lookState,
  success,
}: {
  lookState: 'idle' | 'email' | 'password';
  success: boolean;
}) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Compute head and eye offsets based on state and mouse
  let targetTiltY = mouse.x * 16;
  let targetTiltX = -mouse.y * 12;
  let eyeOffsetX = mouse.x * 6;
  let eyeOffsetY = mouse.y * 4;

  if (lookState === "email") {
    targetTiltY = 22;
    targetTiltX = 6;
    eyeOffsetX = 12;
    eyeOffsetY = 2;
  } else if (lookState === "password") {
    targetTiltY = -28;
    targetTiltX = -12;
    eyeOffsetX = -14;
    eyeOffsetY = -4;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center lg:justify-start lg:pl-[18vw] pointer-events-none z-10">
      <style>{`
        @keyframes mascotHover {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes mascotShadow {
          0%, 100% { transform: scale(1); opacity: 0.45; }
          50% { transform: scale(0.85); opacity: 0.22; }
        }
        @keyframes mascotBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.08); }
        }
        @keyframes heartPulse {
          0%, 100% { transform: scale(1.1); filter: drop-shadow(0 0 10px #ff3366); }
          50% { transform: scale(1.35); filter: drop-shadow(0 0 18px #ff6699); }
        }
      `}</style>

      <div className="relative flex flex-col items-center">
        {/* Floating Robot Body & Head Container */}
        <div 
          className="relative transition-transform duration-300 ease-out"
          style={{ 
            animation: "mascotHover 3.4s ease-in-out infinite",
            transform: `perspective(700px) rotateY(${targetTiltY}deg) rotateX(${targetTiltX}deg)`,
          }}
        >
          {/* Head & Ear Antennas Group */}
          <div className="relative flex items-center justify-center z-20">
            {/* Left Ear Antenna */}
            <div className="absolute -left-5 top-7 flex flex-col items-center">
              <div 
                className="w-2.5 h-2.5 rounded-full mb-1 transition-all duration-300"
                style={{ 
                  backgroundColor: success ? "#ff3366" : "#ff3366",
                  boxShadow: "0 0 10px #ff3366",
                }} 
              />
              <div className="w-2.5 h-8 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-600 border border-neutral-400/40 shadow-sm" />
            </div>

            {/* Right Ear Antenna */}
            <div className="absolute -right-5 top-7 flex flex-col items-center">
              <div 
                className="w-2.5 h-2.5 rounded-full mb-1 transition-all duration-300"
                style={{ 
                  backgroundColor: success ? "#ff3366" : "#ff3366",
                  boxShadow: "0 0 10px #ff3366",
                }} 
              />
              <div className="w-2.5 h-8 rounded-full bg-gradient-to-b from-neutral-300 to-neutral-600 border border-neutral-400/40 shadow-sm" />
            </div>

            {/* Head Dome */}
            <div 
              className="relative w-36 h-28 rounded-[2.2rem] flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden"
              style={{
                background: "radial-gradient(circle at 45% 30%, #323338 0%, #17181c 65%, #0c0d10 100%)",
                boxShadow: "0 0 28px rgba(255, 51, 102, 0.4), inset 0 2px 5px rgba(255, 255, 255, 0.25)",
                border: "2px solid rgba(255, 51, 102, 0.35)",
              }}
            >
              {/* Visor Glass Curvature Gloss Highlight */}
              <div className="absolute top-1 inset-x-3 h-7 rounded-t-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              {/* Face Display Screen */}
              <div 
                className="relative flex items-center gap-5 transition-transform duration-200"
                style={{
                  transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
                }}
              >
                {success ? (
                  // Heart Eyes on Success
                  <div className="flex items-center gap-5" style={{ animation: "heartPulse 1.2s ease-in-out infinite" }}>
                    <svg className="w-7 h-7 text-[#ff3366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <svg className="w-7 h-7 text-[#ff3366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                ) : lookState === "password" ? (
                  // Shy / Looking Away Squint Eyes
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-5">
                      <div className="w-5 h-2.5 border-t-[3.5px] border-[#ff3366] rounded-t-full shadow-[0_0_10px_#ff3366]" />
                      <div className="w-5 h-2.5 border-t-[3.5px] border-[#ff3366] rounded-t-full shadow-[0_0_10px_#ff3366]" />
                    </div>
                    {/* Blushing cheeks */}
                    <div className="flex items-center gap-8 mt-1.5 opacity-80">
                      <div className="w-3.5 h-1.5 rounded-full bg-[#ff3366]/60 blur-[1px]" />
                      <div className="w-3.5 h-1.5 rounded-full bg-[#ff3366]/60 blur-[1px]" />
                    </div>
                  </div>
                ) : (
                  // Normal Digital Glowing Eyes with Blink
                  <div 
                    className="flex items-center gap-6"
                    style={{ animation: "mascotBlink 3.8s ease-in-out infinite" }}
                  >
                    <div 
                      className="w-3.5 h-6 rounded-full bg-[#ff3366] shadow-[0_0_14px_#ff3366] border border-white/40 transition-all duration-300"
                      style={{
                        transform: lookState === "email" ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                    <div 
                      className="w-3.5 h-6 rounded-full bg-[#ff3366] shadow-[0_0_14px_#ff3366] border border-white/40 transition-all duration-300"
                      style={{
                        transform: lookState === "email" ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Neck Collar Joint */}
          <div className="relative -mt-2 mx-auto w-24 h-4 rounded-full bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 border border-neutral-700 shadow-inner z-10" />

          {/* Spherical Pearlescent Chassis Body */}
          <div 
            className="relative -mt-2 w-48 h-44 rounded-full shadow-2xl overflow-hidden border border-white/40"
            style={{
              background: "radial-gradient(circle at 35% 28%, #ffffff 0%, #f4f0e9 40%, #ddd6cb 75%, #b2aba0 100%)",
              boxShadow: "0 18px 38px rgba(0, 0, 0, 0.45), inset 0 2px 8px rgba(255, 255, 255, 0.9)",
            }}
          >
            {/* Soft Ambient Rim Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40 pointer-events-none" />
            {/* Subtle Chest Status Glow */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#ff3366]/40 blur-[1px]" />
          </div>
        </div>

        {/* Dynamic Ground Contact Shadow */}
        <div 
          className="mt-6 w-36 h-4 rounded-full bg-black/50 blur-md transition-all duration-300"
          style={{ animation: "mascotShadow 3.4s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return Boolean(gl && (gl as any) instanceof WebGLRenderingContext);
  } catch (e) {
    return false;
  }
}

class ErrorBoundary extends Component<{fallback: ReactNode; children: ReactNode}, {hasError: boolean}> {
  constructor(props: {fallback: ReactNode; children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("WebGL robot canvas failed, displaying luxury interactive mascot fallback:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function RobotMascot({ lookState, success }: { lookState: 'idle' | 'email' | 'password', success: boolean }) {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    setHasWebGL(checkWebGLSupport());
  }, []);

  const fallbackUI = <LuxuryMascotFallback lookState={lookState} success={success} />;

  // If WebGL is definitely not supported, render luxury fallback directly (avoids any console errors)
  if (hasWebGL === false) {
    return (
      <div className="w-full h-full relative pointer-events-none">
        {fallbackUI}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative pointer-events-none">
      <ErrorBoundary fallback={fallbackUI}>
        <Canvas 
          shadows 
          gl={{ powerPreference: "default", failIfMajorPerformanceCaveat: false, antialias: true, alpha: true }}
          camera={{ position: [0, 0.5, 6], fov: 40 }}
          eventSource={typeof window !== "undefined" ? document.body : undefined}
          eventPrefix="client"
        >
          <ambientLight intensity={1.5} color="#ffffff" />
          <directionalLight position={[0, 6, 3]} intensity={1.2} castShadow />
          <Environment preset="studio" blur={0.5} />
          <group scale={1.0}>
            <ContactShadows position={[0, -0.7, 0]} opacity={0.6} scale={20} blur={1.5} />
            <RobotPrototype lookState={lookState} success={success} color="#e0e0e0" pantallaColor="#ff3366" />
          </group>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}