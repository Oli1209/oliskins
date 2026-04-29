import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockCases } from "../data/mockCases";
import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { Case, InventoryItem } from "../lib/types";
import { GlassCard } from "../components/GlassCard";
import { CaseRollModal } from "../components/CaseRollModal";

type RollState = {
  caseData: Case;
  winningItem: InventoryItem;
};

export function Skrzynki() {
  const { balanceCents, openCase } = useGameStore();
  const navigate = useNavigate();
  const [rollState, setRollState] = useState<RollState | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const handleOpenCase = (caseData: Case) => {
    if (isRolling) return;
    const result = openCase(caseData.id);
    if (result.ok) {
      setIsRolling(true);
      setRollState({ caseData, winningItem: result.item });
    }
  };

  const handleClose = () => {
    setRollState(null);
    setIsRolling(false);
  };

  const handleOpenAgain = () => {
    if (!rollState) return;
    const sameCase = rollState.caseData;
    setRollState(null);
    setIsRolling(false);
    setTimeout(() => handleOpenCase(sameCase), 0);
  };

  const handleGoToInventory = () => {
    setRollState(null);
    setIsRolling(false);
    navigate("/ekwipunek");
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
          const buttonDisabled = !canAfford || isRolling;

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
                    onClick={() => handleOpenCase(c)}
                    disabled={buttonDisabled}
                    className="w-full neon-button flex items-center justify-between"
                  >
                    <span>{isRolling ? "Otwieranie..." : "Otwórz skrzynkę"}</span>
                    <span className="font-mono text-lg">{formatMoney(c.priceCents)}</span>
                  </button>
                  {!canAfford && !isRolling && (
                    <p className="text-red-400/80 text-sm mt-3 text-center font-semibold">Za mało środków</p>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {rollState && (
        <CaseRollModal
          caseData={rollState.caseData}
          winningItem={rollState.winningItem}
          onClose={handleClose}
          onOpenAgain={handleOpenAgain}
          onGoToInventory={handleGoToInventory}
        />
      )}
    </div>
  );
}
