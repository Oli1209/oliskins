import { useEffect, useRef, useState } from "react";
import { User, X } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { computeLevel } from "../lib/types";
import { formatMoney } from "../lib/format";

export function Profile() {
  const stats = useGameStore((s) => s.stats);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const level = computeLevel(stats.casesOpened);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items: Array<{ label: string; value: string }> = [
    { label: "Łącznie wygrano", value: formatMoney(stats.totalWonCents) },
    { label: "Łącznie wydano", value: formatMoney(stats.totalSpentCents) },
    { label: "Otwarte skrzynki", value: String(stats.casesOpened) },
    { label: "Darmowe skrzynki", value: String(stats.freeCasesOpened) },
    { label: "Bitwy", value: String(stats.totalBattles) },
    { label: "Wygrane bitwy", value: String(stats.wonBattles) },
  ];

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Profil"
        className={`flex items-center gap-2 px-3 h-9 rounded-full border text-sm font-bold transition-all ${
          open
            ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            : "bg-slate-900/60 border-slate-700/40 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200"
        }`}
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Profil</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Profil"
          className="absolute right-0 mt-2 w-[300px] glass-strong rounded-2xl border border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.18)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400/80">
                Profil
              </p>
              <p className="text-2xl font-black text-slate-100 mt-0.5">
                Poziom: <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">{level}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <ul className="space-y-1.5">
            {items.map((it) => (
              <li
                key={it.label}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800/60"
              >
                <span className="text-[12px] uppercase tracking-wider font-bold text-slate-400">
                  {it.label}
                </span>
                <span className="font-mono text-sm font-bold text-slate-100">
                  {it.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
