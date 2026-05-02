import { useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords, Plus, Trash2, LogIn, X, TrendingDown, Users,
  SkipForward, Rewind, AlertCircle,
} from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { useBattleStore, computeTotalCostCents } from "../store/useBattleStore";
import { CaseSelectorModal } from "../components/BattleSetupModal";
import { mockCases } from "../data/mockCases";
import { MODE_LABELS, MODE_DESCRIPTIONS } from "../lib/battleTypes";
import type { BattleFormat, BattleMode, SelectedCase } from "../lib/battleTypes";
import type { Mode } from "../lib/chances";
import { getUnitCostCents } from "../lib/chances";
import { formatMoney } from "../lib/format";

// ─── Mode metadata ────────────────────────────────────────────────────────────

const MODE_ICONS: Record<BattleMode, ElementType> = {
  standard: Swords,
  underdog: TrendingDown,
  shared: Users,
  terminal: SkipForward,
  crazy_terminal: Rewind,
};

const MODE_COLORS: Record<BattleMode, string> = {
  standard: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
  underdog: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  shared: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  terminal: "border-purple-500/50 bg-purple-500/10 text-purple-300",
  crazy_terminal: "border-orange-500/50 bg-orange-500/10 text-orange-300",
};

const MODE_ICON_COLORS: Record<BattleMode, string> = {
  standard: "text-cyan-400",
  underdog: "text-amber-400",
  shared: "text-emerald-400",
  terminal: "text-purple-400",
  crazy_terminal: "text-orange-400",
};

const ALL_MODES: BattleMode[] = ["standard", "underdog", "shared", "terminal", "crazy_terminal"];

// ─── Format options ───────────────────────────────────────────────────────────

type FormatOption = { label: string; sub: string; maxPlayers: number; format: BattleFormat };

const FORMAT_OPTIONS: FormatOption[] = [
  { label: "2", sub: "graczy", maxPlayers: 2, format: "ffa" },
  { label: "3", sub: "graczy", maxPlayers: 3, format: "ffa" },
  { label: "4", sub: "graczy", maxPlayers: 4, format: "ffa" },
  { label: "2v2", sub: "drużyny", maxPlayers: 4, format: "teams" },
];

// ─── Open mode badge labels ───────────────────────────────────────────────────

