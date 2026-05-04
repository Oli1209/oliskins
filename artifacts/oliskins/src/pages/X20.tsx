import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { BetPanel } from "../components/BetPanel";
import { parseBetToCents, canPlaceBet, resolveBet } from "../lib/minigames";
import { formatMoney } from "../lib/format";

// ─── Segment definitions ─────────────────────────────────────────────────────

type SlotColor = "black" | "red" | "blue" | "gold";

interface SlotDef {
  color: SlotColor;
  multiplier: number;
  label: string;
  count: number;
  fill: string;
  stroke: string;
  textFill: string;
  twText: string;
  twBorder: string;
}

const SLOT_DEFS: SlotDef[] = [
  { color: "black", multiplier: 2,  label: "Czarny",    count: 10, fill: "#0f172a", stroke: "#475569", textFill: "#cbd5e1", twText: "text-slate-300",  twBorder: "border-slate-500/60" },
  { color: "red",   multiplier: 3,  label: "Czerwony",  count: 7,  fill: "#450a0a", stroke: "#dc2626", textFill: "#fca5a5", twText: "text-red-300",    twBorder: "border-red-500/60"   },
  { color: "blue",  multiplier: 5,  label: "Niebieski", count: 4,  fill: "#0c1a3a", stroke: "#2563eb", textFill: "#93c5fd", twText: "text-blue-300",   twBorder: "border-blue-500/60"  },
  { color: "gold",  multiplier: 20, label: "Złoty",     count: 1,  fill: "#1c1200", stroke: "#ca8a04", textFill: "#fde047", twText: "text-yellow-300", twBorder: "border-yellow-400/70"},
];

const TOTAL_SLOTS = SLOT_DEFS.reduce((s, d) => s + d.count, 0);
const SEG_ANGLE = 360 / TOTAL_SLOTS;

function defFor(c: SlotColor) { return SLOT_DEFS.find((d) => d.color === c)!; }

