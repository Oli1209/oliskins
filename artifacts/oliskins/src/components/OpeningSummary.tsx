import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InventoryItem } from "../lib/types";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { useGameStore } from "../store/useGameStore";
import { fireGoldConfetti, shouldFireForItems } from "../lib/confetti";

type Props = {
  items: InventoryItem[];
  onClose: () => void;
  /** Used to qualify confetti against "5x case price". Omit for free cases. */
  casePriceCents?: number;
};

function pluralPrzedmiot(n: number): string {
  if (n === 1) return "1 przedmiot";
  if (n >= 2 && n <= 4) return `${n} przedmioty`;
  return `${n} przedmiotów`;
}

export function OpeningSummary({ items, onClose, casePriceCents }: Props) {
  const sellItem = useGameStore((s) => s.sellItem);
  const inventory = useGameStore((s) => s.inventory);
  const confettiEnabled = useGameStore((s) => s.settings.confettiEnabled);

  const [recentIds, setRecentIds] = useState<string[]>(() =>
    items.map((i) => i.instanceId)
  );
  const [busy, setBusy] = useState(false);
  const confettiFiredRef = useRef(false);

  // Fire confetti once on mount when items qualify and the setting is on.
  useEffect(() => {
    if (confettiFiredRef.current) return;
    if (!confettiEnabled) return;
    if (!shouldFireForItems(items, casePriceCents)) return;
    confettiFiredRef.current = true;
    fireGoldConfetti();
    // Intentionally only depend on initial items snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presentRecentItems = useMemo(() => {
    const set = new Set(recentIds);
    return inventory.filter((i) => set.has(i.instanceId));
  }, [inventory, recentIds]);

  useEffect(() => {
    if (recentIds.length === 0) {
      onClose();
    }
  }, [recentIds, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = presentRecentItems.reduce((s, i) => s + i.valueCents, 0);

  const handleSellOne = useCallback(
    (instanceId: string) => {
      if (busy) return;
      setBusy(true);
      const r = sellItem(instanceId);
      if (r.ok) {
        setRecentIds((prev) => prev.filter((id) => id !== instanceId));
      }
      setBusy(false);
    },
    [busy, sellItem]
  );

  const handleSellAll = useCallback(() => {
    if (busy || presentRecentItems.length === 0) return;
    setBusy(true);
    for (const it of presentRecentItems) {
      sellItem(it.instanceId);
    }
    setRecentIds([]);
    setBusy(false);
  }, [busy, presentRecentItems, sellItem]);

  const gridCols =
    presentRecentItems.length === 1
      ? "grid-cols-1 max-w-sm mx-auto"
      : presentRecentItems.length === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-3";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-label="Podsumowanie otwarcia"
    >
      <div className="glass-strong w-full max-w-3xl rounded-2xl border-cyan-500/40 shadow-[0_0_60px_rgba(34,211,238,0.18)] p-5 sm:p-8 animate-in zoom-in-95 duration-200">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-400/80">
              Wynik otwarcia
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1">
              Wypadło: {pluralPrzedmiot(presentRecentItems.length)}
            </h3>
          </div>
          <p className="text-cyan-400 font-mono text-2xl sm:text-3xl font-black drop-shadow-[0_0_10px_rgba(34,211,238,0.45)] whitespace-nowrap">
            {formatMoney(total)}
          </p>
        </div>

        <div className={`grid gap-4 mb-6 ${gridCols}`}>
          {presentRecentItems.map((it) => {
            const r = rarityColors[it.rarity];
            return (
              <div
                key={it.instanceId}
                className={`group relative rounded-xl border-2 bg-slate-950/70 overflow-hidden ${r.border} ${r.glow}`}
              >
                <div className="aspect-square relative">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-85"
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur-md border ${r.border} ${r.text}`}
                    >
                      {it.rarity}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSellOne(it.instanceId)}
                    disabled={busy}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/30 border border-red-400/60 text-red-100 backdrop-blur-md transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 hover:bg-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    aria-label={`Sprzedaj ${it.name} za ${formatMoney(it.valueCents)}`}
                  >
                    Sprzedaj {formatMoney(it.valueCents)}
                  </button>
                </div>
                <div className="p-3">
                  <p
                    className="text-sm font-semibold text-slate-100 truncate"
                    title={it.name}
                  >
                    {it.name}
                  </p>
                  <p className="mt-0.5 text-cyan-400 font-mono text-base font-bold">
                    {formatMoney(it.valueCents)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleSellAll}
            disabled={busy || presentRecentItems.length === 0}
            className="flex-1 neon-button h-12 sm:h-14 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sprzedaj wszystko ({formatMoney(total)})
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 sm:flex-initial sm:px-8 h-12 sm:h-14 rounded-lg font-semibold text-slate-200 border border-cyan-500/30 bg-slate-900/60 hover:border-cyan-400/60 hover:text-cyan-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Zachowaj
          </button>
        </div>
      </div>
    </div>
  );
}
