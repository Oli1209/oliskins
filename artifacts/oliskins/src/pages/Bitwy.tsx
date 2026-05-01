import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swords, Plus, Trash2, LogIn } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { useBattleStore, computeTotalCostCents } from "../store/useBattleStore";
import { BattleSetupModal } from "../components/BattleSetupModal";
import { mockCases } from "../data/mockCases";
import { MODE_LABELS } from "../lib/battleTypes";
import { formatMoney } from "../lib/format";
import type { BattleSetup } from "../store/useBattleStore";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Oczekiwanie",
  in_progress: "W trakcie",
  completed: "Zakończona",
};

const STATUS_COLORS: Record<string, string> = {
  waiting: "text-yellow-300 border-yellow-400/40 bg-yellow-400/5",
  in_progress: "text-emerald-300 border-emerald-400/40 bg-emerald-400/5",
  completed: "text-slate-400 border-slate-500/30 bg-slate-800/40",
};

export function Bitwy() {
  const navigate = useNavigate();
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const { battles, createBattle, deleteBattle } = useBattleStore();

  const [showSetup, setShowSetup] = useState(false);

  const handleCreate = (setup: BattleSetup) => {
    const totalCost = computeTotalCostCents(setup.cases);
    const yourShare = Math.floor(totalCost / setup.maxPlayers);
    addBalanceCents(-yourShare);

    const battle = createBattle(setup);
    setShowSetup(false);
    navigate(`/bitwy/${battle.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Swords className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-black text-slate-100">Bitwy na skrzynki</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowSetup(true)}
          className="neon-button flex items-center gap-2 px-5 py-2.5"
        >
          <Plus className="w-4 h-4" />
          Nowa bitwa
        </button>
      </div>

      {/* Battle list */}
      <section>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
          Aktywne bitwy
        </h2>

        {battles.length === 0 ? (
          <div className="glass-strong rounded-2xl border border-cyan-500/15 p-12 text-center">
            <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-base">Brak aktywnych bitw.</p>
            <p className="text-slate-600 text-sm mt-1">Kliknij „Nowa bitwa", aby rozpocząć.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...battles].reverse().map((battle) => {
              const totalCost = computeTotalCostCents(battle.cases);
              const previewCases = battle.cases.slice(0, 3);
              const extra = battle.cases.length - previewCases.length;

              return (
                <div
                  key={battle.id}
                  className="glass-strong rounded-2xl border border-cyan-500/15 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-200">Ty</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        STATUS_COLORS[battle.status] ?? STATUS_COLORS.waiting
                      }`}>
                        {STATUS_LABELS[battle.status] ?? battle.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/40 bg-purple-400/5 text-purple-300">
                        {MODE_LABELS[battle.mode]}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {battle.participants.length}/{battle.maxPlayers} graczy
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {previewCases.map((sc, i) => {
                        const caseData = mockCases.find((c) => c.id === sc.caseId);
                        return (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700/40 bg-slate-900/50 text-slate-400 truncate max-w-[100px]"
                          >
                            {caseData?.name ?? sc.caseId} ×{sc.qty}
                          </span>
                        );
                      })}
                      {extra > 0 && (
                        <span className="text-[10px] text-slate-500">+{extra}</span>
                      )}
                      <span className="text-[10px] font-black text-slate-300 ml-auto font-mono">
                        {formatMoney(totalCost)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/bitwy/${battle.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-bold text-sm hover:bg-cyan-500/20 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Wejdź
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteBattle(battle.id)}
                      className="p-2 rounded-xl border border-slate-700/40 bg-slate-900/50 text-slate-500 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showSetup && (
        <BattleSetupModal
          onClose={() => setShowSetup(false)}
          onConfirm={handleCreate}
          balanceCents={balanceCents}
        />
      )}
    </div>
  );
}
