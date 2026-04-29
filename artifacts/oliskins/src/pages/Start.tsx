import { Link } from "react-router-dom";
import { PackageOpen, Backpack, MousePointerClick } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

export function Start() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.15)_0%,transparent_50%)] pointer-events-none"></div>
      
      <div className="relative z-10">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
          OliSkins
        </h1>
        <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
          Otwieraj skrzynki, zdobywaj niesamowite skiny i zbuduj swój wymarzony ekwipunek. Prawdziwe emocje i unikalne łupy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          <Link to="/skrzynki" className="group">
            <GlassCard className="h-full flex flex-col items-center gap-4 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] border border-cyan-500/20">
                <PackageOpen className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Skrzynki</h2>
              <p className="text-slate-400 text-sm">Otwieraj skrzynie z unikalnymi nagrodami i buduj wartość</p>
            </GlassCard>
          </Link>

          <Link to="/ekwipunek" className="group">
            <GlassCard className="h-full flex flex-col items-center gap-4 hover:border-emerald-400/50 hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-emerald-500/20">
                <Backpack className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Ekwipunek</h2>
              <p className="text-slate-400 text-sm">Przeglądaj i sprzedawaj swoje zjawiskowe łupy</p>
            </GlassCard>
          </Link>

          <Link to="/clicker" className="group">
            <GlassCard className="h-full flex flex-col items-center gap-4 hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] border border-blue-500/20">
                <MousePointerClick className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100">Clicker</h2>
              <p className="text-slate-400 text-sm">Zarabiaj dodatkowe środki i powiększaj kapitał</p>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
