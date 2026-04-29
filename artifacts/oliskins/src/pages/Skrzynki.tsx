import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockCases } from "../data/mockCases";
import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { InventoryItem } from "../lib/types";

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
      <h1 className="text-4xl font-bold text-zinc-100 mb-8">Dostępne Skrzynki</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCases.map((c) => {
          const canAfford = balanceCents >= c.priceCents;
          
          return (
            <div key={c.id} className="glass-card flex flex-col">
              <div className="p-6 pb-0 flex-1">
                <img src={c.image} alt={c.name} className="w-full aspect-video object-cover rounded-lg mb-4" />
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">{c.name}</h2>
                <p className="text-zinc-400 text-sm mb-4">{c.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {c.drops.map((drop) => {
                    const r = rarityColors[drop.rarity];
                    return (
                      <span key={drop.id} className={`text-xs px-2 py-1 rounded-full border ${r.bg} ${r.border} ${r.text}`}>
                        {drop.name}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 mt-auto">
                <button
                  onClick={() => handleOpenCase(c.id, c.name)}
                  disabled={!canAfford}
                  className="w-full neon-button flex items-center justify-between"
                >
                  <span>Otwórz skrzynkę</span>
                  <span className="font-mono">{formatMoney(c.priceCents)}</span>
                </button>
                {!canAfford && (
                  <p className="text-red-400 text-sm mt-2 text-center">Za mało środków</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {openingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card max-w-sm w-full p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
            <h2 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">
              Wypadło ze skrzynki: {openingResult.caseName}
            </h2>
            
            <div className={`my-6 relative w-48 h-48 rounded-xl flex items-center justify-center overflow-hidden border-2 ${rarityColors[openingResult.item.rarity].border} ${rarityColors[openingResult.item.rarity].glow}`}>
              <img src={openingResult.item.image} alt={openingResult.item.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4`}>
                <span className={`text-sm font-bold uppercase tracking-wider ${rarityColors[openingResult.item.rarity].text}`}>
                  {openingResult.item.rarity}
                </span>
              </div>
            </div>

            <h3 className="text-3xl font-bold text-zinc-100 mb-2">{openingResult.item.name}</h3>
            <p className="text-emerald-400 font-mono text-2xl font-bold mb-8">
              Wartość: {formatMoney(openingResult.item.valueCents)}
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setOpeningResult(null)}
                className="w-full neon-button"
              >
                Zamknij
              </button>
              <button
                onClick={() => navigate('/ekwipunek')}
                className="w-full py-3 text-zinc-400 hover:text-zinc-200 transition-colors"
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
