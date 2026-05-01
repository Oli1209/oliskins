import { Link, Outlet, useLocation } from "react-router-dom";
import { Coins, CircleDot, Dice6, Bomb, TrendingUp } from "lucide-react";

const GAMES = [
  {
    path: "/minigierki/coinflip",
    label: "Coinflip",
    icon: Coins,
    description: "Wybierz stronę monety i postaw stawkę. Szansa 50/50 na podwojenie.",
    odds: "x2",
    color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    iconColor: "text-yellow-400",
  },
  {
    path: "/minigierki/x20",
    label: "Koło x20",
    icon: CircleDot,
    description: "Obróć kołem z 22 polami. Czarny x2, Czerwony x3, Niebieski x5, Złoty x20.",
    odds: "x20",
    color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    path: "/minigierki/dice",
    label: "Dice",
    icon: Dice6,
    description: "Wybierz liczbę 1–6 i rzuć kością. Trafienie daje x6 stawki.",
    odds: "x6",
    color: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30",
    iconColor: "text-cyan-400",
  },
  {
    path: "/minigierki/mines",
    label: "Mines",
    icon: Bomb,
    description: "Odkryj bezpieczne pola na siatce 5×5. Cashout kiedy chcesz — ale uważaj na miny!",
    odds: "∞",
    color: "from-red-500/20 to-rose-500/10 border-red-500/30",
    iconColor: "text-red-400",
  },
  {
    path: "/minigierki/crash",
    label: "Crash",
    icon: TrendingUp,
    description: "Mnożnik rośnie — cashout zanim rakieta się rozbije. Im dłużej czekasz, tym większe ryzyko.",
    odds: "x10",
    color: "from-orange-500/20 to-amber-500/10 border-orange-500/30",
    iconColor: "text-orange-400",
  },
];

export function Minigierki() {
  const location = useLocation();
  const isHub = location.pathname === "/minigierki";

  if (!isHub) {
    return <Outlet />;
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl font-black text-slate-100 mb-2">
        Minigierki
      </h1>
      <p className="text-slate-400 mb-8">
        Wypróbuj szczęście w naszych mini-grach. Pamiętaj: graj odpowiedzialnie.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <div
              key={g.path}
              className={`glass-strong rounded-2xl border bg-gradient-to-br p-6 ${g.color} flex flex-col gap-4`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-950/50 border border-white/10 ${g.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-xl text-slate-100">{g.label}</p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${g.iconColor}`}>
                    Max {g.odds}
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-sm flex-1">{g.description}</p>
              <Link
                to={g.path}
                className="neon-button text-center py-2.5 text-sm"
              >
                Graj
              </Link>
            </div>
          );
        })}
      </div>

      <Outlet />
    </div>
  );
}
