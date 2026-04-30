import { useState } from "react";
import { useGameStore } from "../store/useGameStore";

export function DebugPanel() {
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const addXp = useGameStore((s) => s.addXp);

  const [moneyValue, setMoneyValue] = useState("");
  const [moneyError, setMoneyError] = useState(false);

  const [xpValue, setXpValue] = useState("");
  const [xpError, setXpError] = useState(false);

  const handleAddMoney = () => {
    const parsed = parseFloat(moneyValue.replace(",", "."));
    if (!isFinite(parsed) || parsed <= 0) {
      setMoneyError(true);
      return;
    }
    const cents = Math.round(parsed * 100);
    if (cents <= 0) {
      setMoneyError(true);
      return;
    }
    addBalanceCents(cents);
    setMoneyError(false);
    setMoneyValue("");
  };

  const handleAddXp = () => {
    const parsed = parseInt(xpValue, 10);
    if (!isFinite(parsed) || parsed <= 0) {
      setXpError(true);
      return;
    }
    addXp(parsed);
    setXpError(false);
    setXpValue("");
  };

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 glass rounded-xl p-3 w-48 shadow-[0_0_30px_rgba(0,0,0,0.4)] space-y-3">
      {/* Add money */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
          Debug: dodaj #
        </p>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="np. 5.00"
          value={moneyValue}
          onChange={(e) => {
            setMoneyValue(e.target.value);
            if (moneyError) setMoneyError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddMoney();
          }}
          className="w-full px-2 py-1.5 mb-2 rounded-md bg-slate-950/70 border border-cyan-500/20 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-400/60"
        />
        <button
          onClick={handleAddMoney}
          className="w-full px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 text-sm font-semibold hover:bg-cyan-400/30 hover:text-cyan-100 transition-colors"
        >
          Dodaj
        </button>
        {moneyError && (
          <p className="text-red-400/90 text-[11px] mt-2">Nieprawidłowa kwota</p>
        )}
      </div>

      <div className="h-px bg-cyan-500/15" />

      {/* Add XP */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
          Debug: dodaj XP
        </p>
        <input
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          placeholder="np. 100"
          value={xpValue}
          onChange={(e) => {
            setXpValue(e.target.value);
            if (xpError) setXpError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddXp();
          }}
          className="w-full px-2 py-1.5 mb-2 rounded-md bg-slate-950/70 border border-cyan-500/20 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-400/60"
        />
        <button
          onClick={handleAddXp}
          className="w-full px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 text-sm font-semibold hover:bg-cyan-400/30 hover:text-cyan-100 transition-colors"
        >
          Dodaj XP
        </button>
        {xpError && (
          <p className="text-red-400/90 text-[11px] mt-2">Nieprawidłowa wartość</p>
        )}
      </div>
    </div>
  );
}
