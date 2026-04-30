import { Link, Outlet } from "react-router-dom";
import { Lock, Gift, Clock, Check } from "lucide-react";
import { freeCases } from "../data/freeCases";
import { useGameStore } from "../store/useGameStore";
import { computeLevel } from "../lib/types";
import { GlassCard } from "../components/GlassCard";
import { rarityColors } from "../lib/rarity";
import { useFreeCooldown, formatCooldown } from "../hooks/useFreeCooldown";

export function DarmoweSkrzynki() {
  const stats = useGameStore((s) => s.stats);
  const level = computeLevel(stats.casesOpened);
  const { msLeft, ready } = useFreeCooldown();

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-100 mb-2 flex items-center gap-3">
            <Gift className="w-9 h-9 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            Darmowe skrzynki
          </h1>
          <p className="text-slate-400">
            Otwieraj skrzynki za darmo co godzinę. Wyższe poziomy odblokowują lepsze nagrody.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/60 px-5 py-3 flex items-center gap-4 self-start md:self-end">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${ready ? "text-emerald-400" : "text-amber-300"}`} />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Cooldown
              </span>
              <span className={`font-mono text-lg font-black ${ready ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-amber-300"}`}>
                {ready ? "Gotowe" : `Dostępne za: ${formatCooldown(msLeft)}`}
              </span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              Twój poziom
            </span>
            <span className="font-mono text-lg font-black text-cyan-400">
              {level}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {freeCases.map((c) => {
          const isLocked = level < c.requiredLevel;
          const canOpen = !isLocked && ready;
          const target = `/darmowe-skrzynki/${c.id}`;

          const cardInner = (
            <GlassCard
              className={`flex flex-col p-0 relative overflow-hidden h-full transition-transform duration-200 ${
                canOpen ? "group-hover:scale-[1.025]" : ""
              } ${isLocked ? "opacity-70" : ""}`}
            >
              <div className="p-6 pb-0 flex-1">
                <div className="relative aspect-video mb-6 rounded-lg overflow-hidden border border-emerald-500/20 bg-black/40">
                  <img
                    src={c.image}
                    alt={c.name}
                    className={`w-full h-full object-cover opacity-80 mix-blend-screen transition-transform duration-500 ${
                      canOpen ? "group-hover:scale-105" : ""
                    } ${isLocked ? "grayscale" : ""}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300">
                      Tier {c.tier}
                    </span>
                  </div>
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
                      <div className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-950/80 border border-amber-400/40">
                        <Lock className="w-6 h-6 text-amber-300" />
                        <span className="text-xs uppercase tracking-wider font-bold text-amber-200">
                          Wymagany poziom: {c.requiredLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">
                  {c.name}
                </h2>
                <p className="text-slate-400 text-sm mb-6 min-h-[40px]">
                  {c.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {c.drops.map((drop) => {
                    const r = rarityColors[drop.rarity];
                    return (
                      <span
                        key={drop.id}
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded border bg-black/40 ${r.border} ${r.text}`}
                      >
                        {drop.name}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-5 mt-auto border-t border-emerald-500/10 bg-slate-950/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
                  {isLocked ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-300" />
                      <span className="text-amber-300">
                        Wymagany poziom: {c.requiredLevel}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Odblokowane</span>
                    </>
                  )}
                </div>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    canOpen
                      ? "bg-emerald-500/20 border border-emerald-400/60 text-emerald-200 group-hover:bg-emerald-500/30 shadow-[0_0_18px_rgba(52,211,153,0.25)]"
                      : "bg-slate-900/60 border border-slate-700/40 text-slate-500"
                  }`}
                >
                  {isLocked
                    ? "Zablokowane"
                    : !ready
                    ? `Cooldown: ${formatCooldown(msLeft)}`
                    : "Otwórz"}
                </span>
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent group-hover:border-emerald-400/40 group-focus-visible:border-emerald-400/40 transition-colors duration-200 shadow-[0_0_0_rgba(52,211,153,0)] group-hover:shadow-[0_0_35px_rgba(52,211,153,0.25)] group-focus-visible:shadow-[0_0_35px_rgba(52,211,153,0.25)]" />
            </GlassCard>
          );

          if (canOpen) {
            return (
              <Link
                key={c.id}
                to={target}
                className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                {cardInner}
              </Link>
            );
          }
          return (
            <div
              key={c.id}
              className="group block rounded-2xl cursor-not-allowed"
              aria-disabled="true"
            >
              {cardInner}
            </div>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
