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

                {/* Hover glow ring */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent group-hover:border-cyan-400/40 group-focus-visible:border-cyan-400/40 transition-colors duration-200 shadow-[0_0_0_rgba(34,211,238,0)] group-hover:shadow-[0_0_35px_rgba(34,211,238,0.25)] group-focus-visible:shadow-[0_0_35px_rgba(34,211,238,0.25)]" />

                {!canAfford && (
                  <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-bold text-red-300/90 bg-red-950/60 border border-red-400/30 px-2 py-1 rounded">
                    Za mało środków
                  </div>
                )}
              </GlassCard>
            </Link>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
