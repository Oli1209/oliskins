import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { BetPanel } from "../components/BetPanel";
import { parseBetToCents, canPlaceBet, resolveBet } from "../lib/minigames";
import { formatMoney } from "../lib/format";

// ─── Slot definitions ───────────────────────────────────────────────────────

type SlotColor = "black" | "red" | "blue" | "gold";

interface SlotDef {
  color: SlotColor;
  multiplier: number;
  label: string;
  count: number;
  tw: string;         // tailwind bg classes
  twBorder: string;
  twText: string;
  twGlow: string;
}

const SLOT_DEFS: SlotDef[] = [
  { color: "black", multiplier: 2,  label: "Czarny",    count: 10, tw: "bg-slate-800",   twBorder: "border-slate-500/60",  twText: "text-slate-200",   twGlow: "shadow-[0_0_14px_rgba(148,163,184,0.35)]" },
  { color: "red",   multiplier: 3,  label: "Czerwony",  count: 7,  tw: "bg-red-900/60",  twBorder: "border-red-500/60",    twText: "text-red-300",     twGlow: "shadow-[0_0_14px_rgba(248,113,113,0.45)]" },
  { color: "blue",  multiplier: 5,  label: "Niebieski", count: 4,  tw: "bg-blue-900/60", twBorder: "border-blue-500/60",   twText: "text-blue-300",    twGlow: "shadow-[0_0_14px_rgba(96,165,250,0.45)]"  },
  { color: "gold",  multiplier: 20, label: "Złoty",     count: 1,  tw: "bg-yellow-900/40",twBorder: "border-yellow-400/70", twText: "text-yellow-300",  twGlow: "shadow-[0_0_20px_rgba(250,204,21,0.6)]"   },
];

const TOTAL_SLOTS = SLOT_DEFS.reduce((s, d) => s + d.count, 0); // 22

function defFor(color: SlotColor): SlotDef {
  return SLOT_DEFS.find((d) => d.color === color)!;
}

