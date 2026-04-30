import { Link, Outlet } from "react-router-dom";
import { mockCases } from "../data/mockCases";
import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";
import { GlassCard } from "../components/GlassCard";

export function Skrzynki() {
  const balanceCents = useGameStore((s) => s.balanceCents);

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-100 mb-2">
          Wszystkie skrzynki
        </h1>
        <p className="text-slate-400">
          Spróbuj swojego szczęścia i otwórz najlepsze skiny.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockCases.map((c) => {
          const canAfford = balanceCents >= c.priceCents;
          return (
            <Link
              key={c.id}
              to={`/skrzynki/${c.id}`}
              className="group block rounded-2xl transition-transform duration-200 hover:scale-[1.025] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <GlassCard className="flex flex-col p-0 relative overflow-hidden h-full">
                <div className="p-6 pb-0 flex-1">
                  <div className="relative aspect-video mb-6 rounded-lg overflow-hidden border border-cyan-500/20 bg-black/40">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover opacity-80 mix-blend-screen transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
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

                <div className="px-6 py-5 mt-auto border-t border-cyan-500/10 bg-slate-950/40 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                    Cena
                  </span>
                  <span className="font-mono text-lg text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                    {formatMoney(c.priceCents)}
                  </span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-4 p-6 pointer-events-none">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400/80">
                    Skrzynka
                  </p>
                  <h3 className="text-2xl font-black text-slate-100 text-center">
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-300">
                    <span>
                      <span className="text-slate-500">Cena: </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {formatMoney(c.priceCents)}
                      </span>
                    </span>
                    <span className="text-slate-700">|</span>
                    <span>
                      <span className="text-slate-500">Dropy: </span>
                      <span className="font-bold text-slate-100">
                        {c.drops.length}
                      </span>
                    </span>
                  </div>
                  <span className="mt-2 px-8 py-3 rounded-lg bg-cyan-500/20 border border-cyan-400/70 text-cyan-100 font-black uppercase tracking-wider shadow-[0_0_25px_rgba(34,211,238,0.35)]">
                    Otwórz
                  </span>
                  {!canAfford && (
                    <p className="text-red-400/90 text-xs font-semibold">
                      Za mało środków
                    </p>
                  )}
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
