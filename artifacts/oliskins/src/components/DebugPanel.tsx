import { useState } from "react";
import { useGameStore } from "../store/useGameStore";

export function DebugPanel() {
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleAdd = () => {
    const parsed = parseFloat(value.replace(",", "."));
    if (!isFinite(parsed) || parsed <= 0) {
      setError(true);
      return;
    }
    const cents = Math.round(parsed * 100);
    if (cents <= 0) {
      setError(true);
      return;
    }
    addBalanceCents(cents);
    setError(false);
    setValue("");
  };

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 glass rounded-xl p-3 w-48 shadow-[0_0_30px_rgba(0,0,0,0.4)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">
        Debug: dodaj #
      </p>
      <input
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="np. 5.00"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleAdd();
        }}
        className="w-full px-2 py-1.5 mb-2 rounded-md bg-slate-950/70 border border-cyan-500/20 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-400/60"
      />
      <button
        onClick={handleAdd}
        className="w-full px-3 py-1.5 rounded-md bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 text-sm font-semibold hover:bg-cyan-400/30 hover:text-cyan-100 transition-colors"
      >
        Dodaj
      </button>
      {error && (
        <p className="text-red-400/90 text-[11px] mt-2">Nieprawidłowa kwota</p>
      )}
    </div>
  );
}