// Build the canonical 22-slot order (10 black, 7 red, 4 blue, 1 gold) then
// shuffle deterministically each session so the strip looks varied.
function buildBaseStrip(): SlotColor[] {
  const arr: SlotColor[] = [];
  for (const d of SLOT_DEFS) {
    for (let i = 0; i < d.count; i++) arr.push(d.color);
  }
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Randomly pick one slot according to uniform distribution over 22 slots.
function pickWinningSlotColor(): SlotColor {
  const idx = Math.floor(Math.random() * TOTAL_SLOTS);
  let cursor = 0;
  for (const d of SLOT_DEFS) {
    cursor += d.count;
    if (idx < cursor) return d.color;
  }
  return "black";
}

// ─── Reel strip ─────────────────────────────────────────────────────────────

const TILE_W = 80;
const TILE_GAP = 8;
const TILE_SPACING = TILE_W + TILE_GAP;
const REEL_LENGTH = 60;
const WINNER_IDX = 48; // place winner near end
const SPIN_DURATION_MS = 2200;

interface ReelStripProps {
  strip: SlotColor[];      // the full reel sequence
  translateX: number;
  isAnimating: boolean;
  spinKey: string;
}

function X20ReelStrip({ strip, translateX, isAnimating, spinKey }: ReelStripProps) {
  return (
    <div
      key={spinKey}
      className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-950/60"
      style={{ height: TILE_W + 24 }}
    >
      <div
        className="flex items-center h-full will-change-transform"
        style={{
          gap: `${TILE_GAP}px`,
          paddingLeft: 12,
          transform: `translate3d(${translateX}px, 0, 0)`,
          transition: isAnimating
            ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.08, 0.82, 0.17, 1)`
            : "none",
        }}
      >
        {strip.map((color, i) => {
          const def = defFor(color);
          const isWinner = i === WINNER_IDX;
          return (
            <div
              key={`${i}-${color}`}
              data-winner={isWinner ? "true" : undefined}
              className={`shrink-0 rounded-lg border-2 flex flex-col items-center justify-center gap-1 ${def.tw} ${def.twBorder} ${isWinner ? def.twGlow : ""}`}
              style={{ width: TILE_W, height: TILE_W }}
            >
              <span className={`text-xs font-black uppercase tracking-widest ${def.twText}`}>
                {def.label}
              </span>
              <span className={`text-lg font-black font-mono ${def.twText}`}>
                x{def.multiplier}
              </span>
            </div>
          );
        })}
      </div>

      {/* Indicator line */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95),0_0_28px_rgba(34,211,238,0.5)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-950 to-transparent" />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Phase = "idle" | "spinning" | "result";

export function X20() {
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const updateMinigameStats = useGameStore((s) => s.updateMinigameStats);

  const [betInput, setBetInput] = useState("");
  const [selectedColor, setSelectedColor] = useState<SlotColor>("black");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<{
    landedColor: SlotColor;
    won: boolean;
    payoutCents: number;
    multiplier: number;
  } | null>(null);
  const [betError, setBetError] = useState<string | null>(null);

  const [strip, setStrip] = useState<SlotColor[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [spinKey, setSpinKey] = useState("init");

  const viewportRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");

  const isPlaying = phase === "spinning";

  const handleSpin = () => {
    if (phaseRef.current !== "idle") return;

    const betCents = parseBetToCents(betInput);
    if (!betCents) { setBetError("Podaj prawidłową stawkę (min. #0.01)."); return; }
    if (!canPlaceBet(balanceCents, betCents)) { setBetError("Niewystarczający balans."); return; }

    setBetError(null);
    setResult(null);
    phaseRef.current = "spinning";
    setPhase("spinning");

    // Build new strip with the winner placed at WINNER_IDX
    const base = buildBaseStrip(); // 22 colours
    const landedColor = pickWinningSlotColor();
    const newStrip: SlotColor[] = [];
    for (let i = 0; i < REEL_LENGTH; i++) {
      if (i === WINNER_IDX) {
        newStrip.push(landedColor);
      } else {
        newStrip.push(base[i % base.length]);
      }
    }
    setStrip(newStrip);
    setIsAnimating(false);
    setTranslateX(0);
    setSpinKey(`spin-${Date.now()}`);

    addBalanceCents(-betCents);

    // Two-frame trick to allow DOM reset before animating
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const vpWidth = viewportRef.current?.offsetWidth ?? 400;
        const winnerCenter = WINNER_IDX * TILE_SPACING + TILE_W / 2 + 12;
        const target = vpWidth / 2 - winnerCenter;
        setTranslateX(target);
        setIsAnimating(true);
      });
    });

    const def = defFor(landedColor);
    const won = landedColor === selectedColor;
    const { payoutCents, profitCents } = resolveBet(betCents, won ? def.multiplier : 0);

    setTimeout(() => {
      if (won) addBalanceCents(payoutCents);
      updateMinigameStats({ played: 1, wageredCents: betCents, profitCents });
      setResult({ landedColor, won, payoutCents, multiplier: def.multiplier });
      phaseRef.current = "result";
      setPhase("result");
    }, SPIN_DURATION_MS + 150);
  };

  const handleReset = () => {
    setPhase("idle");
    phaseRef.current = "idle";
    setResult(null);
    setIsAnimating(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
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

      <div className="glass-strong rounded-2xl border border-cyan-500/25 p-6 sm:p-8 space-y-6">
        {/* Reel viewport */}
        <div ref={viewportRef}>
          {strip.length > 0 ? (
            <X20ReelStrip
              strip={strip}
              translateX={translateX}
              isAnimating={isAnimating}
              spinKey={spinKey}
            />
          ) : (
            <div
              className="rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 flex items-center justify-center"
              style={{ height: TILE_W + 24 }}
            >
              <p className="text-slate-500 text-sm uppercase tracking-[0.3em] font-bold">
                Zakręć kołem
              </p>
            </div>
          )}
        </div>

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
                  onClick={() => setSelectedColor(def.color)}
                  disabled={isPlaying}
                  aria-pressed={selected}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-0.5 ${
                    selected
                      ? `${def.tw} ${def.twBorder} ${def.twText} ${def.twGlow}`
                      : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-slate-500/60"
                  }`}
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

        {/* Slot odds info */}
        <div className="grid grid-cols-4 gap-1.5">
          {SLOT_DEFS.map((def) => (
            <div
              key={def.color}
              className={`rounded-lg border ${def.twBorder} ${def.tw} py-1.5 px-2 flex flex-col items-center`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wide ${def.twText}`}>
                {def.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {def.count}/{TOTAL_SLOTS}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        {phase === "idle" || phase === "spinning" ? (
          <button
            type="button"
            onClick={handleSpin}
            disabled={isPlaying}
            className="neon-button w-full h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? "Kręci się..." : "Zakręć"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="w-full h-14 rounded-xl border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-lg hover:border-cyan-400/60 hover:bg-slate-800/60 transition-colors"
          >
            Zagraj ponownie
          </button>
        )}

        {/* Result */}
        {result && (() => {
          const def = defFor(result.landedColor);
          return (
            <div
              className={`rounded-xl border p-4 text-center animate-in fade-in zoom-in-95 duration-200 ${
                result.won
                  ? `${def.twBorder} bg-emerald-400/10 text-emerald-300`
                  : "border-red-400/30 bg-red-400/5 text-red-300"
              }`}
            >
              <p className="text-lg font-black">
                {result.won ? "🎉 Wygrałeś!" : "💸 Przegrałeś!"}
              </p>
              <p className="text-sm font-semibold mt-1 opacity-80">
                Wylosowano:{" "}
                <span className={`font-black ${def.twText}`}>
                  {def.label} (x{result.multiplier})
                </span>
                .{" "}
                {result.won
                  ? `Wygrana: ${formatMoney(result.payoutCents)}`
                  : "Stawka przepada."}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
