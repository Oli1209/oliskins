import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { BetPanel } from "../components/BetPanel";
import { parseBetToCents, canPlaceBet } from "../lib/minigames";
import { formatMoney } from "../lib/format";

// ─── Constants ───────────────────────────────────────────────────────────────

const TICK_MS = 50;

// Distribution: exponential-like, mostly 1.5–1.9, occasionally 3–10x
function generateCrashAt(): number {
  const u = Math.random();
  const raw = 1 + (-Math.log(Math.max(u, 0.001))) * 1.2;
  return Math.max(1.01, Math.min(10, raw));
}

// Mild exponential curve: 1.0 at t=0, ~2.0 at t≈2.5s, ~4.0 at t≈5s
function computeMultiplier(elapsedMs: number): number {
  const t = elapsedMs / 1000;
  return 1.0 + t * 0.4 + t * t * 0.04;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "setup" | "running" | "cashed" | "crashed";

// ─── Component ───────────────────────────────────────────────────────────────

export function Crash() {
  const balanceCents = useGameStore((s) => s.balanceCents);
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const updateMinigameStats = useGameStore((s) => s.updateMinigameStats);

  const [betInput, setBetInput] = useState("");
  const [betError, setBetError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentMult, setCurrentMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState(0);
  const [roundBetCents, setRoundBetCents] = useState(0);
  const [resultPayout, setResultPayout] = useState(0);
  const [resultCrashAt, setResultCrashAt] = useState(0);

  const phaseRef = useRef<Phase>("setup");
  const tickRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const crashAtRef = useRef<number>(0);
  const roundBetRef = useRef<number>(0);
  const cashoutBusyRef = useRef(false);

  const isRunning = phase === "running";

  // Cleanup on unmount
  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const stopTick = () => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  const handleStart = () => {
    if (phaseRef.current !== "setup") return;

    const betCents = parseBetToCents(betInput);
    if (!betCents) { setBetError("Podaj prawidłową stawkę (min. #0.01)."); return; }
    if (!canPlaceBet(balanceCents, betCents)) { setBetError("Niewystarczający balans."); return; }

    setBetError(null);
    cashoutBusyRef.current = false;
    addBalanceCents(-betCents);
    updateMinigameStats({ played: 1, wageredCents: betCents });
    roundBetRef.current = betCents;
    setRoundBetCents(betCents);

    const ca = generateCrashAt();
    crashAtRef.current = ca;
    setCrashAt(ca);
    startTimeRef.current = Date.now();
    setCurrentMult(1.0);
    phaseRef.current = "running";
    setPhase("running");

    tickRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const mult = computeMultiplier(elapsed);
      setCurrentMult(mult);

      if (mult >= crashAtRef.current) {
        stopTick();
        setCurrentMult(crashAtRef.current);
        updateMinigameStats({ profitCents: -roundBetRef.current });
        setResultCrashAt(crashAtRef.current);
        phaseRef.current = "crashed";
        setPhase("crashed");
      }
    }, TICK_MS) as unknown as number;
  };

  const handleCashout = () => {
    if (phaseRef.current !== "running" || cashoutBusyRef.current) return;
    cashoutBusyRef.current = true;
    stopTick();

    const mult = computeMultiplier(Date.now() - startTimeRef.current);
    const payout = Math.round(roundBetRef.current * mult);
    addBalanceCents(payout);
    const profit = payout - roundBetRef.current;
    updateMinigameStats({ profitCents: profit });
    setResultPayout(payout);
    setCurrentMult(mult);
    phaseRef.current = "cashed";
    setPhase("cashed");
  };

  const handleReset = () => {
    stopTick();
    phaseRef.current = "setup";
    setPhase("setup");
    setCurrentMult(1.0);
    setCrashAt(0);
    cashoutBusyRef.current = false;
  };

  // Plane vertical position: rises from 70% to 15% of display height as mult grows
  const planeProgress = Math.min(1, (currentMult - 1) / 4);
  const planeY = 70 - planeProgress * 55; // percent top

  const multColor =
    phase === "crashed"
      ? "text-red-400"
      : currentMult >= 2
      ? "text-emerald-400"
      : "text-cyan-300";

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
        <h1 className="text-3xl font-black text-slate-100">Crash</h1>
      </div>

      <div className="glass-strong rounded-2xl border border-cyan-500/25 p-5 sm:p-7 space-y-5">

        {/* Crash display area */}
        <div
          className={`relative overflow-hidden rounded-xl border h-52 flex items-center justify-center transition-colors duration-500 ${
            phase === "crashed"
              ? "border-red-500/50 bg-red-950/30"
              : phase === "cashed"
              ? "border-emerald-500/40 bg-emerald-950/20"
              : "border-cyan-500/20 bg-slate-950/50"
          }`}
        >
          {/* Grid lines for depth */}
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="none">
            {[20, 40, 60, 80].map((p) => (
              <line key={p} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="currentColor" strokeWidth="1" />
            ))}
            {[20, 40, 60, 80].map((p) => (
              <line key={p} x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="currentColor" strokeWidth="1" />
            ))}
          </svg>

          {/* Rocket / plane */}
          {phase !== "setup" && (
            <div
              className="absolute text-3xl transition-none pointer-events-none select-none"
              style={{
                top: `${planeY}%`,
                left: "50%",
                transform: `translateX(-50%) ${phase === "crashed" ? "rotate(90deg) scale(1.2)" : "rotate(-20deg)"}`,
                transition: phase === "running" ? "top 0.15s linear" : "transform 0.3s ease",
                filter: phase === "crashed" ? "grayscale(1)" : undefined,
              }}
            >
              {phase === "crashed" ? "💥" : "🚀"}
            </div>
          )}

          {/* Big multiplier */}
          <div className="text-center z-10">
            {phase === "setup" ? (
              <p className="text-slate-500 text-sm uppercase tracking-[0.3em] font-bold">
                Postaw stawkę i kliknij Start
              </p>
            ) : (
              <>
                <p
                  className={`font-black font-mono tabular-nums transition-colors duration-100 ${multColor}`}
                  style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", lineHeight: 1 }}
                >
                  x{currentMult.toFixed(2)}
                </p>
                {phase === "crashed" && (
                  <p className="text-red-400/80 text-sm font-bold mt-2 uppercase tracking-wider animate-in fade-in duration-300">
                    Crash!
                  </p>
                )}
                {phase === "cashed" && (
                  <p className="text-emerald-400/80 text-sm font-bold mt-2 uppercase tracking-wider animate-in fade-in duration-300">
                    Wypłacono!
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bet panel (only in setup) */}
        {phase === "setup" && (
          <BetPanel
            betInput={betInput}
            onBetChange={(v) => { setBetInput(v); setBetError(null); }}
            balanceCents={balanceCents}
            disabled={false}
            error={betError}
          />
        )}

        {/* Bet + potential payout during round */}
        {isRunning && (
          <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-slate-950/60 px-4 py-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Stawka</p>
              <p className="text-base font-black text-slate-200 font-mono">{formatMoney(roundBetCents)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Potencjalna wypłata</p>
              <p className="text-base font-black text-emerald-300 font-mono">
                {formatMoney(Math.round(roundBetCents * currentMult))}
              </p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {phase === "setup" && (
          <button type="button" onClick={handleStart} className="neon-button w-full h-14 text-lg">
            Start
          </button>
        )}

        {isRunning && (
          <button
            type="button"
            onClick={handleCashout}
            className="w-full h-14 rounded-xl border-2 border-emerald-400/60 bg-emerald-500/15 text-emerald-200 font-black text-lg hover:bg-emerald-400/25 transition-colors"
          >
            Cashout ({formatMoney(Math.round(roundBetCents * currentMult))})
          </button>
        )}

        {/* Result messages */}
        {phase === "crashed" && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <p className="text-lg font-black text-red-300">💥 Crash przy x{resultCrashAt.toFixed(2)}</p>
            <p className="text-sm text-red-300/70 mt-1">Stawka {formatMoney(roundBetCents)} przepada.</p>
            <button type="button" onClick={handleReset} className="mt-3 px-5 py-2 rounded-lg border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-sm hover:border-cyan-400/60 transition-colors">
              Nowa runda
            </button>
          </div>
        )}

        {phase === "cashed" && (
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <p className="text-lg font-black text-emerald-300">🎉 Wypłacono: {formatMoney(resultPayout)} przy x{currentMult.toFixed(2)}</p>
            <p className="text-sm text-emerald-300/70 mt-1">
              Zysk netto: {formatMoney(resultPayout - roundBetCents)}
            </p>
            <button type="button" onClick={handleReset} className="mt-3 px-5 py-2 rounded-lg border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-sm hover:border-cyan-400/60 transition-colors">
              Nowa runda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
