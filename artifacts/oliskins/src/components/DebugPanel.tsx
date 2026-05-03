import { useState, useRef, useEffect } from "react";
import { Bug } from "lucide-react";
import { useGameStore } from "../store/useGameStore";

export function DebugButton() {
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const addXp = useGameStore((s) => s.addXp);

  const [open, setOpen] = useState(false);
  const [moneyValue, setMoneyValue] = useState("");
  const [moneyError, setMoneyError] = useState(false);
  const [xpValue, setXpValue] = useState("");
  const [xpError, setXpError] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleAddMoney = () => {
    const parsed = parseFloat(moneyValue.replace(",", "."));
    if (!isFinite(parsed) || parsed <= 0) { setMoneyError(true); return; }
    const cents = Math.round(parsed * 100);
    if (cents <= 0) { setMoneyError(true); return; }
    addBalanceCents(cents);
    setMoneyError(false);
    setMoneyValue("");
  };

  const handleAddXp = () => {
    const parsed = parseInt(xpValue, 10);
    if (!isFinite(parsed) || parsed <= 0) { setXpError(true); return; }
    addXp(parsed);
    setXpError(false);
    setXpValue("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Debug"
        className={`p-2 rounded-full transition-colors ${open ? "text-amber-400 bg-amber-400/10" : "text-slate-500 hover:text-amber-400 hover:bg-amber-400/10"}`}
      >
        <Bug className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[200] w-44 glass-strong rounded-xl border border-slate-700/40 shadow-2xl p-3 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5">Dodaj #</p>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="np. 5.00"
              value={moneyValue}
              onChange={(e) => { setMoneyValue(e.target.value); if (moneyError) setMoneyError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddMoney(); }}
              className="w-full px-2 py-1.5 mb-1.5 rounded-md bg-slate-950/70 border border-cyan-500/20 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400/60"
            />
            <button
              onClick={handleAddMoney}
              className="w-full px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 text-xs font-semibold hover:bg-cyan-400/30 transition-colors"
            >
              Dodaj
            </button>
            {moneyError && <p className="text-red-400/90 text-[10px] mt-1">Nieprawidłowa kwota</p>}
          </div>

          <div className="h-px bg-slate-700/40" />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1.5">Dodaj XP</p>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              placeholder="np. 100"
              value={xpValue}
              onChange={(e) => { setXpValue(e.target.value); if (xpError) setXpError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddXp(); }}
              className="w-full px-2 py-1.5 mb-1.5 rounded-md bg-slate-950/70 border border-cyan-500/20 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-400/60"
            />
            <button
              onClick={handleAddXp}
              className="w-full px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 text-xs font-semibold hover:bg-cyan-400/30 transition-colors"
            >
              Dodaj XP
            </button>
            {xpError && <p className="text-red-400/90 text-[10px] mt-1">Nieprawidłowa wartość</p>}
          </div>
        </div>
      )}
    </div>
  );
}
