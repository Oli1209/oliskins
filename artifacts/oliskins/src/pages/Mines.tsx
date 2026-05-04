import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bomb, Gem } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { BetPanel } from "../components/BetPanel";
import { parseBetToCents, canPlaceBet } from "../lib/minigames";
import { formatMoney } from "../lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

type MineCount = 3 | 6 | 12;
type TileState = "hidden" | "safe" | "mine" | "revealed_mine";
type RoundPhase = "setup" | "playing" | "bust" | "cashed";

const GRID_SIZE = 25;

const INCREMENTS: Record<MineCount, number> = {
  3:  0.20,
  6:  0.35,
  12: 0.60,
};

const MINE_OPTIONS: MineCount[] = [3, 6, 12];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateMines(count: MineCount): Set<number> {
  const positions = new Set<number>();
  while (positions.size < count) {
    positions.add(Math.floor(Math.random() * GRID_SIZE));
  }
  return positions;
}

function computeMultiplier(safePicks: number, mineCount: MineCount): number {
  return 1.0 + safePicks * INCREMENTS[mineCount];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Mines() {
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const addQualifyingSpendCents = useGameStore((s) => s.addQualifyingSpendCents);
  const updateMinigameStats = useGameStore((s) => s.updateMinigameStats);

  // Setup state
  const [mineCount, setMineCount] = useState<MineCount>(3);
  const [betInput, setBetInput] = useState("");
  const [betError, setBetError] = useState<string | null>(null);

  // Round state
  const [phase, setPhase] = useState<RoundPhase>("setup");
  const [mines, setMines] = useState<Set<number>>(new Set());
  const [tiles, setTiles] = useState<TileState[]>(Array(GRID_SIZE).fill("hidden"));
  const [safePicks, setSafePicks] = useState(0);
  const [roundBetCents, setRoundBetCents] = useState(0);
  const [cashoutBusy, setCashoutBusy] = useState(false);

  const isPlaying = phase === "playing";
  const multiplier = computeMultiplier(safePicks, mineCount);
  const potentialPayout = Math.round(roundBetCents * multiplier);

  // ─── Start round ───────────────────────────────────────────────────────────

  const handleStart = () => {
    if (phase !== "setup") return;
    const betCents = parseBetToCents(betInput);
    if (!betCents) { setBetError("Podaj prawidłową stawkę (min. $0.01)."); return; }
    if (!canPlaceBet(balanceCents, betCents)) { setBetError("Niewystarczający balans."); return; }

    setBetError(null);
    addBalanceCents(-betCents);
    updateMinigameStats({ played: 1, wageredCents: betCents });

    setMines(generateMines(mineCount));
    setTiles(Array(GRID_SIZE).fill("hidden"));
    setSafePicks(0);
    setRoundBetCents(betCents);
    setPhase("playing");
  };

  // ─── Tile click ────────────────────────────────────────────────────────────

  const handleTileClick = useCallback((idx: number) => {
    if (phase !== "playing") return;
    setTiles((prev) => {
      if (prev[idx] !== "hidden") return prev;
      return prev;
    });

    setTiles((prev) => {
      if (prev[idx] !== "hidden") return prev;
      const next = [...prev];
      if (mines.has(idx)) {
        for (let i = 0; i < GRID_SIZE; i++) {
          if (mines.has(i)) next[i] = i === idx ? "mine" : "revealed_mine";
        }
      } else {
        next[idx] = "safe";
      }
      return next;
    });

    if (mines.has(idx)) {
      setPhase("bust");
      updateMinigameStats({ profitCents: -roundBetCents });
    } else {
      setSafePicks((prev) => prev + 1);
    }
  }, [phase, mines, roundBetCents, updateMinigameStats]);

  // ─── Cashout ───────────────────────────────────────────────────────────────

  const handleCashout = () => {
    if (phase !== "playing" || safePicks < 1 || cashoutBusy) return;
    setCashoutBusy(true);
    const payout = potentialPayout;
    addBalanceCents(payout);
    const profit = payout - roundBetCents;
    updateMinigameStats({ profitCents: profit });
    // Win: add bet amount to qualifying spend
    addQualifyingSpendCents(roundBetCents);
    // Reveal all mines
    setTiles((prev) => {
      const next = [...prev];
      for (let i = 0; i < GRID_SIZE; i++) {
        if (mines.has(i) && next[i] === "hidden") next[i] = "revealed_mine";
      }
      return next;
    });
    setPhase("cashed");
    setCashoutBusy(false);
  };

  // ─── New round ─────────────────────────────────────────────────────────────

  const handleNewRound = () => {
    setPhase("setup");
    setTiles(Array(GRID_SIZE).fill("hidden"));
    setSafePicks(0);
    setRoundBetCents(0);
    setMines(new Set());
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/minigierki"
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
          aria-label="Wróć"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-black text-slate-100">Mines</h1>
      </div>

      <div className="glass-strong rounded-2xl border border-cyan-500/25 p-5 sm:p-7 space-y-5">
        {/* Mine count selector */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Liczba min
          </p>
          <div className="flex gap-2">
            {MINE_OPTIONS.map((m) => {
              const selected = mineCount === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMineCount(m)}
                  disabled={isPlaying}
                  aria-pressed={selected}
                  className={`flex-1 py-2.5 rounded-xl border font-black text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? "bg-red-500/20 border-red-400/60 text-red-200 shadow-[0_0_16px_rgba(248,113,113,0.2)]"
                      : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-red-500/40 hover:text-red-200"
                  }`}
                >
                  {m} min
                  <span className="block text-[10px] font-medium text-current opacity-70 mt-0.5">
                    +{(INCREMENTS[m] * 100).toFixed(0)}% / traf
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bet + start (only in setup) */}
        {phase === "setup" && (
          <>
            <BetPanel
              betInput={betInput}
              onBetChange={(v) => { setBetInput(v); setBetError(null); }}
              balanceCents={balanceCents}
              disabled={false}
              error={betError}
            />
            <button
              type="button"
              onClick={handleStart}
              className="neon-button w-full h-14 text-lg"
            >
              Start
            </button>
          </>
        )}

        {/* Stats bar (during / after round) */}
        {phase !== "setup" && (
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-cyan-500/20 bg-slate-950/60 p-3">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Trafienia</p>
              <p className="text-lg font-black text-slate-100 mt-0.5">{safePicks}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Mnożnik</p>
              <p className={`text-lg font-black mt-0.5 ${phase === "bust" ? "text-red-400" : "text-cyan-300"}`}>
                x{multiplier.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Potencjał</p>
              <p className={`text-base font-black font-mono mt-0.5 ${phase === "bust" ? "text-red-400" : "text-emerald-300"}`}>
                {phase === "bust" ? "–" : formatMoney(potentialPayout)}
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
        {phase !== "setup" && (
          <div className="grid grid-cols-5 gap-2">
            {tiles.map((state, idx) => {
              const isMine = state === "mine";
              const isRevealedMine = state === "revealed_mine";
              const isSafe = state === "safe";
              const isHidden = state === "hidden";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTileClick(idx)}
                  disabled={!isHidden || phase !== "playing"}
                  aria-label={`Pole ${idx + 1}`}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all text-xl
                    ${isMine
                      ? "bg-red-900/60 border-red-500/70 shadow-[0_0_14px_rgba(239,68,68,0.4)] animate-in zoom-in-75 duration-200"
                      : isRevealedMine
                      ? "bg-slate-900/60 border-red-500/30"
                      : isSafe
                      ? "bg-emerald-900/40 border-emerald-400/60 shadow-[0_0_10px_rgba(52,211,153,0.25)] animate-in zoom-in-75 duration-150"
                      : phase === "playing"
                      ? "bg-slate-800/60 border-slate-600/40 hover:border-cyan-400/50 hover:bg-slate-700/60 cursor-pointer active:scale-95"
                      : "bg-slate-800/40 border-slate-700/30 cursor-default opacity-60"
                    }`}
                >
                  {isMine && <Bomb className="w-5 h-5 text-red-300" />}
                  {isRevealedMine && <Bomb className="w-4 h-4 text-red-500/50" />}
                  {isSafe && <Gem className="w-5 h-5 text-emerald-300" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Action buttons during / after round */}
        {phase === "playing" && (
          <button
            type="button"
            onClick={handleCashout}
            disabled={safePicks < 1 || cashoutBusy}
            className="w-full h-14 rounded-xl border-2 border-emerald-400/60 bg-emerald-500/15 text-emerald-200 font-black text-lg hover:bg-emerald-400/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cashout {safePicks >= 1 ? `(${formatMoney(potentialPayout)})` : ""}
          </button>
        )}

        {/* Result messages + new round */}
        {phase === "bust" && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <p className="text-lg font-black text-red-300">💥 Wybuch! Przegrałeś!</p>
            <p className="text-sm text-red-300/70 mt-1">
              Trafiłeś na minę po {safePicks} bezpiecznych trafieniach.
            </p>
            <button
              type="button"
              onClick={handleNewRound}
              className="mt-3 px-5 py-2 rounded-lg border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-sm hover:border-cyan-400/60 transition-colors"
            >
              Nowa runda
            </button>
          </div>
        )}

        {phase === "cashed" && (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <p className="text-lg font-black text-emerald-300">
              🎉 Wypłacono: {formatMoney(potentialPayout)}
            </p>
            <p className="text-sm text-emerald-300/70 mt-1">
              {safePicks} trafionych pól · x{multiplier.toFixed(2)} mnożnik
            </p>
            <button
              type="button"
              onClick={handleNewRound}
              className="mt-3 px-5 py-2 rounded-lg border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-sm hover:border-cyan-400/60 transition-colors"
            >
              Nowa runda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
