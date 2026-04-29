import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { Backpack } from "lucide-react";

export function Ekwipunek() {
  const { inventory, sellItem, sellAll } = useGameStore();

  const totalValue = inventory.reduce((sum, item) => sum + item.valueCents, 0);

  if (inventory.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-zinc-900/50 flex items-center justify-center text-zinc-700 mb-6">
          <Backpack className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-400 mb-2">Twój ekwipunek jest pusty</h1>
        <p className="text-zinc-600 max-w-md">
          Otwórz kilka skrzynek, aby zdobyć swoje pierwsze skiny i zacząć budować potężną kolekcję.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-zinc-100">Ekwipunek</h1>
          <p className="text-zinc-500 mt-1">Masz {inventory.length} {inventory.length === 1 ? 'przedmiot' : 'przedmiotów'}</p>
        </div>
        
        <div className="glass-panel px-6 py-4 flex items-center gap-6">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Wartość całkowita</p>
            <p className="text-xl font-mono font-bold text-emerald-400">{formatMoney(totalValue)}</p>
          </div>
          <button
            onClick={sellAll}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-colors font-semibold"
          >
            Sprzedaj wszystko
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {inventory.map((item) => {
          const r = rarityColors[item.rarity];
          return (
            <div key={item.instanceId} className={`glass-card flex flex-col group relative overflow-hidden border-t-2 border-t-transparent hover:border-t-${r.border.split('-')[1]}-400`}>
              <div className="relative aspect-square w-full">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border bg-black/60 backdrop-blur-md ${r.border} ${r.text}`}>
                    {item.rarity}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-zinc-200 text-sm mb-1 truncate">{item.name}</h3>
                <p className="font-mono text-emerald-400 font-semibold mb-4">{formatMoney(item.valueCents)}</p>
                <div className="mt-auto">
                  <button
                    onClick={() => sellItem(item.instanceId)}
                    className="w-full py-2 rounded bg-zinc-800/50 text-zinc-300 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 border border-transparent transition-all text-sm font-semibold"
                  >
                    Sprzedaj
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
