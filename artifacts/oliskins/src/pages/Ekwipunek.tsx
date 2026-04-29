import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { Backpack } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export function Ekwipunek() {
  const { inventory, sellItem, sellAll } = useGameStore();

  const totalValue = inventory.reduce((sum, item) => sum + item.valueCents, 0);

  if (inventory.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center h-[calc(100vh-16rem)]">
        <GlassCard className="max-w-md w-full flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-6 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <Backpack className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-200 mb-4">Twój ekwipunek jest pusty</h1>
          <p className="text-slate-400 mb-8">
            Otwórz kilka skrzynek, aby zdobyć swoje pierwsze skiny i zacząć budować potężną kolekcję.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-100">Ekwipunek</h1>
          <p className="text-slate-400 mt-1">Masz {inventory.length} {inventory.length === 1 ? 'przedmiot' : 'przedmiotów'}</p>
        </div>
        
        <GlassCard className="px-6 py-4 flex flex-col sm:flex-row items-center gap-6 sm:w-auto w-full">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Wartość całkowita</p>
            <p className="text-2xl font-mono font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{formatMoney(totalValue)}</p>
          </div>
          <button
            onClick={sellAll}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-400 transition-all font-bold shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          >
            Sprzedaj wszystko
          </button>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {inventory.map((item) => {
          const r = rarityColors[item.rarity];
          return (
            <div key={item.instanceId} className={`glass-card flex flex-col group relative overflow-hidden border-t-4 hover:border-t-4 border-cyan-500/10 hover:border-cyan-400 transition-all`}>
              <div className={`absolute top-0 left-0 right-0 h-1 ${r.bg} ${r.border} border-t-2`}></div>
              <div className="relative aspect-square w-full bg-slate-950/60 p-4 flex items-center justify-center">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-screen opacity-90 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded border bg-slate-950/80 backdrop-blur-md ${r.border} ${r.text} shadow-lg`}>
                    {item.rarity}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col bg-slate-900/40 border-t border-cyan-500/10">
                <h3 className="font-bold text-slate-200 text-sm mb-1 truncate" title={item.name}>{item.name}</h3>
                <p className="font-mono text-cyan-400 font-bold mb-4">{formatMoney(item.valueCents)}</p>
                <div className="mt-auto">
                  <button
                    onClick={() => sellItem(item.instanceId)}
                    className="w-full py-2.5 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50 border border-slate-700/50 transition-all text-sm font-bold"
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
