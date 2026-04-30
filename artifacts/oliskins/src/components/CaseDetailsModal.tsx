import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { Case, InventoryItem } from "../lib/types";
import { useGameStore } from "../store/useGameStore";
import { mockCases } from "../data/mockCases";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { CaseReelStrip } from "./CaseReelStrip";
import { OpeningSummary } from "./OpeningSummary";
import {
  Mode,
  formatChance,
  getEffectiveDrops,
  getTotalCostCents,
} from "../lib/chances";

type Quantity = 1 | 2 | 3;

const MAX_QUANTITY = 3;

type RollResult = {
  key: string;
  winner: InventoryItem;
};

const QUANTITY_OPTIONS: Quantity[] = [1, 2, 3];

const MODE_OPTIONS: ReadonlyArray<{ id: Mode; label: string; hint: string }> = [
  { id: "normal", label: "Normal", hint: "Standardowe szanse" },
  { id: "boost", label: "Boost", hint: "x2 cena, x2 szansa na drogie" },
  { id: "jester", label: "Jester", hint: "Równe szanse" },
];

// Reel tile sizes scale down as the count grows so the stack stays readable.
const TILE_SIZES: Record<number, { mobile: number; desktop: number }> = {
  1: { mobile: 102, desktop: 153 },
  2: { mobile: 88, desktop: 120 },
  3: { mobile: 76, desktop: 100 },
};

function reelTileSize(count: number, isMobile: boolean): number {
  const cfg = TILE_SIZES[count] ?? TILE_SIZES[1];
  return isMobile ? cfg.mobile : cfg.desktop;
}

