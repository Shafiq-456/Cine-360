import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

function poster(m) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 440;
  const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 1024, 440);
  gr.addColorStop(0, m.c1 || "#0f172a");
  gr.addColorStop(1, m.c2 || "#4f7cff");
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 440);

  g.fillStyle = "#fff";
  g.font = "800 84px Inter, sans-serif";
  g.textAlign = "center";
  g.fillText(m.title || "CINE360 THEATRE", 512, 220);

  g.font = "500 32px Inter, sans-serif";
  g.fillStyle = "rgba(255, 255, 255, 0.85)";
  g.fillText((m.genre ? m.genre + " · " : "") + (m.minutes ? m.minutes + " min" : "IMMERSIVE 3D AUDITORIUM"), 512, 290);

  return new THREE.CanvasTexture(c);
}

function Seat({ s, heat, focus, onPick, onHover }) {
  const c = s.status === "booked"
    ? "#33384a"
    : s.status === "held"
    ? "#9a6727"
    : s.status === "mine"
    ? "#ffb703"
    : heat
    ? `hsl(${Math.round(s.score * 1.2)}, 75%, 48%)`
    : "#2ec4b6";

  const em = focus?.id === s.id ? 0.6 : 0;
  const emissiveColor = focus?.id === s.id ? "#4f7cff" : "#ffffff";

  return (
    <group
      position={[s.x, s.y + 0.25, s.z]}
      onClick={(e) => {
        e.stopPropagation();
        onPick && onPick(s);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover && onHover(s);
      }}
    >
      <mesh>
        <boxGeometry args={[0.55, 0.45, 0.5]} />
        <meshStandardMaterial color={c} emissive={emissiveColor} emissiveIntensity={em} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, 0.22]}>
        <boxGeometry args={[0.55, 0.5, 0.1]} />
        <meshStandardMaterial color={c} emissive={emissiveColor} emissiveIntensity={em} roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function Theatre3D({
  seats = [],
  screen: sc = { width: 16, height: 7, bottom: 1.6 },
  movie,
  mode = "overview",
  focus = null,
  heat = false,
  onPick = () => {},
  onHover = () => {}
}) {
  const movieObj = movie || {
    title: "CINE360 IMMERSIVE EXPERIENCE",
    genre: "DOLBY ATMOS & LASER 3D",
    minutes: 120,
    c1: "#0f172a",
    c2: "#4f7cff"
  };

  const tex = useMemo(() => poster(movieObj), [movieObj.title, movieObj.c1, movieObj.c2]);

  const maxZ = seats.length ? Math.max(...seats.map((s) => s.z)) : 14;
  const maxX = seats.length ? Math.max(...seats.map((s) => Math.abs(s.x))) + 1.5 : 8;
  const cy = sc.bottom + sc.height / 2;
  const rows = useMemo(() => [...new Map(seats.map((s) => [s.row, s])).values()], [seats]);

  const first = mode === "seat" && focus;
  const eye = first ? [focus.x, focus.y + 1.1, focus.z] : null;
  const look = first
    ? new THREE.Vector3(-eye[0], cy - eye[1], -eye[2]).normalize().multiplyScalar(0.1)
    : null;

  return (
    <Canvas style={{ width: "100%", height: "100%" }}>
      {first ? (
        <>
          <PerspectiveCamera key={focus.id} makeDefault fov={75} position={eye} />
          <OrbitControls
            key={"o" + focus.id}
            target={[eye[0] + look.x, eye[1] + look.y, eye[2] + look.z]}
            enableZoom={false}
            enablePan={false}
            rotateSpeed={-0.35}
          />
        </>
      ) : (
        <>
          <PerspectiveCamera key="ov" makeDefault fov={55} position={[0, maxZ * 0.6 + 6, maxZ + 12]} />
          <OrbitControls key="ovc" target={[0, 2, maxZ / 2]} maxPolarAngle={1.5} />
        </>
      )}

      <ambientLight intensity={1.2} />
      <directionalLight position={[0, 14, maxZ]} intensity={1.8} />
      <pointLight position={[0, cy, 2]} intensity={0.8} color="#4f7cff" />

      {/* Cinema Screen */}
      <mesh position={[0, cy, 0]}>
        <planeGeometry args={[sc.width, sc.height]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, cy, -0.05]}>
        <planeGeometry args={[sc.width + 0.6, sc.height + 0.6]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Auditorium Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, maxZ / 2]}>
        <planeGeometry args={[maxX * 2 + 8, maxZ + 14]} />
        <meshStandardMaterial color="#0d111e" roughness={0.8} />
      </mesh>

      {/* Stepped Rakes / Risers */}
      {rows.map((r) => (
        <mesh key={r.row} position={[0, r.y / 2, r.z]}>
          <boxGeometry args={[maxX * 2, r.y + 0.04, 1.05]} />
          <meshStandardMaterial color="#171e33" roughness={0.7} />
        </mesh>
      ))}

      {/* 3D Seats */}
      {seats.map((s) => (
        <Seat
          key={s.id}
          s={s}
          heat={heat}
          focus={focus}
          onPick={onPick}
          onHover={onHover}
        />
      ))}
    </Canvas>
  );
}
