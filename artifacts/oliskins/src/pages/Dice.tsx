import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { BetPanel } from "../components/BetPanel";
import { parseBetToCents, canPlaceBet, resolveBet } from "../lib/minigames";
import { formatMoney } from "../lib/format";

type Phase = "idle" | "rolling" | "result";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const ROLL_DURATION_MS = 1100;
const SHUFFLE_INTERVAL_MS = 80;

export function Dice() {
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const addQualifyingSpendCents = useGameStore((s) => s.addQualifyingSpendCents);
  const updateMinigameStats = useGameStore((s) => s.updateMinigameStats);

  const [betInput, setBetInput] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayFace, setDisplayFace] = useState<string>("⚄");
  const [result, setResult] = useState<{
    rolled: number;
    won: boolean;
    payoutCents: number;
  } | null>(null);
  const [betError, setBetError] = useState<string | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const shuffleRef = useRef<number | null>(null);

  const isPlaying = phase === "rolling";

  useEffect(() => {
    return () => {
      if (shuffleRef.current !== null) window.clearInterval(shuffleRef.current);
    };
  }, []);

  const stopShuffle = () => {
    if (shuffleRef.current !== null) {
      window.clearInterval(shuffleRef.current);
      shuffleRef.current = null;
    }
  };

  const handleRoll = () => {
    if (phaseRef.current !== "idle") return;
    if (selectedNumber === null) {
      setBetError("Wybierz liczbę przed rzutem.");
      return;
    }
    const betCents = parseBetToCents(betInput);
    if (!betCents) { setBetError("Podaj prawidłową stawkę (min. $0.01)."); return; }
    if (!canPlaceBet(balanceCents, betCents)) { setBetError("Niewystarczający balans."); return; }

    setBetError(null);
    setResult(null);
    phaseRef.current = "rolling";
    setPhase("rolling");

    addBalanceCents(-betCents);

    const rolled = Math.floor(Math.random() * 6) + 1;
    const won = rolled === selectedNumber;
    const { payoutCents, profitCents } = resolveBet(betCents, won ? 6 : 0);

    shuffleRef.current = window.setInterval(() => {
      const rand = Math.floor(Math.random() * 6);
      setDisplayFace(DICE_FACES[rand]);
    }, SHUFFLE_INTERVAL_MS);

    window.setTimeout(() => {
      stopShuffle();
      setDisplayFace(DICE_FACES[rolled - 1]);
      if (won) {
        addBalanceCents(payoutCents);
        // Win: add bet amount to qualifying spend
        addQualifyingSpendCents(betCents);
      }
      updateMinigameStats({ played: 1, wageredCents: betCents, profitCents });
      setResult({ rolled, won, payoutCents });
      phaseRef.current = "result";
      setPhase("result");
    }, ROLL_DURATION_MS);
  };

  const handleReset = () => {
    setPhase("idle");
    phaseRef.current = "idle";
    setResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/minigierki"
          className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
          aria-label="Wróć"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-black text-slate-100">Dice</h1>
      </div>

      <div className="glass-strong rounded-2xl border border-cyan-500/25 p-6 sm:p-8 space-y-6">
        {/* Dice face */}
        <div className="flex justify-center">
          <div
            className={`w-28 h-28 rounded-2xl flex items-center justify-center text-6xl border-2 select-none transition-all
              ${phase === "rolling"
                ? "border-cyan-400/60 bg-slate-800/80 shadow-[0_0_24px_rgba(34,211,238,0.3)] scale-105"
                : result?.won
                ? "border-emerald-400/70 bg-emerald-950/40 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                : result
                ? "border-red-400/40 bg-red-950/30"
                : "border-slate-600/50 bg-slate-800/60"
              }`}
          >
            {displayFace}
          </div>
        </div>

        {/* Number selector */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Wybierz liczbę (1–6)
          </p>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const selected = selectedNumber === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setSelectedNumber(n); setBetError(null); }}
                  disabled={isPlaying}
                  aria-pressed={selected}
                  className={`py-3 rounded-xl border font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? "bg-cyan-500/25 border-cyan-400/70 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)]"
                      : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Wygrana: x6 stawki · Szansa: 1/6
          </p>
        </div>

        {/* Bet */}
        <BetPanel
          betInput={betInput}
          onBetChange={(v) => { setBetInput(v); setBetError(null); }}
          balanceCents={balanceCents}
          disabled={isPlaying}
          error={betError}
        />

        {/* CTA */}
        {phase === "idle" || phase === "rolling" ? (
          <button
            type="button"
            onClick={handleRoll}
            disabled={isPlaying}
            className="neon-button w-full h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? "Rzucanie..." : "Rzuć kością"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="w-full h-14 rounded-xl border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-lg hover:border-cyan-400/60 hover:bg-slate-800/60 transition-colors"
          >
            Zagraj ponownie
          </button>
        )}

        {/* Result */}
        {result && (
          <div
            className={`rounded-xl border p-4 text-center animate-in fade-in zoom-in-95 duration-200 ${
              result.won
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/30 bg-red-400/5 text-red-300"
            }`}
          >
            <p className="text-lg font-black">
              {result.won ? "🎉 Wygrałeś!" : "💸 Przegrałeś!"}
            </p>
            <p className="text-sm font-semibold mt-1 opacity-80">
              Wylosowano: <span className="font-black">{result.rolled}</span>.{" "}
              {result.won
                ? `Wygrana: ${formatMoney(result.payoutCents)}`
                : "Stawka przepada."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
