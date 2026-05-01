import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Coins } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { BetPanel } from "../components/BetPanel";
import { parseBetToCents, canPlaceBet, resolveBet } from "../lib/minigames";
import { formatMoney } from "../lib/format";

type Side = "heads" | "tails";
type Phase = "idle" | "flipping" | "result";

const FLIP_DURATION_MS = 1200;

export function Coinflip() {
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const updateMinigameStats = useGameStore((s) => s.updateMinigameStats);

  const [betInput, setBetInput] = useState("");
  const [selectedSide, setSelectedSide] = useState<Side>("heads");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<{ side: Side; won: boolean; payoutCents: number } | null>(null);
  const [betError, setBetError] = useState<string | null>(null);
  const phaseRef = useRef<Phase>("idle");

  const isPlaying = phase === "flipping";

  const handlePlay = () => {
    if (phaseRef.current !== "idle") return;

    const betCents = parseBetToCents(betInput);
    if (!betCents) {
      setBetError("Podaj prawidłową stawkę (min. #0.01).");
      return;
    }
    if (!canPlaceBet(balanceCents, betCents)) {
      setBetError("Niewystarczający balans.");
      return;
    }

    setBetError(null);
    setResult(null);
    phaseRef.current = "flipping";
    setPhase("flipping");

    // Deduct immediately
    addBalanceCents(-betCents);

    const landedSide: Side = Math.random() < 0.5 ? "heads" : "tails";
    const won = landedSide === selectedSide;
    const { payoutCents, profitCents } = resolveBet(betCents, won ? 2 : 0);

    setTimeout(() => {
      if (won) addBalanceCents(payoutCents);
      updateMinigameStats({ played: 1, wageredCents: betCents, profitCents });
      setResult({ side: landedSide, won, payoutCents });
      phaseRef.current = "result";
      setPhase("result");
    }, FLIP_DURATION_MS);
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
        <h1 className="text-3xl font-black text-slate-100">Coinflip</h1>
      </div>

      <div className="glass-strong rounded-2xl border border-cyan-500/25 p-6 sm:p-8 space-y-6">
        {/* Coin visual */}
        <div className="flex justify-center">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center border-4 bg-gradient-to-br text-5xl select-none
              ${phase === "flipping"
                ? "animate-spin border-yellow-400/60 from-yellow-400/20 to-amber-500/10"
                : result?.won
                ? "border-emerald-400/70 from-emerald-400/20 to-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                : result
                ? "border-red-400/50 from-red-400/10 to-red-500/5"
                : "border-yellow-400/40 from-yellow-400/10 to-amber-500/5"
              }`}
          >
            {phase === "flipping" ? (
              <Coins className="w-12 h-12 text-yellow-400" />
            ) : result ? (
              result.side === "heads" ? "🦅" : "🔄"
            ) : (
              <Coins className="w-12 h-12 text-yellow-400/60" />
            )}
          </div>
        </div>

        {/* Side selector */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Wybierz stronę
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(["heads", "tails"] as Side[]).map((side) => {
              const selected = selectedSide === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => setSelectedSide(side)}
                  disabled={isPlaying}
                  aria-pressed={selected}
                  className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    selected
                      ? "bg-yellow-500/20 border-yellow-400/60 text-yellow-100 shadow-[0_0_18px_rgba(234,179,8,0.2)]"
                      : "bg-slate-900/50 border-slate-700/40 text-slate-300 hover:border-yellow-500/40 hover:text-yellow-200"
                  }`}
                >
                  {side === "heads" ? "🦅 Orzeł" : "🔄 Reszka"}
                </button>
              );
            })}
          </div>
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
        {phase === "idle" || phase === "flipping" ? (
          <button
            type="button"
            onClick={handlePlay}
            disabled={isPlaying}
            className="neon-button w-full h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? "Rzucanie..." : "Graj"}
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
              Wypadło: {result.side === "heads" ? "Orzeł" : "Reszka"}.{" "}
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
