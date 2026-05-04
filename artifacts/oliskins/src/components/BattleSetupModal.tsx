import { useState, useMemo } from "react";
import { X, ChevronRight, ChevronLeft, Search, ArrowUpDown } from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import type { SelectedCase } from "../lib/battleTypes";
import type { Mode } from "../lib/chances";
import { getUnitCostCents } from "../lib/chances";
import { formatMoney } from "../lib/format";
import { isCaseValid, INVALID_CASE_MSG, DEFAULT_MODE_AVAILABILITY } from "../lib/types";

type SortKey = "default" | "price-asc" | "price-desc";

const OPEN_MODE_LABELS: Record<Mode, string> = {
  normal: "Normal",
  boost: "Boost ×2",
  jester: "Jester",
};

const OPEN_MODE_COLORS: Record<Mode, string> = {
  normal: "border-slate-600/60 bg-slate-800/60 text-slate-300",
  boost: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  jester: "border-purple-500/50 bg-purple-500/10 text-purple-300",
};

interface Props {
  onAdd: (sc: SelectedCase) => void;
  onClose: () => void;
}

export function CaseSelectorModal({ onAdd, onClose }: Props) {
  const paidCases = useCaseStore((s) => s.paidCases);
  const [step, setStep] = useState<"pick" | "config">("pick");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [openMode, setOpenMode] = useState<Mode>("normal");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("default");

  const pickedCase = paidCases.find((c) => c.id === pickedId);

  const filteredCases = useMemo(() => {
    let list = paidCases.filter(
      (c) => c.priceCents > 0 && c.name.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    return list;
  }, [search, sort]);

  const unitCost = pickedCase ? getUnitCostCents(pickedCase, openMode) : 0;
  const totalCost = unitCost * qty;

  const handlePick = (caseId: string) => {
    const c = paidCases.find((x) => x.id === caseId);
    if (!c || !isCaseValid(c)) {
      alert(INVALID_CASE_MSG);
      return;
    }
    setPickedId(caseId);
    setQty(1);
    setOpenMode("normal");
    setStep("config");
  };

  const handleAdd = () => {
    if (!pickedId) return;
    onAdd({ caseId: pickedId, qty, openMode });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl border border-cyan-500/25 w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-700/40 shrink-0">
          {step === "config" && (
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-lg font-black text-slate-100 flex-1">
            {step === "pick" ? "Wybierz skrzynkę" : pickedCase?.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "pick" && (
            <div className="space-y-3">
              {/* Search + sort toolbar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Szukaj skrzynki…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSort((s) =>
                      s === "default" ? "price-asc" : s === "price-asc" ? "price-desc" : "default"
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700/50 bg-slate-900/80 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  {sort === "price-asc" ? "Cena ↑" : sort === "price-desc" ? "Cena ↓" : "Sortuj"}
                </button>
              </div>

              {/* Case grid */}
              <div className="grid grid-cols-2 gap-2">
                {filteredCases.map((c) => {
                  const valid = isCaseValid(c);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handlePick(c.id)}
                      title={!valid ? INVALID_CASE_MSG : undefined}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition-all text-left group ${
                        valid
                          ? "border-slate-700/40 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-slate-800/70"
                          : "border-red-500/20 bg-red-950/10 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <img src={c.image} alt="" className="w-12 h-10 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate transition-colors ${valid ? "text-slate-200 group-hover:text-cyan-300" : "text-red-300"}`}>
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {valid ? formatMoney(c.priceCents) : "Błędne dropy"}
                        </p>
                      </div>
                      {valid
                        ? <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 shrink-0 transition-colors" />
                        : <span className="text-[10px] text-red-400 font-bold shrink-0">✕</span>
                      }
                    </button>
                  );
                })}
                {filteredCases.length === 0 && (
                  <p className="col-span-2 text-center text-slate-500 text-sm py-8">Brak wyników</p>
                )}
              </div>
            </div>
          )}

          {step === "config" && pickedCase && (
            <div className="space-y-5">
              {/* Case preview */}
              <div className="flex items-center gap-4 rounded-xl border border-slate-700/40 bg-slate-900/60 p-4">
                <img src={pickedCase.image} alt="" className="w-16 h-14 rounded-lg object-cover" />
                <div>
                  <p className="text-base font-black text-slate-100">{pickedCase.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cena bazowa: {formatMoney(pickedCase.priceCents)}
                  </p>
                </div>
              </div>

              {/* Qty */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Ilość otwarć (1–5)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQty(n)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-black transition-all ${
                        qty === n
                          ? "border-cyan-500/70 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-700/40 bg-slate-900/50 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open mode */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Tryb otwarcia</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["normal", "boost", "jester"] as Mode[]).map((m) => {
                    const ma = pickedCase.modeAvailability ?? DEFAULT_MODE_AVAILABILITY;
                    const modeDisabled = (m === "boost" && !ma.boostEnabled) || (m === "jester" && !ma.jesterEnabled);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => !modeDisabled && setOpenMode(m)}
                        disabled={modeDisabled}
                        className={`py-3 rounded-xl border text-xs font-black transition-all disabled:cursor-not-allowed ${
                          modeDisabled
                            ? "border-slate-800/40 bg-slate-950/30 text-slate-700 opacity-60"
                            : openMode === m
                            ? OPEN_MODE_COLORS[m]
                            : "border-slate-700/40 bg-slate-900/50 text-slate-500 hover:border-slate-500"
                        }`}
                      >
                        {OPEN_MODE_LABELS[m]}
                        {modeDisabled && <span className="block text-[9px] font-normal opacity-80 mt-0.5">Wyłączone</span>}
                        {!modeDisabled && m === "boost" && <span className="block text-[9px] font-normal opacity-70 mt-0.5">+szansa na drogie</span>}
                        {!modeDisabled && m === "jester" && <span className="block text-[9px] font-normal opacity-70 mt-0.5">równa szansa</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live cost */}
              <div className="rounded-xl border border-slate-700/30 bg-slate-950/60 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Koszt ×{qty}</p>
                  <p className="text-xl font-black text-cyan-300 font-mono">{formatMoney(totalCost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-600">per otwarcie</p>
                  <p className="text-sm font-bold text-slate-400 font-mono">{formatMoney(unitCost)}</p>
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleAdd}
                className="neon-button w-full h-12 text-base"
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
