import { Link } from "react-router-dom";
import { PackageOpen, Backpack, MousePointerClick } from "lucide-react";

export function Start() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-indigo-600 drop-shadow-[0_0_20px_rgba(217,70,239,0.3)]">
        OliSkins
      </h1>
      <p className="text-xl text-zinc-400 mb-12 max-w-2xl">
        Otwieraj skrzynki, zdobywaj niesamowite skiny i zbuduj swój wymarzony ekwipunek w mrocznym świecie neonów.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link to="/skrzynki" className="group">
          <div className="glass-card p-8 flex flex-col items-center gap-4 h-full">
            <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(217,70,239,0.4)]">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Skrzynki</h2>
            <p className="text-zinc-500 text-sm">Otwieraj skrzynie z unikalnymi nagrodami</p>
          </div>
        </Link>

        <Link to="/ekwipunek" className="group">
          <div className="glass-card p-8 flex flex-col items-center gap-4 h-full">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]">
              <Backpack className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Ekwipunek</h2>
            <p className="text-zinc-500 text-sm">Przeglądaj i sprzedawaj swoje łupy</p>
          </div>
        </Link>

        <Link to="/clicker" className="group">
          <div className="glass-card p-8 flex flex-col items-center gap-4 h-full">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]">
              <MousePointerClick className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">Clicker</h2>
            <p className="text-zinc-500 text-sm">Zarabiaj środki klikając</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