function buildShuffledWheel(): SlotColor[] {
  const arr: SlotColor[] = [];
  for (const d of SLOT_DEFS) for (let i = 0; i < d.count; i++) arr.push(d.color);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickWinnerIndex(): number {
  return Math.floor(Math.random() * TOTAL_SLOTS);
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

const CX = 160, CY = 160, R_OUTER = 148, R_INNER = 34;

function polarXY(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function segPath(i: number): string {
  const [sx, sy] = polarXY(i * SEG_ANGLE, R_OUTER);
  const [ex, ey] = polarXY((i + 1) * SEG_ANGLE, R_OUTER);
  const [isx, isy] = polarXY(i * SEG_ANGLE, R_INNER);
  const [iex, iey] = polarXY((i + 1) * SEG_ANGLE, R_INNER);
  return `M ${isx} ${isy} L ${sx} ${sy} A ${R_OUTER} ${R_OUTER} 0 0 1 ${ex} ${ey} L ${iex} ${iey} A ${R_INNER} ${R_INNER} 0 0 0 ${isx} ${isy} Z`;
}

// ─── Wheel SVG ───────────────────────────────────────────────────────────────

interface WheelProps {
  slots: SlotColor[];
  rotation: number;
  transitioning: boolean;
  winningIdx: number | null;
  winnerColor: SlotColor | null;
}

function WheelSVG({ slots, rotation, transitioning, winningIdx, winnerColor }: WheelProps) {
  return (
    <div className="relative flex justify-center select-none">
      <div
        className="absolute z-10 pointer-events-none"
        style={{ top: 6, left: "50%", transform: "translateX(-50%)" }}
      >
        <svg width="24" height="28" viewBox="0 0 24 28">
          <polygon points="12,28 0,0 24,0" fill="#22d3ee" opacity="0.95" />
        </svg>
      </div>

      <svg
        width="320"
        height="320"
        viewBox="0 0 320 320"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: transitioning
            ? "transform 4000ms cubic-bezier(0.05, 0.85, 0.15, 1)"
            : "none",
          willChange: "transform",
          display: "block",
        }}
      >
        {slots.map((color, i) => {
          const def = defFor(color);
          const mid = (i + 0.5) * SEG_ANGLE;
          const [tx, ty] = polarXY(mid, (R_OUTER + R_INNER) / 2);
          const isWinner = transitioning === false && winningIdx === i;
          return (
            <g key={i}>
              <path
                d={segPath(i)}
                fill={def.fill}
                stroke={isWinner ? def.stroke : "rgba(0,0,0,0.5)"}
                strokeWidth={isWinner ? 2.5 : 1}
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${mid}, ${tx}, ${ty})`}
                fontSize={def.multiplier === 20 ? "13" : "11"}
                fontWeight="bold"
                fill={def.textFill}
                style={{ userSelect: "none" }}
              >
                x{def.multiplier}
              </text>
            </g>
          );
        })}

        <circle cx={CX} cy={CY} r={R_INNER} fill="#0a0f1e" stroke="#334155" strokeWidth="2" />
        <text
          x={CX}
          y={CY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="11"
          fontWeight="bold"
          fill={winnerColor ? defFor(winnerColor).textFill : "#64748b"}
          style={{ userSelect: "none" }}
        >
          {winnerColor ? `x${defFor(winnerColor).multiplier}` : "x20"}
        </text>
      </svg>

      {winnerColor && !transitioning && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 32px 8px ${defFor(winnerColor).stroke}55`,
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "spinning" | "result";

export function X20() {
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const addQualifyingSpendCents = useGameStore((s) => s.addQualifyingSpendCents);
  const updateMinigameStats = useGameStore((s) => s.updateMinigameStats);

  const [betInput, setBetInput] = useState("");
  const [selectedColor, setSelectedColor] = useState<SlotColor | null>(null);
  const [betError, setBetError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<{
    landedColor: SlotColor;
    won: boolean;
    payoutCents: number;
    multiplier: number;
  } | null>(null);

  const [wheelSlots, setWheelSlots] = useState<SlotColor[]>(() => buildShuffledWheel());
  const [rotation, setRotation] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [winningIdx, setWinningIdx] = useState<number | null>(null);
  const [winnerColor, setWinnerColor] = useState<SlotColor | null>(null);

  const baseRotationRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");

  const isPlaying = phase === "spinning";

  const selectColor = (color: SlotColor) => {
    if (isPlaying) return;
    setBetError(null);
    setSelectedColor((prev) => (prev === color ? null : color));
  };

  const handleSpin = () => {
    if (phaseRef.current !== "idle") return;
    if (!selectedColor) { setBetError("Wybierz kolor przed zakręceniem."); return; }

    const betCents = parseBetToCents(betInput);
    if (!betCents) { setBetError("Podaj prawidłową stawkę (min. $0.01)."); return; }
    if (!canPlaceBet(balanceCents, betCents)) { setBetError("Niewystarczający balans."); return; }

    setBetError(null);
    setResult(null);
    setWinnerColor(null);
    setWinningIdx(null);
    phaseRef.current = "spinning";
    setPhase("spinning");
    addBalanceCents(-betCents);

    const newSlots = buildShuffledWheel();
    const winIdx = pickWinnerIndex();
    const landedColor = newSlots[winIdx];
    const won = landedColor === selectedColor;
    const def = defFor(landedColor);
    const { payoutCents, profitCents } = resolveBet(betCents, won ? def.multiplier : 0);

    setWheelSlots(newSlots);

    const segCenter = (winIdx + 0.5) * SEG_ANGLE;
    const desiredMod = ((-(segCenter % 360)) + 360) % 360;
    const currentMod = ((baseRotationRef.current % 360) + 360) % 360;
    let diff = (desiredMod - currentMod + 360) % 360;
    if (diff < 10) diff += 360;
    const targetRotation = baseRotationRef.current + 7 * 360 + diff;
    baseRotationRef.current = targetRotation;

    setTransitioning(false);
    setRotation(baseRotationRef.current - (7 * 360 + diff));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRotation(targetRotation);
        setTransitioning(true);
      });
    });

    setTimeout(() => {
      setTransitioning(false);
      setWinningIdx(winIdx);
      setWinnerColor(landedColor);
      if (won) {
        addBalanceCents(payoutCents);
        // Win: add bet amount to qualifying spend
        addQualifyingSpendCents(betCents);
      }
      updateMinigameStats({ played: 1, wageredCents: betCents, profitCents });
      setResult({ landedColor, won, payoutCents, multiplier: def.multiplier });
      phaseRef.current = "result";
      setPhase("result");
    }, 4150);
  };

  const handleReset = () => {
    phaseRef.current = "idle";
    setPhase("idle");
    setResult(null);
    setWinnerColor(null);
    setWinningIdx(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/minigierki"
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
          aria-label="Wróć"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-black text-slate-100">Koło x20</h1>
      </div>

      <div className="glass-strong rounded-2xl border border-cyan-500/25 p-5 sm:p-7 space-y-5">

        <WheelSVG
          slots={wheelSlots}
          rotation={rotation}
          transitioning={transitioning}
          winningIdx={winningIdx}
          winnerColor={winnerColor}
        />

        {/* Color selector */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Wybierz kolor
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SLOT_DEFS.map((def) => {
              const selected = selectedColor === def.color;
              return (
                <button
                  key={def.color}
                  type="button"
                  onClick={() => selectColor(def.color)}
                  disabled={isPlaying}
                  aria-pressed={selected}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-0.5 ${
                    selected
                      ? `${def.twText} ${def.twBorder} bg-slate-800/80 shadow-[0_0_14px_rgba(255,255,255,0.06)]`
                      : "bg-slate-900/50 border-slate-700/40 text-slate-400 hover:border-slate-500/60"
                  }`}
                  style={selected ? { boxShadow: `0 0 12px ${def.stroke}44` } : undefined}
                >
                  <span>{def.label}</span>
                  <span className={`text-xs font-black font-mono ${selected ? def.twText : "text-slate-500"}`}>
                    x{def.multiplier}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bet */}
        <BetPanel
          betInput={betInput}
          onBetChange={(v) => { setBetInput(v); setBetError(null); }}
          balanceCents={balanceCents}
          disabled={isPlaying}
          error={betError}
        />

        {/* Odds legend */}
        <div className="grid grid-cols-4 gap-1.5">
          {SLOT_DEFS.map((def) => (
            <div key={def.color} className={`rounded-lg border ${def.twBorder} py-1.5 px-2 flex flex-col items-center`} style={{ background: def.fill + "cc" }}>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${def.twText}`}>{def.label}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{def.count}/{TOTAL_SLOTS}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {phase !== "result" ? (
          <button
            type="button"
            onClick={handleSpin}
            disabled={isPlaying || !selectedColor}
            className="neon-button w-full h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? "Obraca się..." : "Zakręć"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="w-full h-14 rounded-xl border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-lg hover:border-cyan-400/60 transition-colors"
          >
            Zagraj ponownie
          </button>
        )}

        {/* Result */}
        {result && (() => {
          const def = defFor(result.landedColor);
          return (
            <div className={`rounded-xl border p-4 text-center animate-in fade-in zoom-in-95 duration-200 ${
              result.won ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-red-400/30 bg-red-400/5 text-red-300"
            }`}>
              <p className="text-lg font-black">{result.won ? "🎉 Wygrałeś!" : "💸 Przegrałeś!"}</p>
              <p className="text-sm font-semibold mt-1 opacity-80">
                Wylosowano: <span className={`font-black ${def.twText}`}>{def.label} (x{result.multiplier})</span>.{" "}
                {result.won ? `Wygrana: ${formatMoney(result.payoutCents)}` : "Stawka przepada."}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
