import { useMemo, useState, useEffect, useRef } from "react";
import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { Backpack, Lock, Unlock } from "lucide-react";
import { GlassCard } from "../components/GlassCard";
import { InventoryItem, InventorySort, Rarity } from "../lib/types";

const SORT_LABELS: Record<InventorySort, string> = {
  date_new: "Data: najnowsze",
  date_old: "Data: najstarsze",
  price_asc: "Cena: rosnąco",
  price_desc: "Cena: malejąco",
  rarity: "Rzadkość",
};

const RARITY_RANK: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

function sortInventory(
  items: InventoryItem[],
  sort: InventorySort
): InventoryItem[] {
  const arr = [...items];
  switch (sort) {
    case "date_new":
      return arr.sort((a, b) => b.acquiredAt - a.acquiredAt);
    case "date_old":
      return arr.sort((a, b) => a.acquiredAt - b.acquiredAt);
    case "price_asc":
      return arr.sort((a, b) => a.valueCents - b.valueCents);
    case "price_desc":
      return arr.sort((a, b) => b.valueCents - a.valueCents);
    case "rarity":
      return arr.sort(
        (a, b) =>
          RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] ||
          b.valueCents - a.valueCents
      );
  }
}

function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const show = (msg: string) => {
    setMessage(msg);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2800);
  };

  return { message, show };
}

export function Ekwipunek() {
  const inventory = useGameStore((s) => s.inventory);
  const inventorySort = useGameStore((s) => s.inventorySort);
  const setInventorySort = useGameStore((s) => s.setInventorySort);
  const sellItem = useGameStore((s) => s.sellItem);
  const sellAll = useGameStore((s) => s.sellAll);
  const toggleLock = useGameStore((s) => s.toggleLock);

  const { message, show } = useToast();

  const sorted = useMemo(
    () => sortInventory(inventory, inventorySort),
    [inventory, inventorySort]
  );

  const totalValue = inventory.reduce((sum, item) => sum + item.valueCents, 0);
  const unlockedItems = inventory.filter((i) => !i.locked);
  const unlockedValue = unlockedItems.reduce(
    (sum, i) => sum + i.valueCents,
    0
  );

  const handleSell = (instanceId: string) => {
    const result = sellItem(instanceId);
    if (!result.ok && result.reason === "locked") {
      show("Ten przedmiot jest zablokowany.");
    }
  };

  const handleSellAll = () => {
    const result = sellAll();
    if (result.soldCents === 0) {
      show("Brak odblokowanych przedmiotów.");
      return;
    }
    show(
      `Sprzedano: ${formatMoney(result.soldCents)}` +
        (result.skipped > 0 ? ` (pominięto: ${result.skipped} zablok.)` : "")
    );
  };

  if (inventory.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center h-[calc(100vh-16rem)]">
        <GlassCard className="max-w-md w-full flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <Backpack className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-200 mb-4">
            Twój ekwipunek jest pusty
          </h1>
          <p className="text-slate-400 mb-8">
            Otwórz kilka skrzynek, aby zdobyć swoje pierwsze skiny i zacząć
            budować potężną kolekcję.
          </p>
        </GlassCard>
      </div>
    );
  }

  const sellAllDisabled = unlockedItems.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-100">Ekwipunek</h1>
          <p className="text-slate-400 mt-1">
            Masz {inventory.length}{" "}
            {inventory.length === 1 ? "przedmiot" : "przedmiotów"}
            {unlockedItems.length !== inventory.length && (
              <span className="text-slate-500">
                {" "}
                ({inventory.length - unlockedItems.length} zablok.)
              </span>
            )}
          </p>
        </div>

        <GlassCard className="px-6 py-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 sm:w-auto w-full">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
              Wartość całkowita
            </p>
            <p className="text-2xl font-mono font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              {formatMoney(totalValue)}
            </p>
            {unlockedValue !== totalValue && (
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                odblok.: {formatMoney(unlockedValue)}
              </p>
            )}
          </div>
          <button
            onClick={handleSellAll}
            disabled={sellAllDisabled}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400 transition-all font-bold shadow-[0_0_15px_rgba(245,158,11,0.1)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-500/10 disabled:hover:border-amber-500/30"
          >
            Sprzedaj wszystko
          </button>
        </GlassCard>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label
          htmlFor="inv-sort"
          className="text-xs uppercase tracking-wider font-bold text-slate-500"
        >
          Sortuj
        </label>
        <select
          id="inv-sort"
          value={inventorySort}
          onChange={(e) => setInventorySort(e.target.value as InventorySort)}
          className="px-3 py-2 rounded-md bg-slate-950/70 border border-cyan-500/20 text-slate-100 text-sm focus:outline-none focus:border-cyan-400/60"
        >
          {(Object.keys(SORT_LABELS) as InventorySort[]).map((key) => (
            <option key={key} value={key} className="bg-slate-900">
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {sorted.map((item) => {
          const r = rarityColors[item.rarity];
          return (
            <div
              key={item.instanceId}
              className={`glass-card flex flex-col group relative overflow-hidden border-t-4 hover:border-t-4 border-cyan-500/10 hover:border-cyan-400 transition-all ${
                item.locked ? "ring-1 ring-amber-400/30" : ""
              }`}
            >
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${r.bg} ${r.border} border-t-2`}
              ></div>
              <div className="relative aspect-square w-full bg-slate-950/60 p-4 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain mix-blend-screen opacity-90 group-hover:scale-110 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3">
                  {item.locked && (
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300/70 group-hover:text-amber-300 group-hover:border-amber-400/70 group-focus-within:text-amber-300 transition-colors"
                      aria-label="Przedmiot zablokowany"
                      title="Zablokowany"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3">
                  <span
                    className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded border bg-slate-950/80 backdrop-blur-md ${r.border} ${r.text} shadow-lg`}
                  >
                    {item.rarity}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col bg-slate-900/40 border-t border-cyan-500/10">
                <h3
                  className="font-bold text-slate-200 text-sm mb-1 truncate"
                  title={item.name}
                >
                  {item.name}
                </h3>
                <p className="font-mono text-cyan-400 font-bold mb-4">
                  {formatMoney(item.valueCents)}
                </p>

                <div className="mt-auto flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleSell(item.instanceId)}
                    disabled={item.locked}
                    className="flex-1 py-2.5 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50 border border-slate-700/50 transition-all text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 disabled:hover:text-slate-300 disabled:hover:border-slate-700/50"
                  >
                    Sprzedaj
                  </button>
                  <button
                    onClick={() => toggleLock(item.instanceId)}
                    className={`shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                      item.locked
                        ? "bg-amber-500/15 border-amber-400/50 text-amber-300 hover:bg-amber-500/25"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-cyan-500/15 hover:border-cyan-400/50 hover:text-cyan-300"
                    }`}
                    aria-label={item.locked ? "Odblokuj" : "Zablokuj"}
                    title={item.locked ? "Odblokuj" : "Zablokuj"}
                  >
                    {item.locked ? (
                      <Unlock className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong border border-cyan-400/40 rounded-xl px-5 py-3 text-sm font-semibold text-slate-100 shadow-[0_0_30px_rgba(34,211,238,0.25)] animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {message}
        </div>
      )}
    </div>
  );
}
