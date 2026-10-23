import type { SceneSpec } from "@/lib/types";

/**
 * Temsilî görsel üreticisi. Telifsiz: tamamen kodla, ilan tohumundan (seed) çizilir.
 * Gerçek fotoğraflar geldiğinde `property_media` tablosundaki görseller bunun yerine kullanılır.
 * Görünüm: 0 dış cephe · 1 teras/havuz · 2 iç mekân · 3 kuşbakışı · 4 akşam
 */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SKIES = {
  day: { top: "#9cc7e3", mid: "#cfe3ee", bottom: "#f4efe5", sun: "#fff6dc", sea: ["#2f7fb3", "#155a8a"], hill: ["#9fb4a6", "#7c9688"] },
  golden: { top: "#e9b48a", mid: "#f4d3b0", bottom: "#fbeedd", sun: "#fff1cf", sea: ["#3f7fa6", "#22587d"], hill: ["#b7a58d", "#93856f"] },
  dusk: { top: "#3d4a6e", mid: "#a77b8a", bottom: "#eeb48f", sun: "#ffd9a8", sea: ["#33557d", "#1d3656"], hill: ["#5e5f78", "#47485f"] },
} as const;

type Props = { spec: SceneSpec; view?: number; className?: string; label?: string; /** Binaları sağa yasla (metin solda kalsın) */ align?: "auto" | "right" };

