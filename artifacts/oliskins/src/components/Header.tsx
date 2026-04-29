import { Link, useLocation } from "react-router-dom";
import { useGameStore } from "../store/useGameStore";
import { formatMoney } from "../lib/format";
import { RotateCcw, PackageOpen, Backpack, MousePointerClick } from "lucide-react";

export function Header() {
  const { balanceCents, reset } = useGameStore();
  const location = useLocation();

  const handleReset = () => {
    if (window.confirm("Czy na pewno chcesz zresetować całe konto? Stracisz wszystkie przedmioty i wrócisz do początkowego salda.")) {
      reset();
    }
  };

  const navItems = [
    { path: "/skrzynki", label: "Skrzynki", icon: PackageOpen },
    { path: "/ekwipunek", label: "Ekwipunek", icon: Backpack },
    { path: "/clicker", label: "Clicker", icon: MousePointerClick },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tighter text-neon flex items-center gap-2">
          OliSkins
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" 
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="glass-panel px-4 py-1.5 flex items-center gap-2">
            <span className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Saldo</span>
            <span className="font-mono font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
              {formatMoney(balanceCents)}
            </span>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Zresetuj konto"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
