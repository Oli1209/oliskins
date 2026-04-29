import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockCases } from "../data/mockCases";
import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { InventoryItem } from "../lib/types";
import { GlassCard } from "../components/GlassCard";

export function Skrzynki() {
  const { balanceCents, openCase } = useGameStore();
  const navigate = useNavigate();
  const [openingResult, setOpeningResult] = useState<{ item: InventoryItem; caseName: string } | null>(null);

  const handleOpenCase = (caseId: string, caseName: string) => {
    const result = openCase(caseId);
    if (result.ok) {
      setOpeningResult({ item: result.item, caseName });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-100 mb-2">Wszystkie skrzynki</h1>
        <p className="text-slate-400">Spróbuj swojego szczęścia i otwórz najlepsze skiny.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockCases.map((c) => {
          const canAfford = balanceCents >= c.priceCents;
          
          return (
            <GlassCard key={c.id} className="flex flex-col p-0">
              <div className="p-6 pb-0 flex-1">
                <div className="relative aspect-video mb-6 rounded-lg overflow-hidden border border-cyan-500/20 bg-black/40">
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover opacity-80 mix-blend-screen" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                </div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">{c.name}</h2>
                <p className="text-slate-400 text-sm mb-6 min-h-[40px]">{c.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {c.drops.map((drop) => {
                    const r = rarityColors[drop.rarity];
                    return (
                      <span key={drop.id} className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border bg-black/40 ${r.border} ${r.text}`}>
                        {drop.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 pt-0 mt-auto border-t border-cyan-500/10 mt-6 bg-slate-950/40">
                <div className="pt-6">
                  <button
                    onClick={() => handleOpenCase(c.id, c.name)}
                    disabled={!canAfford}
                    className="w-full neon-button flex items-center justify-between"
                  >
                    <span>Otwórz skrzynkę</span>
                    <span className="font-mono text-lg">{formatMoney(c.priceCents)}</span>
                  </button>
                  {!canAfford && (
                    <p className="text-red-400/80 text-sm mt-3 text-center font-semibold">Za mało środków</p>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {openingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-strong max-w-sm w-full p-8 flex flex-col items-center text-center rounded-2xl animate-in zoom-in-95 duration-500 border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">
              Wypadło ze skrzynki: <span className="text-cyan-400">{openingResult.caseName}</span>
            </h2>
            
            <div className={`my-8 relative w-56 h-56 rounded-xl flex items-center justify-center overflow-hidden border-2 bg-slate-950 ${rarityColors[openingResult.item.rarity].border} ${rarityColors[openingResult.item.rarity].glow}`}>
              <img src={openingResult.item.image} alt={openingResult.item.name} className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80" />
              <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-4`}>
                <span className={`text-sm font-black uppercase tracking-widest ${rarityColors[openingResult.item.rarity].text} drop-shadow-md`}>
                  {openingResult.item.rarity}
                </span>
              </div>
            </div>

            <h3 className="text-3xl font-black text-slate-100 mb-3">{openingResult.item.name}</h3>
            <div className="glass px-6 py-2 mb-8 inline-flex">
              <p className="text-cyan-400 font-mono text-2xl font-bold">
                {formatMoney(openingResult.item.valueCents)}
              </p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setOpeningResult(null)}
                className="w-full neon-button"
              >
                Zamknij
              </button>
              <button
                onClick={() => navigate('/ekwipunek')}
                className="w-full py-3 font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Idź do ekwipunku
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