export default function Scene({ spec, view = 0, className, label, align = "auto" }: Props) {
  const r = rng(spec.seed * 31 + view * 7919);
  const time = view === 4 ? "dusk" : spec.time;
  const sky = SKIES[time];
  const id = `s${spec.seed}v${view}`;
  const W = 800;
  const H = 520;
  const horizon = 250 + Math.round(r() * 40);

  const hill = (y: number, amp: number, steps: number) => {
    let d = `M0 ${H} L0 ${y}`;
    for (let i = 0; i <= steps; i++) {
      const x = (W / steps) * i;
      d += ` Q${x - W / steps / 2} ${y - amp * (0.4 + r())} ${x} ${y - amp * r() * 0.6}`;
    }
    return d + ` L${W} ${H} Z`;
  };

  const sunX = 120 + r() * 560;
  const sunY = time === "day" ? 70 + r() * 40 : horizon - 30 - r() * 30;

  const isInterior = view === 2 && spec.kind !== "land";
  const isAerial = view === 3;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={label ?? "Temsilî görsel"}
    >
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="0.55" stopColor={sky.mid} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
        <linearGradient id={`${id}sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.sea[0]} />
          <stop offset="1" stopColor={sky.sea[1]} />
        </linearGradient>
        <linearGradient id={`${id}pool`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fd3e0" />
          <stop offset="1" stopColor="#2aa0b8" />
        </linearGradient>
        <linearGradient id={`${id}wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbfaf6" />
          <stop offset="1" stopColor={time === "dusk" ? "#d9cfc8" : "#ebe6dc"} />
        </linearGradient>
        <linearGradient id={`${id}stone`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e3d2b6" />
          <stop offset="1" stopColor="#c7b08d" />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor={sky.sun} stopOpacity="0.9" />
          <stop offset="1" stopColor={sky.sun} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill={`url(#${id}sky)`} />
      <circle cx={sunX} cy={sunY} r={120} fill={`url(#${id}glow)`} />
      <circle cx={sunX} cy={sunY} r={time === "day" ? 22 : 30} fill={sky.sun} opacity={0.95} />

      {/* uzak ada ve tepeler */}
      <path d={hill(horizon, 40, 5)} fill={sky.hill[0]} opacity={0.55} />
      <rect y={horizon} width={W} height={H - horizon} fill={`url(#${id}sea)`} />
      {Array.from({ length: 14 }).map((_, i) => (
        <rect
          key={i}
          x={r() * W}
          y={horizon + 8 + r() * 90}
          width={20 + r() * 60}
          height={1.5}
          rx={1}
          fill="#ffffff"
          opacity={0.25 + r() * 0.3}
        />
      ))}
      <path d={hill(horizon + 70 + r() * 30, 60, 4)} fill={sky.hill[1]} />

      {isInterior ? (
        <Interior id={id} r={r} />
      ) : spec.kind === "land" ? (
        <Land r={r} horizon={horizon} aerial={isAerial} />
      ) : (
        <Buildings id={id} kind={spec.kind} r={r} view={view} aerial={isAerial} right={align === "right"} />
      )}
    </svg>
  );
}

type R = () => number;

function Olive({ x, y, s, r }: { x: number; y: number; s: number; r: R }) {
  return (
    <g>
      <rect x={x - 2 * s} y={y} width={4 * s} height={16 * s} fill="#6b5a45" />
      <ellipse cx={x} cy={y - 4 * s} rx={16 * s} ry={12 * s} fill="#7d8f63" />
      <ellipse cx={x - 7 * s} cy={y - 8 * s} rx={9 * s} ry={7 * s} fill="#91a374" opacity={0.8 + r() * 0.2} />
    </g>
  );
}

function Cypress({ x, y, h }: { x: number; y: number; h: number }) {
  return <ellipse cx={x} cy={y - h / 2} rx={h / 7} ry={h / 2} fill="#4f6b4f" />;
}

function Bougainvillea({ x, y, r }: { x: number; y: number; r: R }) {
  return (
    <g>
      {Array.from({ length: 16 }).map((_, i) => (
        <circle key={i} cx={x + (r() - 0.5) * 60} cy={y + (r() - 0.5) * 26} r={4 + r() * 5} fill={i % 3 ? "#c73e78" : "#e0619a"} opacity={0.9} />
      ))}
    </g>
  );
}

function Land({ r, horizon, aerial }: { r: R; horizon: number; aerial: boolean }) {
  const top = horizon + 110;
  return (
    <g>
      <path d={`M0 ${top} Q400 ${top - 30} 800 ${top + 10} L800 520 L0 520 Z`} fill="#d8c79a" />
      <path d={`M0 ${top + 40} Q400 ${top + 10} 800 ${top + 50} L800 520 L0 520 Z`} fill="#c9b47f" />
      <path d={`M360 520 Q420 ${top + 60} 470 ${top + 8}`} stroke="#eadcb8" strokeWidth={14} fill="none" opacity={0.8} />
      {Array.from({ length: aerial ? 30 : 16 }).map((_, i) => {
        const row = Math.floor(i / (aerial ? 6 : 4));
        const col = i % (aerial ? 6 : 4);
        const s = aerial ? 0.6 : 1 + row * 0.25;
        return <Olive key={i} r={r} s={s} x={60 + col * (aerial ? 130 : 200) + r() * 40 + (row % 2) * 50} y={top + 20 + row * (aerial ? 26 : 38)} />;
      })}
    </g>
  );
}

function Buildings({ id, kind, r, view, aerial, right }: { id: string; kind: SceneSpec["kind"]; r: R; view: number; aerial: boolean; right: boolean }) {
  const ground = 400;
  const s = aerial ? 0.8 : view === 1 ? 1.15 : right ? 0.85 : 1;
  const ox = right ? 380 : aerial ? 120 + r() * 80 : view === 1 ? -80 : 80 + r() * 120;
  const stone = kind === "detached";
  const wall = stone ? `url(#${id}stone)` : `url(#${id}wall)`;

  const blocks: { x: number; y: number; w: number; h: number }[] = [];
  if (kind === "apartment" || kind === "residence") {
    const floors = kind === "residence" ? 4 : 3;
    blocks.push({ x: 0, y: -floors * 52, w: 360, h: floors * 52 });
    if (kind === "residence") blocks.push({ x: 380, y: -2 * 52, w: 200, h: 2 * 52 });
  } else if (kind === "project") {
    for (let i = 0; i < 4; i++) blocks.push({ x: i * 150, y: -70 - i * 34, w: 130, h: 70 + i * 34 });
  } else {
    blocks.push({ x: 0, y: -120, w: 240, h: 120 });
    blocks.push({ x: 160, y: -190, w: 170, h: 80 });
    if (kind === "villa") blocks.push({ x: 340, y: -90, w: 150, h: 90 });
  }

  return (
    <g>
      {/* zemin ve teras */}
      <path d={`M0 ${ground - 20} Q400 ${ground - 50} 800 ${ground - 10} L800 520 L0 520 Z`} fill="#a9b48f" />
      <rect x={0} y={ground} width={800} height={120} fill="#e8dcc6" />
      <rect x={0} y={ground} width={800} height={6} fill="#d6c6a8" />

      <Cypress x={ox - 40 * s + 20} y={ground} h={150 * s} />
      <Cypress x={ox + 600 * s} y={ground} h={120 * s} />

      <g transform={`translate(${ox} ${ground}) scale(${s})`}>
        {blocks.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={wall} />
            <rect x={b.x - 6} y={b.y - 8} width={b.w + 12} height={8} fill={stone ? "#b99d75" : "#f7f4ee"} />
            <rect x={b.x + b.w - 14} y={b.y} width={14} height={b.h} fill="#000" opacity={0.06} />
            {/* pencereler */}
            {Array.from({ length: Math.max(1, Math.floor(b.h / 52)) }).map((_, fl) =>
              Array.from({ length: Math.max(1, Math.floor(b.w / 70)) }).map((__, wi) => (
                <g key={`${fl}-${wi}`}>
                  <rect
                    x={b.x + 16 + wi * 70}
                    y={b.y + 12 + fl * 52}
                    width={kind === "apartment" || kind === "residence" ? 44 : 50}
                    height={34}
                    rx={stone ? 14 : 2}
                    fill={view === 4 ? "#ffd38a" : "#2e4a5f"}
                    opacity={view === 4 ? 0.9 : 0.85}
                  />
                  {(kind === "apartment" || kind === "residence") && (
                    <rect x={b.x + 10 + wi * 70} y={b.y + 44 + fl * 52} width={56} height={4} fill="#9aa6ad" />
                  )}
                </g>
              )),
            )}
          </g>
        ))}
        {/* pergola */}
        {kind !== "apartment" && kind !== "project" && (
          <g>
            <rect x={-60} y={-100} width={70} height={5} fill="#8b6b4a" />
            <rect x={-56} y={-100} width={4} height={100} fill="#8b6b4a" />
            <rect x={2} y={-100} width={4} height={100} fill="#8b6b4a" />
          </g>
        )}
      </g>

      {/* havuz */}
      {(kind === "villa" || kind === "residence" || kind === "project" || view === 1) && (
        <g>
          <rect x={aerial ? 220 : view === 1 ? 160 : 260 + r() * 100} y={ground + 26} width={aerial ? 160 : 320} height={aerial ? 30 : 46} rx={4} fill={`url(#${id}pool)`} />
          <rect x={aerial ? 230 : view === 1 ? 175 : 275 + r() * 100} y={ground + 34} width={90} height={2} fill="#fff" opacity={0.6} />
        </g>
      )}

      {/* şezlonglar (teras görünümü) */}
      {view === 1 &&
        [0, 1].map((i) => (
          <g key={i} transform={`translate(${520 + i * 110} ${ground + 70})`}>
            <rect width={80} height={10} rx={3} fill="#f5efe4" />
            <rect x={60} y={-14} width={22} height={18} rx={3} fill="#f5efe4" transform="rotate(-20 60 0)" />
            <rect x={6} y={10} width={3} height={12} fill="#8b6b4a" />
            <rect x={70} y={10} width={3} height={12} fill="#8b6b4a" />
          </g>
        ))}

      {!aerial && <Bougainvillea x={ox + 30} y={ground - 30} r={r} />}
      {!aerial && <Olive x={720} y={ground - 10} s={1.4} r={r} />}
    </g>
  );
}

