import { Link, useLocation } from "react-router-dom";
import { useGameStore } from "../store/useGameStore";
import { RotateCcw, PackageOpen, Backpack, MousePointerClick, Gift, Gamepad2, Swords, Wrench } from "lucide-react";
import { BalancePill } from "./BalancePill";
import { Profile } from "./Profile";

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
    { path: "/darmowe-skrzynki", label: "Darmowe skrzynki", icon: Gift },
    { path: "/ekwipunek", label: "Ekwipunek", icon: Backpack },
    { path: "/clicker", label: "Clicker", icon: MousePointerClick },
    { path: "/minigierki", label: "Minigierki", icon: Gamepad2 },
    { path: "/bitwy", label: "Bitwy", icon: Swords },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-strong border-t-0 border-x-0 rounded-none">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tighter text-neon flex items-center gap-2">
          OliSkins
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-all ${
                  isActive 
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" 
                    : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <BalancePill balanceCents={balanceCents} />
          <Profile />
          <Link
            to="/edytor-skrzynek"
            title="Edytor skrzynek"
            className="p-2 rounded-full text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
          >
            <Wrench className="w-4 h-4" />
          </Link>
          <button
            onClick={handleReset}
            className="p-2 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Zresetuj konto"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Mobile Nav */}
      <div className="md:hidden border-t border-cyan-500/10 py-2 px-4 flex justify-center gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-2 flex-1 rounded-lg transition-all ${
                isActive 
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" 
                  : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] uppercase font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
