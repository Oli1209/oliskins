import { useState } from "react";
import { X, Plus, Trash2, ChevronRight, ChevronLeft, Users } from "lucide-react";
import { mockCases } from "../data/mockCases";
import type { BattleFormat, BattleMode, SelectedCase } from "../lib/battleTypes";
import { MODE_LABELS, MODE_DESCRIPTIONS } from "../lib/battleTypes";
import type { Mode } from "../lib/chances";
import { getUnitCostCents } from "../lib/chances";
import { formatMoney } from "../lib/format";
import type { BattleSetup } from "../store/useBattleStore";
import { computeTotalCostCents } from "../store/useBattleStore";

// ─── Case Selector Sub-modal ──────────────────────────────────────────────────

interface CaseSelectorProps {
  onAdd: (sc: SelectedCase) => void;
  onClose: () => void;
}

const OPEN_MODE_LABELS: Record<Mode, string> = {
  normal: "Normal",
  boost: "Boost (2×)",
  jester: "Jester",
};

function CaseSelector({ onAdd, onClose }: CaseSelectorProps) {
  const [step, setStep] = useState<"pick" | "config">("pick");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [openMode, setOpenMode] = useState<Mode>("normal");

  const pickedCase = mockCases.find((c) => c.id === pickedId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl border border-cyan-500/25 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/40">
          {step === "config" && (
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-base font-black text-slate-100 flex-1 text-center">
            {step === "pick" ? "Wybierz skrzynkę" : "Konfiguruj otwarcie"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {step === "pick" && (
            <div className="grid gap-2">
              {mockCases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setPickedId(c.id); setQty(1); setOpenMode("normal"); setStep("config"); }}
                  className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-900/50 px-3 py-2.5 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all text-left"
                >
                  <img src={c.image} alt="" className="w-10 h-8 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{formatMoney(c.priceCents)} / otwarcie</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {step === "config" && pickedCase && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-900/50 p-3">
                <img src={pickedCase.image} alt="" className="w-12 h-10 rounded object-cover" />
                <div>
                  <p className="text-sm font-black text-slate-100">{pickedCase.name}</p>
                  <p className="text-xs text-slate-500">{formatMoney(pickedCase.priceCents)} bazowo</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Ilość (1–5)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQty(n)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${
                        qty === n
                          ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-700/40 bg-slate-900/50 text-slate-400 hover:border-slate-500/60"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Tryb otwarcia</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "boost", "jester"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setOpenMode(m)}
                      className={`py-2 rounded-lg border text-xs font-bold transition-all ${
                        openMode === m
                          ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-700/40 bg-slate-900/50 text-slate-400 hover:border-slate-500/60"
                      }`}
                    >
                      {OPEN_MODE_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-700/40 bg-slate-950/50 px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-slate-400">Koszt (×{qty})</span>
                <span className="text-base font-black text-cyan-300 font-mono">
                  {formatMoney(getUnitCostCents(pickedCase, openMode) * qty)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => { if (pickedId) onAdd({ caseId: pickedId, qty, openMode }); }}
                className="neon-button w-full h-11"
              >
                Dodaj do bitwy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Player-count / format options ───────────────────────────────────────────

type FormatOption = { label: string; sub: string; maxPlayers: number; format: BattleFormat };

const FORMAT_OPTIONS: FormatOption[] = [
  { label: "2", sub: "graczy", maxPlayers: 2, format: "ffa" },
  { label: "3", sub: "graczy", maxPlayers: 3, format: "ffa" },
  { label: "4", sub: "graczy", maxPlayers: 4, format: "ffa" },
  { label: "2v2", sub: "drużyny", maxPlayers: 4, format: "teams" },
];

// ─── Main Setup Modal ─────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onConfirm: (setup: BattleSetup) => void;
  balanceCents: number;
}

const ALL_MODES: BattleMode[] = [
  "standard",
  "underdog",
  "shared",
  "terminal",
  "crazy_terminal",
];

export function BattleSetupModal({ onClose, onConfirm, balanceCents }: Props) {
  const [selectedOption, setSelectedOption] = useState<FormatOption>(FORMAT_OPTIONS[0]);
  const [mode, setMode] = useState<BattleMode>("standard");
  const [cases, setCases] = useState<SelectedCase[]>([]);
  const [showCaseSelector, setShowCaseSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCost = computeTotalCostCents(cases);
  const canAfford = totalCost <= balanceCents;

  const handleConfirm = () => {
    setError(null);
    if (cases.length === 0) { setError("Dodaj co najmniej jedną skrzynkę."); return; }
    if (!canAfford) {
      setError(`Niewystarczające środki na bitwę. Potrzebujesz ${formatMoney(totalCost)}.`);
      return;
    }
    onConfirm({
      mode,
      maxPlayers: selectedOption.maxPlayers,
      battleFormat: selectedOption.format,
      cases,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="glass-strong rounded-2xl border border-cyan-500/25 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/40">
            <h2 className="text-xl font-black text-slate-100">Nowa bitwa</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Format / player count */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Format</p>
              <div className="grid grid-cols-4 gap-2">
                {FORMAT_OPTIONS.map((opt) => {
                  const active = selectedOption === opt;
                  return (
                    <button
                      key={opt.label + opt.format}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`flex flex-col items-center py-3 rounded-xl border text-center transition-all ${
                        active
                          ? opt.format === "teams"
                            ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                            : "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-700/40 bg-slate-900/50 text-slate-400 hover:border-slate-500/60"
                      }`}
                    >
                      <span className="text-lg font-black leading-none">{opt.label}</span>
                      <span className="text-[10px] mt-0.5 opacity-70">{opt.sub}</span>
                      {opt.format === "teams" && <Users className="w-3 h-3 mt-1 opacity-70" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Tryb bitwy</p>
              <div className="grid grid-cols-1 gap-2">
                {ALL_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`flex flex-col items-start px-4 py-3 rounded-xl border text-sm transition-all text-left ${
                      mode === m
                        ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-200"
                        : "border-slate-700/40 bg-slate-900/50 text-slate-400 hover:border-slate-600/50"
                    }`}
                  >
                    <span className="font-black">{MODE_LABELS[m]}</span>
                    <span className={`text-xs mt-0.5 ${mode === m ? "text-cyan-400/70" : "text-slate-600"}`}>
                      {MODE_DESCRIPTIONS[m]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cases list */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Skrzynki ({cases.length})
              </p>
              <div className="space-y-2">
                {cases.map((sc, idx) => {
                  const caseData = mockCases.find((c) => c.id === sc.caseId);
                  if (!caseData) return null;
                  const cost = getUnitCostCents(caseData, sc.openMode) * sc.qty;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-slate-700/40 bg-slate-900/50 px-3 py-2"
                    >
                      <img src={caseData.image} alt="" className="w-9 h-7 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{caseData.name}</p>
                        <p className="text-[10px] text-slate-500">
                          ×{sc.qty} · {sc.openMode} · {formatMoney(cost)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCases((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowCaseSelector(true)}
                className="mt-2 flex items-center gap-2 w-full rounded-xl border border-dashed border-slate-600/50 bg-slate-900/30 px-4 py-3 text-sm text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 transition-all"
              >
                <Plus className="w-4 h-4" />
                Dodaj skrzynkę
              </button>
            </div>

            {/* Cost summary — user pays full cost, bots are free */}
            {cases.length > 0 && (
              <div className={`rounded-xl border p-4 space-y-2 ${canAfford ? "border-slate-700/30 bg-slate-950/50" : "border-red-500/30 bg-red-500/5"}`}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Koszt bitwy (płacisz)</span>
                  <span className={`font-black font-mono text-base ${canAfford ? "text-cyan-300" : "text-red-400"}`}>
                    {formatMoney(totalCost)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Twoje saldo</span>
                  <span className="font-mono">{formatMoney(balanceCents)}</span>
                </div>
                {!canAfford && (
                  <p className="text-xs text-red-400 pt-1 border-t border-red-500/20">
                    Brakuje {formatMoney(totalCost - balanceCents)}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
          </div>

          <div className="p-5 border-t border-slate-700/40">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={cases.length > 0 && !canAfford}
              className="neon-button w-full h-12 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Utwórz bitwę
            </button>
          </div>
        </div>
      </div>

      {showCaseSelector && (
        <CaseSelector
          onAdd={(sc) => { setCases((prev) => [...prev, sc]); setShowCaseSelector(false); }}
          onClose={() => setShowCaseSelector(false)}
        />
      )}
    </>
  );
}