function Interior({ id, r }: { id: string; r: R }) {
  return (
    <g>
      {/* iç duvar çerçevesi: geniş pencereden manzara */}
      <path d="M0 0 H800 V520 H0 Z M90 60 V400 H710 V60 Z" fill="#efe9df" fillRule="evenodd" />
      <rect x={90} y={60} width={620} height={340} fill="none" stroke="#3a3a3a" strokeWidth={6} />
      <rect x={397} y={60} width={6} height={340} fill="#3a3a3a" />
      <rect x={0} y={400} width={800} height={120} fill="#d9c7a7" />
      <rect x={0} y={400} width={800} height={4} fill="#c3ad88" />
      {/* kanepe */}
      <g transform="translate(170 380)">
        <rect x={0} y={20} width={300} height={60} rx={14} fill="#f4efe6" />
        <rect x={0} y={-10} width={300} height={40} rx={14} fill="#ebe3d6" />
        <rect x={30} y={0} width={60} height={30} rx={8} fill="#c9905f" />
        <rect x={210} y={0} width={60} height={30} rx={8} fill="#5e7f8f" />
      </g>
      {/* sehpa, bitki */}
      <ellipse cx={560} cy={470} rx={70} ry={12} fill="#a68560" />
      <rect x={600} y={330} width={50} height={70} rx={8} fill="#d6c5a8" />
      <ellipse cx={625} cy={310} rx={34} ry={40} fill="#6f8a5f" />
      <rect x={110} y={410} width={580} height={6} fill={`url(#${id}wall)`} opacity={0.4} />
      <Olive x={760} y={330} s={0.9} r={r} />
    </g>
  );
}
