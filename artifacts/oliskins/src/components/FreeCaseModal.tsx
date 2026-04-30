import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X, Gift, Lock } from "lucide-react";
import { FreeCase, InventoryItem, computeLevel } from "../lib/types";
import { useGameStore } from "../store/useGameStore";
import { freeCases } from "../data/freeCases";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { FreeCaseReelStrip } from "./FreeCaseReelStrip";
import { formatChance } from "../lib/chances";
import { useFreeCooldown, formatCooldown } from "../hooks/useFreeCooldown";
import { Case } from "../lib/types";

type RollResult = {
  key: string;
  winner: InventoryItem;
};

function freeCaseToCase(fc: FreeCase): Case {
  return {
    id: fc.id,
    name: fc.name,
    description: fc.description,
    priceCents: 0,
    image: fc.image,
    drops: fc.drops,
  };
}

function FreeCaseModalInner({ caseData }: { caseData: FreeCase }) {
  const navigate = useNavigate();
  const openFreeCase = useGameStore((s) => s.openFreeCase);
  const stats = useGameStore((s) => s.stats);

  const level = computeLevel(stats.casesOpened);
  const isLockedByLevel = level < caseData.requiredLevel;

  const { msLeft, ready } = useFreeCooldown();

  const [result, setResult] = useState<RollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedRef = useRef(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const tileSize = isMobile ? 102 : 153;
  const reelPlaceholderHeight = tileSize + 24;

  const close = () => navigate("/darmowe-skrzynki");

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

  const totalWeight = caseData.drops.reduce((sum, d) => sum + d.weight, 0);
  const dropsWithChance = caseData.drops.map((d) => ({
    ...d,
    chancePct: totalWeight > 0 ? (d.weight / totalWeight) * 100 : 0,
  }));

  const canOpen = !isRolling && !isLockedByLevel && ready;

  const handleOpen = () => {
    if (!canOpen) return;
    setError(null);
    const r = openFreeCase(caseData.id);
    if (!r.ok) {
      if (r.reason === "cooldown") setError("Cooldown jeszcze nie minął.");
      else if (r.reason === "locked_level")
        setError(`Wymagany poziom: ${caseData.requiredLevel}`);
      else setError("Nie udało się otworzyć skrzynki.");
      return;
    }
    resolvedRef.current = false;
    setResult({
      key: `${Date.now()}-${r.item.instanceId}`,
      winner: r.item,
    });
    setIsRolling(true);
  };

  const onResolved = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setIsRolling(false);
  };

  const reelCaseData = freeCaseToCase(caseData);

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
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400/80 flex items-center gap-2">
                <Gift className="w-3.5 h-3.5" /> Darmowa skrzynia · Tier {caseData.tier}
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 mt-1.5 truncate">
                {caseData.name}
              </h2>
              <p className="text-slate-400 text-sm mt-2 max-w-2xl">
                {caseData.description}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Wymagany poziom
                </span>
                <span className="text-emerald-400 font-mono text-xl font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                  {caseData.requiredLevel}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-3">
                  Twój poziom
                </span>
                <span className="text-slate-200 font-mono text-xl font-bold">
                  {level}
                </span>
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
          {result ? (
            <FreeCaseReelStrip
              caseData={reelCaseData}
              winningItem={result.winner}
              onResolved={onResolved}
              tileSize={tileSize}
            />
          ) : (
            <div
              className="rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 flex flex-col items-center justify-center text-center px-4"
              style={{ minHeight: reelPlaceholderHeight }}
            >
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-500">
                Reel
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Kliknij{" "}
                <span className="text-emerald-300 font-semibold">Otwórz</span>, aby
                rozpocząć darmowe otwarcie.
              </p>
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-stretch lg:items-center gap-4 lg:gap-8 mb-6 lg:mb-8">
          <div className="flex flex-col items-stretch">
            <button
              onClick={handleOpen}
              disabled={!canOpen}
              className="neon-button w-full h-14 sm:h-16 text-lg sm:text-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRolling
                ? "Otwieranie..."
                : isLockedByLevel
                ? "Zablokowane"
                : !ready
                ? `Dostępne za: ${formatCooldown(msLeft)}`
                : "Otwórz"}
            </button>
            {error && (
              <p className="text-red-400/80 text-xs mt-2 text-center font-semibold">
                {error}
              </p>
            )}
            {isLockedByLevel && (
              <p className="text-amber-300/80 text-xs mt-2 text-center font-semibold flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" /> Wymagany poziom: {caseData.requiredLevel}
              </p>
            )}
          </div>

          <div className="lg:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Cooldown globalny
            </p>
            <p className="font-mono text-xl sm:text-2xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]">
              {ready ? "Gotowe" : formatCooldown(msLeft)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              1h dla wszystkich darmowych skrzynek
            </p>
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
            {dropsWithChance.map((d) => {
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
    </div>
  );
}

export function FreeCaseRoute() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const caseData = freeCases.find((c) => c.id === caseId);

  useEffect(() => {
    if (!caseData) navigate("/darmowe-skrzynki", { replace: true });
  }, [caseData, navigate]);

  if (!caseData) return null;
  return <FreeCaseModalInner caseData={caseData} />;
}