function CaseDetailsModalInner({ caseData }: { caseData: Case }) {
  const navigate = useNavigate();
  const balanceCents = useGameStore((s) => s.balanceCents);
  const openCase = useGameStore((s) => s.openCase);

  const [mode, setMode] = useState<Mode>("normal");
  const [quantity, setQuantity] = useState<Quantity>(1);
  const [results, setResults] = useState<RollResult[] | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [summaryItems, setSummaryItems] = useState<InventoryItem[] | null>(null);
  const completedRef = useRef(0);

  const summaryOpen = summaryItems !== null;
  const interactionLocked = isRolling || summaryOpen;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const stackTileSize = reelTileSize(quantity, isMobile);

  const unitCost = getTotalCostCents(caseData, 1, mode);
  const totalCost = getTotalCostCents(caseData, quantity, mode);
  const canAfford = balanceCents >= totalCost;

  const effectiveDrops = useMemo(
    () => getEffectiveDrops(caseData, mode),
    [caseData, mode]
  );

  const close = () => navigate("/skrzynki");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleOpen = () => {
    if (interactionLocked) return;
    if (!canAfford) return;

    const safeQuantity = Math.min(quantity, MAX_QUANTITY);
    const newResults: RollResult[] = [];
    const stamp = Date.now();
    for (let i = 0; i < safeQuantity; i++) {
      const r = openCase(caseData.id, mode);
      if (r.ok) {
        newResults.push({
          key: `${stamp}-${i}-${r.item.instanceId}`,
          winner: r.item,
        });
      } else {
        break;
      }
    }
    if (newResults.length === 0) return;

    completedRef.current = 0;
    setResults(newResults);
    setIsRolling(true);
  };

  const handleQuantityChange = (q: Quantity) => {
    if (interactionLocked) return;
    const next = Math.min(q, MAX_QUANTITY) as Quantity;
    setQuantity(next);
    // Clear previous reel lanes so the container immediately reflects the
    // newly selected count (no stale lanes from the previous roll).
    if (results) {
      completedRef.current = 0;
      setResults(null);
    }
  };

  const handleModeChange = (m: Mode) => {
    if (interactionLocked) return;
    setMode(m);
  };

  const onReelResolved = () => {
    completedRef.current += 1;
    if (results && completedRef.current >= results.length) {
      setIsRolling(false);
      setSummaryItems(results.map((r) => r.winner));
    }
  };

  const handleSummaryClose = () => {
    setSummaryItems(null);
  };

  const reelPlaceholderHeight = stackTileSize + 24;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="glass-strong w-full rounded-2xl p-5 sm:p-8 lg:p-10 border-cyan-500/40 shadow-[0_0_60px_rgba(34,211,238,0.18)] animate-in zoom-in-95 duration-300 max-h-[94vh] overflow-y-auto"
        style={{ maxWidth: "1320px" }}
      >
        {/* Header block */}
        <div className="relative rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-5 sm:p-6 lg:p-8 pr-14 sm:pr-16 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-400/80">
                Menu otwierania
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 mt-1.5 truncate">
                {caseData.name}
              </h2>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Cena bazowa
                </span>
                <span className="text-cyan-400 font-mono text-xl font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                  {formatMoney(caseData.priceCents)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 italic">
                Cena może się zmieniać po wyborze trybu (wkrótce)
              </p>
            </div>

            {/* Modes selector — UI only */}
            <div className="lg:max-w-[420px] w-full">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tryb otwierania
              </p>
              <div className="grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map((opt) => {
                  const selected = mode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleModeChange(opt.id)}
                      disabled={interactionLocked}
                      aria-pressed={selected}
                      title={opt.hint}
                      className={`relative px-3 py-3 rounded-lg border text-sm font-bold text-center select-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        selected
                          ? "bg-cyan-500/20 border-cyan-400/70 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                          : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200"
                      }`}
                    >
                      <span className="block">{opt.label}</span>
                      <span
                        className={`block text-[9px] font-medium uppercase tracking-wider mt-0.5 ${
                          selected ? "text-cyan-200/80" : "text-slate-500"
                        }`}
                      >
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={close}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reel area */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-slate-950/70 to-slate-900/40 p-4 sm:p-6 mb-6 lg:mb-8">
          {results ? (
            <div className="space-y-3">
              {results.map((r) => (
                <CaseReelStrip
                  key={r.key}
                  caseData={caseData}
                  winningItem={r.winner}
                  onResolved={onReelResolved}
                  tileSize={stackTileSize}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 flex flex-col items-center justify-center text-center px-4"
              style={{ minHeight: reelPlaceholderHeight }}
            >
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-500">
                Reel
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Wybierz ilość i kliknij{" "}
                <span className="text-cyan-300 font-semibold">Otwórz</span>, aby
                rozpocząć.
              </p>
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-stretch lg:items-center gap-4 lg:gap-8 mb-6 lg:mb-8">
          {/* Left: quantity */}
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Ilość
            </p>
            <div className="flex gap-2">
              {QUANTITY_OPTIONS.map((q) => {
                const selected = quantity === q;
                return (
                  <button
                    key={q}
                    onClick={() => handleQuantityChange(q)}
                    disabled={interactionLocked}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border text-base font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selected
                        ? "bg-cyan-500/20 border-cyan-400/70 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
                        : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200"
                    }`}
                    aria-label={`Ilość ${q}`}
                  >
                    {q}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: CTA */}
          <div className="flex flex-col items-stretch">
            <button
              onClick={handleOpen}
              disabled={!canAfford || interactionLocked}
              className="neon-button w-full h-14 sm:h-16 text-lg sm:text-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRolling ? "Otwieranie..." : "Otwórz"}
            </button>
            {!canAfford && !interactionLocked && (
              <p className="text-red-400/80 text-xs mt-2 text-center font-semibold">
                Za mało środków
              </p>
            )}
          </div>

          {/* Right: total cost */}
          <div className="lg:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Cena otwarcia
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]">
              {formatMoney(totalCost)}
            </p>
            {quantity > 1 && (
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {formatMoney(unitCost)} × {quantity}
              </p>
            )}
          </div>
        </div>

        {/* Drops panel */}
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
              Dropy możliwe
            </h3>
            <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
              cena + szansa
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {effectiveDrops.map((d) => {
              const r = rarityColors[d.rarity];
              return (
                <div
                  key={d.id}
                  className={`relative rounded-lg border bg-slate-950/70 ${r.border} overflow-hidden flex flex-col`}
                >
                  <div className="aspect-square relative">
                    <img
                      src={d.image}
                      alt={d.name}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-85"
                    />
                    <div className="absolute top-1.5 right-1.5">
                      <span
                        className={`text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border ${r.border} ${r.text}`}
                      >
                        {d.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col">
                    <p
                      className="text-[12px] font-semibold text-slate-100 truncate"
                      title={d.name}
                    >
                      {d.name}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-mono text-cyan-400 font-bold">
                        {formatMoney(d.valueCents)}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-slate-900/70 ${r.border} ${r.text}`}
                        title="Szansa"
                      >
                        {formatChance(d.chancePct)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {summaryItems && (
        <OpeningSummary items={summaryItems} onClose={handleSummaryClose} />
      )}
    </div>
  );
}

export function CaseDetailsRoute() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const caseData = mockCases.find((c) => c.id === caseId);

  useEffect(() => {
    if (!caseData) navigate("/skrzynki", { replace: true });
  }, [caseData, navigate]);

  if (!caseData) return null;
  return <CaseDetailsModalInner caseData={caseData} />;
}
