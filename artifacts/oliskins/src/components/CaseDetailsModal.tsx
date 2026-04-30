import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { Case, InventoryItem } from "../lib/types";
import { useGameStore } from "../store/useGameStore";
import { mockCases } from "../data/mockCases";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { CaseReelStrip } from "./CaseReelStrip";

type Mode = "normal" | "boost" | "jester";
type Quantity = 1 | 2 | 3;

type RollResult = {
  key: string;
  winner: InventoryItem;
};

const MODE_OPTIONS: ReadonlyArray<{ id: Mode; label: string; soon: boolean }> = [
  { id: "normal", label: "Normal", soon: false },
  { id: "boost", label: "Boost", soon: true },
  { id: "jester", label: "Jester", soon: true },
];

function CaseDetailsModalInner({ caseData }: { caseData: Case }) {
  const navigate = useNavigate();
  const balanceCents = useGameStore((s) => s.balanceCents);
  const openCase = useGameStore((s) => s.openCase);

  const [mode, setMode] = useState<Mode>("normal");
  const [quantity, setQuantity] = useState<Quantity>(1);
  const [results, setResults] = useState<RollResult[] | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [skipSignal, setSkipSignal] = useState(0);
  const completedRef = useRef(0);

  const totalCost = caseData.priceCents * quantity;
  const canAfford = balanceCents >= totalCost;

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
    if (isRolling) return;
    if (!canAfford) return;

    const newResults: RollResult[] = [];
    const stamp = Date.now();
    for (let i = 0; i < quantity; i++) {
      const r = openCase(caseData.id);
      if (r.ok) {
        newResults.push({ key: `${stamp}-${i}-${r.item.instanceId}`, winner: r.item });
      } else {
        break;
      }
    }
    if (newResults.length === 0) return;

    completedRef.current = 0;
    setSkipSignal(0);
    setResults(newResults);
    setIsRolling(true);
  };

  const handleSkip = () => {
    if (!isRolling) return;
    setSkipSignal((s) => s + 1);
  };

  const onReelResolved = () => {
    completedRef.current += 1;
    if (results && completedRef.current >= results.length) {
      setIsRolling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="glass-strong w-full max-w-5xl rounded-2xl p-5 sm:p-7 border-cyan-500/40 shadow-[0_0_60px_rgba(34,211,238,0.18)] animate-in zoom-in-95 duration-300 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Skrzynka
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 truncate">
              {caseData.name}
            </h2>
            <p className="text-cyan-400 font-mono text-base sm:text-lg mt-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
              {formatMoney(caseData.priceCents)}
            </p>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode selector */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Tryb otwierania
          </p>
          <div className="grid grid-cols-3 gap-2">
            {MODE_OPTIONS.map((opt) => {
              const selected = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setMode(opt.id)}
                  disabled={isRolling}
                  className={`relative px-3 py-3 rounded-lg border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? "bg-cyan-500/15 border-cyan-400/60 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                      : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:bg-slate-800/60 hover:border-cyan-500/30"
                  }`}
                >
                  <span className="block">{opt.label}</span>
                  {opt.soon && (
                    <span className="block text-[9px] font-medium uppercase tracking-wider text-slate-500 mt-0.5">
                      Wkrótce
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Ilość
          </p>
          <div className="flex gap-2">
            {([1, 2, 3] as Quantity[]).map((q) => {
              const selected = quantity === q;
              return (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  disabled={isRolling}
                  className={`flex-1 sm:flex-none sm:w-20 px-4 py-2.5 rounded-full border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? "bg-cyan-500/15 border-cyan-400/60 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                      : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-cyan-500/30"
                  }`}
                >
                  x{q}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reels */}
        {results && (
          <div className="space-y-3 mb-6">
            {results.map((r) => (
              <CaseReelStrip
                key={r.key}
                caseData={caseData}
                winningItem={r.winner}
                skipSignal={skipSignal}
                onResolved={onReelResolved}
                compact={results.length > 1}
              />
            ))}
          </div>
        )}

        {/* Primary CTA / Skip */}
        <div className="mb-7">
          {isRolling ? (
            <button
              onClick={handleSkip}
              className="w-full py-3.5 rounded-lg font-bold text-slate-200 border border-cyan-500/30 bg-slate-900/60 hover:border-cyan-400/60 hover:text-cyan-200 hover:bg-slate-900/80 transition-colors"
            >
              Pomiń animację
            </button>
          ) : (
            <button
              onClick={handleOpen}
              disabled={!canAfford}
              className="w-full neon-button flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Otwórz{quantity > 1 ? ` (x${quantity})` : ""}</span>
              <span className="font-mono text-lg">{formatMoney(totalCost)}</span>
            </button>
          )}
          {!canAfford && !isRolling && (
            <p className="text-red-400/80 text-sm mt-2 text-center font-semibold">
              Za mało środków
            </p>
          )}
        </div>

        {/* Possible drops */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Możliwe dropy
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {caseData.drops.map((d) => {
              const r = rarityColors[d.rarity];
              return (
                <div
                  key={d.id}
                  className={`relative rounded-lg border bg-slate-950/60 ${r.border} overflow-hidden`}
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
                  <div className="p-2">
                    <p className="text-[11px] font-semibold text-slate-200 truncate">
                      {d.name}
                    </p>
                    <p className="text-[11px] font-mono text-cyan-400">
                      {formatMoney(d.valueCents)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