const OPEN_MODE_BADGE: Record<Mode, { label: string; cls: string }> = {
  normal: { label: "Normal", cls: "text-slate-400 border-slate-600/40 bg-slate-800/40" },
  boost: { label: "Boost ×2", cls: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
  jester: { label: "Jester", cls: "text-purple-400 border-purple-500/30 bg-purple-500/5" },
};

const STATUS_COLORS: Record<string, string> = {
  waiting: "text-yellow-300 border-yellow-400/40 bg-yellow-400/5",
  in_progress: "text-emerald-300 border-emerald-400/40 bg-emerald-400/5",
  completed: "text-slate-400 border-slate-500/30 bg-slate-800/40",
};

const STATUS_LABELS: Record<string, string> = {
  waiting: "Oczekiwanie",
  in_progress: "W trakcie",
  completed: "Zakończona",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Bitwy() {
  const navigate = useNavigate();
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const { battles, createBattle, deleteBattle } = useBattleStore();

  // ── Setup state (inline) ──
  const [setupCases, setSetupCases] = useState<SelectedCase[]>([]);
  const [setupMode, setSetupMode] = useState<BattleMode>("standard");
  const [setupFormat, setSetupFormat] = useState<FormatOption>(FORMAT_OPTIONS[0]);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const totalCost = computeTotalCostCents(setupCases);
  const canAfford = totalCost <= balanceCents;
  const canCreate = setupCases.length > 0 && canAfford;

  const handleAddCase = (sc: SelectedCase) => {
    setSetupCases((prev) => [...prev, sc]);
    setShowCasePicker(false);
    setCreateError(null);
  };

  const handleRemoveCase = (idx: number) => {
    setSetupCases((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setSetupCases((prev) =>
      prev.map((sc, i) =>
        i === idx ? { ...sc, qty: Math.max(1, Math.min(5, sc.qty + delta)) } : sc
      )
    );
  };

  const handleClear = () => {
    setSetupCases([]);
    setSetupMode("standard");
    setSetupFormat(FORMAT_OPTIONS[0]);
    setCreateError(null);
  };

  const handleCreate = () => {
    setCreateError(null);
    if (setupCases.length === 0) {
      setCreateError("Dodaj co najmniej jedną skrzynkę.");
      return;
    }
    if (!canAfford) {
      setCreateError(`Niewystarczające środki na bitwę. Potrzebujesz ${formatMoney(totalCost)}.`);
      return;
    }
    addBalanceCents(-totalCost);
    const battle = createBattle({
      mode: setupMode,
      maxPlayers: setupFormat.maxPlayers,
      battleFormat: setupFormat.format,
      cases: setupCases,
    });
    navigate(`/bitwy/${battle.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-8">
        <Swords className="w-8 h-8 text-cyan-400" />
        <div>
          <h1 className="text-3xl font-black text-slate-100">Bitwy na skrzynki</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Zmierz się z botami — otwierasz skrzynki równocześnie, zwycięzca bierze wszystko.
          </p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

        {/* ── LEFT: Setup card ── */}
        <div className="glass-strong rounded-2xl border border-cyan-500/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/40">
            <h2 className="text-lg font-black text-slate-100">Utwórz bitwę</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* (1) Cases */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Skrzynki w bitwie
              </p>

              <div className="space-y-2">
                {setupCases.map((sc, idx) => {
                  const caseData = mockCases.find((c) => c.id === sc.caseId);
                  if (!caseData) return null;
                  const badge = OPEN_MODE_BADGE[sc.openMode];
                  const rowCost = getUnitCostCents(caseData, sc.openMode) * sc.qty;

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-900/50 px-3 py-2.5"
                    >
                      <img src={caseData.image} alt="" className="w-11 h-9 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-200 truncate">{caseData.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{formatMoney(rowCost)}</p>
                      </div>
                      {/* Qty stepper */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          className="w-6 h-6 rounded-md border border-slate-700/40 bg-slate-900/60 text-slate-400 hover:text-cyan-300 text-xs font-black flex items-center justify-center transition-colors"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-black text-slate-200">{sc.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          className="w-6 h-6 rounded-md border border-slate-700/40 bg-slate-900/60 text-slate-400 hover:text-cyan-300 text-xs font-black flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCase(idx)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowCasePicker(true)}
                  className="flex items-center gap-2 w-full rounded-xl border border-dashed border-slate-600/50 bg-slate-900/30 px-4 py-3 text-sm text-slate-400 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj skrzynkę
                </button>
              </div>
            </div>

            {/* (2) Settings */}
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Ustawienia bitwy
              </p>

              {/* Players / format */}
              <div>
                <p className="text-xs text-slate-600 mb-2">Liczba graczy</p>
                <div className="grid grid-cols-4 gap-2">
                  {FORMAT_OPTIONS.map((opt) => {
                    const active = setupFormat === opt;
                    return (
                      <button
                        key={opt.label + opt.format}
                        type="button"
                        onClick={() => setSetupFormat(opt)}
                        className={`flex flex-col items-center py-3 rounded-xl border text-center transition-all ${
                          active
                            ? opt.format === "teams"
                              ? "border-purple-500/60 bg-purple-500/15 text-purple-200"
                              : "border-cyan-500/60 bg-cyan-500/15 text-cyan-200"
                            : "border-slate-700/40 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        <span className="text-xl font-black leading-none">{opt.label}</span>
                        <span className="text-[9px] mt-1 opacity-60">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Battle mode */}
              <div>
                <p className="text-xs text-slate-600 mb-2">Tryb bitwy</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {ALL_MODES.map((m) => {
                    const Icon = MODE_ICONS[m];
                    const active = setupMode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSetupMode(m)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          active
                            ? MODE_COLORS[m]
                            : "border-slate-700/40 bg-slate-900/50 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${active ? MODE_ICON_COLORS[m] : "text-slate-600"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black leading-tight">{MODE_LABELS[m]}</p>
                          <p className={`text-[11px] mt-0.5 leading-tight ${active ? "opacity-70" : "text-slate-600"}`}>
                            {MODE_DESCRIPTIONS[m]}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* (3) Cost summary */}
            <div className={`rounded-xl border p-4 space-y-3 ${canAfford || setupCases.length === 0 ? "border-slate-700/30 bg-slate-950/50" : "border-red-500/30 bg-red-500/5"}`}>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-400">Łączny koszt bitwy</span>
                <span className={`text-2xl font-black font-mono ${canAfford || setupCases.length === 0 ? "text-cyan-300" : "text-red-400"}`}>
                  {formatMoney(totalCost)}
                </span>
              </div>
              {setupCases.length > 0 && (
                <div className="text-xs text-slate-600 space-y-0.5">
                  <p>
                    {setupCases.reduce((s, sc) => s + sc.qty, 0)} otwarć ·{" "}
                    {setupCases.length} typ{setupCases.length === 1 ? "" : "y"} skrzynki
                  </p>
                  <p>Saldo: {formatMoney(balanceCents)}</p>
                  {!canAfford && (
                    <p className="text-red-400 font-semibold">
                      Brakuje {formatMoney(totalCost - balanceCents)}
                    </p>
                  )}
                </div>
              )}

              {createError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{createError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={setupCases.length > 0 && !canAfford}
                  className="neon-button flex-1 h-12 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Utwórz bitwę
                </button>
                {setupCases.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 h-12 rounded-xl border border-slate-700/40 bg-slate-900/50 text-slate-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 text-sm font-bold transition-colors"
                  >
                    Wyczyść
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Active battles list ── */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Aktywne bitwy ({battles.length})
          </h2>

          {battles.length === 0 ? (
            <div className="glass-strong rounded-2xl border border-cyan-500/10 p-10 text-center">
              <Swords className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Brak aktywnych bitw.</p>
              <p className="text-slate-700 text-xs mt-1">Utwórz bitwę obok, aby rozpocząć.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...battles].reverse().map((battle) => {
                const totalCostBattle = computeTotalCostCents(battle.cases);
                const Icon = MODE_ICONS[battle.mode];

                return (
                  <div
                    key={battle.id}
                    className="glass-strong rounded-xl border border-slate-700/30 p-4 space-y-3"
                  >
                    {/* Row 1: mode + status + players */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold ${MODE_COLORS[battle.mode]}`}>
                        <Icon className="w-3 h-3" />
                        {MODE_LABELS[battle.mode]}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[battle.status]}`}>
                        {STATUS_LABELS[battle.status]}
                      </span>
                      {battle.battleFormat === "teams" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/30 bg-purple-400/5 text-purple-300">
                          2v2
                        </span>
                      )}
                      <span className="text-xs text-slate-600 ml-auto">
                        {battle.participants.length}/{battle.maxPlayers} graczy
                      </span>
                    </div>

                    {/* Row 2: mini case strip */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {battle.cases.slice(0, 4).map((sc, i) => {
                        const c = mockCases.find((x) => x.id === sc.caseId);
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700/40 bg-slate-900/50"
                          >
                            {c?.image && (
                              <img src={c.image} alt="" className="w-5 h-4 rounded object-cover" />
                            )}
                            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                              {c?.name}
                            </span>
                            <span className="text-[10px] text-slate-600">×{sc.qty}</span>
                          </div>
                        );
                      })}
                      {battle.cases.length > 4 && (
                        <span className="text-[10px] text-slate-600">+{battle.cases.length - 4}</span>
                      )}
                      <span className="text-xs font-black text-slate-300 font-mono ml-auto">
                        {formatMoney(totalCostBattle)}
                      </span>
                    </div>

                    {/* Row 3: actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/bitwy/${battle.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold text-xs hover:bg-cyan-500/20 transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Wejdź
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBattle(battle.id)}
                        className="p-2 rounded-lg border border-slate-700/40 bg-slate-900/50 text-slate-500 hover:text-red-400 hover:border-red-400/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Case picker modal */}
      {showCasePicker && (
        <CaseSelectorModal
          onAdd={handleAddCase}
          onClose={() => setShowCasePicker(false)}
        />
      )}
    </div>
  );
}
