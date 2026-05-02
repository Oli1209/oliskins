import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Bot, User, Crown, Swords, Shield, Trophy,
  Plus, X as XIcon,
} from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { useBattleStore } from "../store/useBattleStore";
import { computePendingRewards, buildStepList } from "../lib/battleRng";
import { getEffectiveDrops } from "../lib/chances";
import { MODE_LABELS } from "../lib/battleTypes";
import { rarityColors } from "../lib/rarity";
import { formatMoney } from "../lib/format";
import { mockCases } from "../data/mockCases";
import { BattleReelStrip, RevealedDropCard } from "../components/BattleReelStrip";
import type { BattleStep } from "../lib/battleRng";
import type { Battle, BattleDrop, Participant } from "../lib/battleTypes";
import type { InventoryItem } from "../lib/types";

const REEL_DURATION_MS = 3200;
const PAUSE_BETWEEN_STEPS_MS = 900;
const COUNTDOWN_START = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function teamOf(idx: number): "A" | "B" {
  return idx < 2 ? "A" : "B";
}

// ─── Waiting Slot ─────────────────────────────────────────────────────────────

function WaitingSlot({
  participant,
  slotIndex,
  isHost,
  isTeams,
  onAddBot,
  onRemoveBot,
}: {
  participant?: Participant;
  slotIndex: number;
  isHost: boolean;
  isTeams: boolean;
  onAddBot: () => void;
  onRemoveBot: (id: string) => void;
}) {
  const team = isTeams ? teamOf(slotIndex) : null;
  const teamBorder = team === "A" ? "border-cyan-500/40" : "border-purple-500/40";
  const teamBg = team === "A" ? "bg-cyan-500/5" : "bg-purple-500/5";

  if (participant) {
    return (
      <div
        className={`glass-strong rounded-xl border p-4 flex items-center gap-3 ${
          isTeams ? `${teamBorder} ${teamBg}` : "border-cyan-500/20"
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
          {participant.isBot ? (
            <Bot className="w-5 h-5 text-slate-400" />
          ) : (
            <User className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-200 truncate">{participant.name}</p>
          {team && (
            <p className={`text-[10px] font-bold ${team === "A" ? "text-cyan-400" : "text-purple-400"}`}>
              Team {team}
            </p>
          )}
        </div>
        {isHost && participant.isBot && (
          <button
            type="button"
            onClick={() => onRemoveBot(participant.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Usuń bota"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onAddBot}
      disabled={!isHost}
      className={`glass-strong rounded-xl border p-4 flex items-center gap-3 w-full transition-all ${
        isTeams ? `${teamBorder} ${teamBg}` : "border-slate-700/30"
      } ${isHost ? "hover:border-cyan-500/40 hover:bg-cyan-500/5 cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
    >
      <div className="w-9 h-9 rounded-full bg-slate-900/60 border border-dashed border-slate-600/50 flex items-center justify-center shrink-0">
        <Plus className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold text-slate-500">Wolne miejsce</p>
        {team && (
          <p className={`text-[10px] font-bold ${team === "A" ? "text-cyan-500/60" : "text-purple-500/60"}`}>
            Team {team}
          </p>
        )}
      </div>
      {isHost && (
        <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded border border-slate-700/40">
          Dodaj bota
        </span>
      )}
    </button>
  );
}

// ─── Participant Battle Column ─────────────────────────────────────────────────

function ParticipantColumn({
  participant,
  slotIndex,
  battle,
  isTeams,
  isShared,
  isWinner,
  isTeamWinner,
  revealedCount,
  animStep,
  spinning,
  stepList,
}: {
  participant: Participant;
  slotIndex: number;
  battle: Battle;
  isTeams: boolean;
  isShared: boolean;
  isWinner: boolean;
  isTeamWinner: boolean;
  revealedCount: number;
  animStep: number;
  spinning: boolean;
  stepList: BattleStep[];
}) {
  const result = battle.result!;
  const drops = result.dropsByParticipant[participant.id] ?? [];
  const revealedDrops = drops.slice(0, revealedCount);
  const currentTotal = revealedDrops.reduce((s, d) => s + d.valueCents, 0);

  const team = isTeams ? teamOf(slotIndex) : null;
  const teamAccent = team === "A" ? "cyan" : team === "B" ? "purple" : "cyan";

  // Winner styling: no crown/ring in shared mode
  const showWinnerRing = !isShared && (isWinner || isTeamWinner) && battle.status === "completed";
  const showLoserDim = !isShared && battle.status === "completed" && !isWinner && !isTeamWinner;

  const currentStep = stepList[animStep];
  const currentDrop = drops[animStep];
  // Use effective drops for the correct mode as filler (Boost/Jester aware)
  const fillerDrops = currentStep
    ? getEffectiveDrops(currentStep.caseData, currentStep.sc.openMode)
    : [];

  const showReel = spinning && animStep >= 0 && animStep < drops.length && !!currentDrop && !!currentStep;
  const betweenSteps = !spinning && revealedCount > 0 && revealedCount < drops.length;

  return (
    <div
      className={`glass-strong rounded-2xl border flex flex-col gap-3 p-4 transition-all ${
        team === "A"
          ? "border-cyan-500/30"
          : team === "B"
          ? "border-purple-500/30"
          : "border-slate-700/30"
      } ${showWinnerRing ? "ring-2 ring-amber-400/60 shadow-[0_0_24px_rgba(251,191,36,0.2)]" : ""} ${showLoserDim ? "opacity-50" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            participant.isBot ? "bg-slate-800" : `bg-${teamAccent}-500/20`
          }`}
        >
          {participant.isBot ? (
            <Bot className="w-5 h-5 text-slate-400" />
          ) : (
            <User className={`w-5 h-5 text-${teamAccent}-400`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-200 truncate">{participant.name}</p>
          {team && (
            <p className={`text-[10px] font-bold text-${teamAccent}-400`}>Team {team}</p>
          )}
        </div>
        {showWinnerRing && (
          <Crown className="w-5 h-5 text-amber-400 shrink-0" />
        )}
      </div>

      {/* Running total */}
      <div className={`text-center py-2 rounded-xl border ${
        team === "A" ? "border-cyan-500/20 bg-cyan-500/5" :
        team === "B" ? "border-purple-500/20 bg-purple-500/5" :
        "border-slate-700/30 bg-slate-900/40"
      }`}>
        <p className={`text-xl font-black font-mono ${
          team === "A" ? "text-cyan-300" :
          team === "B" ? "text-purple-300" :
          "text-slate-200"
        }`}>
          {formatMoney(currentTotal)}
        </p>
        <p className="text-[10px] text-slate-500">
          {revealedCount}/{drops.length} skrzynek
        </p>
      </div>

      {/* Reel zone */}
      <div className="min-h-[120px]">
        {showReel ? (
          <BattleReelStrip
            key={`${participant.id}-step-${animStep}`}
            fillerDrops={fillerDrops}
            winner={currentDrop}
            durationMs={REEL_DURATION_MS}
            tileSize={90}
          />
        ) : betweenSteps ? (
          <div className="flex items-center justify-center h-[110px] rounded-xl border border-slate-700/30 bg-slate-950/40">
            <p className="text-xs text-slate-600 animate-pulse">Następna skrzynka…</p>
          </div>
        ) : null}
      </div>

      {/* Revealed drops */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
        {[...revealedDrops].reverse().map((drop) => (
          <RevealedDropCard key={drop.instanceId} drop={drop} />
        ))}
        {revealedDrops.length === 0 && (
          <p className="text-[11px] text-slate-600 text-center py-2">Brak dropów</p>
        )}
      </div>
    </div>
  );
}

// ─── Main BattleRoom ──────────────────────────────────────────────────────────

export function BattleRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { battles, addBot, removeBot, startBattle, completeBattle, markClaimed } =
    useBattleStore();
  const { addBalanceCents } = useGameStore();

  const battle = battles.find((b) => b.id === id);

  // ── countdown ──
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  // ── animation state ──
  // animStep: index of the step currently showing/having shown its reel (-1 = not started)
  const [animStep, setAnimStep] = useState(-1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const animStarted = useRef(false);
  const animCleanupRef = useRef<(() => void) | null>(null);

  // ── result ──
  const [showResult, setShowResult] = useState(false);

  const isTeams = battle?.battleFormat === "teams";
  const isShared = battle?.mode === "shared";

  // Precompute step list (carries caseData + openMode per step)
  const stepList = battle ? buildStepList(battle, mockCases) : [];
  const totalSteps = stepList.length;

  // ── Self-contained animation runner (fixes the React effect cleanup bug) ──
  // We use a recursive setTimeout chain stored entirely in refs/closures.
  // React state updates (setAnimStep, setSpinning, etc.) are one-way: they only
  // trigger re-renders for display. Progression is driven by the closure, NOT
  // by re-running effects when `spinning` changes.
  useEffect(() => {
    if (battle?.status !== "in_progress" || animStarted.current) return;
    animStarted.current = true;

    const battleId = battle.id;
    const steps = totalSteps; // captured once
    const timers: number[] = [];
    let cancelled = false;

    const cleanup = () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      timers.length = 0;
    };
    animCleanupRef.current = cleanup;

    const runStep = (step: number) => {
      if (cancelled || step >= steps) return;

      setAnimStep(step);
      setSpinning(true);

      const t1 = window.setTimeout(() => {
        if (cancelled) return;
        setRevealedCount(step + 1);
        setSpinning(false);

        const t2 = window.setTimeout(() => {
          if (cancelled) return;
          if (step + 1 < steps) {
            runStep(step + 1);
          } else {
            // All steps done — complete and show results
            completeBattle(battleId);
            setShowResult(true);
          }
        }, PAUSE_BETWEEN_STEPS_MS);
        timers.push(t2);
      }, REEL_DURATION_MS + 150);
      timers.push(t1);
    };

    runStep(0);

    // Cleanup only on unmount (not when spinning changes — that was the bug!)
    return cleanup;
  }, [battle?.status]); // eslint-disable-line

  // Ensure cleanup if component unmounts mid-animation
  useEffect(() => {
    return () => { animCleanupRef.current?.(); };
  }, []);

  // ── Claim handler (guarded against double-claim) ──
  const handleClaim = (action: "keep" | "sell" | "shared") => {
    if (!battle?.result || battle.result.claimed) {
      navigate("/bitwy");
      return;
    }

    if (action === "shared") {
      const perHead = battle.result.sharedPerHeadCents ?? 0;
      if (perHead > 0) addBalanceCents(perHead);
    } else {
      const pending = computePendingRewards(battle);
      if (pending.length > 0) {
        if (action === "sell") {
          addBalanceCents(pending.reduce((s, d) => s + d.valueCents, 0));
        } else {
          const newItems: InventoryItem[] = pending.map((d) => ({
            instanceId: d.instanceId,
            dropId: d.dropId,
            name: d.name,
            rarity: d.rarity,
            image: d.image,
            valueCents: d.valueCents,
            acquiredAt: Date.now(),
            locked: false,
          }));
          useGameStore.setState((s) => ({ inventory: [...s.inventory, ...newItems] }));
        }
      }
    }

    markClaimed(battle.id);
    setShowResult(false);
    navigate("/bitwy");
  };

  // ── Not found ──
  if (!battle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Nie znaleziono bitwy.</p>
        <Link to="/bitwy" className="text-cyan-400 mt-4 inline-block">← Wróć</Link>
      </div>
    );
  }

  const result = battle.result;
  const isHost = true;

  const winnerIds = new Set<string>();
  if (result?.winnerId) winnerIds.add(result.winnerId);
  const winnerTeam = result?.teamWinnerId ?? null;

  // ── Countdown start ──
  const handleStartCountdown = () => {
    if (battle.participants.length < battle.maxPlayers) return;
    if (countdownTimerRef.current) return; // already counting
    let count = COUNTDOWN_START;
    setCountdown(count);
    countdownTimerRef.current = window.setInterval(() => {
      count--;
      if (count <= 0) {
        window.clearInterval(countdownTimerRef.current!);
        countdownTimerRef.current = null;
        setCountdown(null);
        startBattle(battle.id);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const slots = Array.from({ length: battle.maxPlayers }, (_, i) => battle.participants[i]);

  // ── WAITING ──────────────────────────────────────────────────────────────────
  if (battle.status === "waiting") {
    const full = battle.participants.length === battle.maxPlayers;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/bitwy" className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Swords className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-black text-slate-100">Poczekalnia</h1>
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full border border-purple-400/40 bg-purple-400/5 text-purple-300">
            {MODE_LABELS[battle.mode]}
          </span>
          {isTeams && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-300">
              2v2
            </span>
          )}
        </div>

        {isTeams && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full bg-cyan-500/5">
                ⚔ Team A
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-widest text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full bg-purple-500/5">
                🛡 Team B
              </span>
            </div>
          </div>
        )}

        <div className={`grid gap-3 ${
          isTeams ? "grid-cols-2"
          : battle.maxPlayers === 2 ? "grid-cols-2"
          : battle.maxPlayers === 3 ? "grid-cols-3"
          : "grid-cols-2 sm:grid-cols-4"
        }`}>
          {slots.map((p, i) => (
            <WaitingSlot
              key={i}
              participant={p}
              slotIndex={i}
              isHost={isHost}
              isTeams={isTeams}
              onAddBot={() => addBot(battle.id)}
              onRemoveBot={(pid) => removeBot(battle.id, pid)}
            />
          ))}
        </div>

        <div className="glass-strong rounded-xl border border-slate-700/30 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Skrzynki</p>
          <div className="flex flex-wrap gap-2">
            {battle.cases.map((sc, i) => {
              const c = mockCases.find((x) => x.id === sc.caseId);
              return (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/40 bg-slate-900/50">
                  {c?.image && <img src={c.image} alt="" className="w-6 h-5 rounded object-cover" />}
                  <span className="text-xs font-bold text-slate-300">{c?.name ?? sc.caseId}</span>
                  <span className="text-[10px] text-slate-500">×{sc.qty} · {sc.openMode}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {battle.participants.length}/{battle.maxPlayers} graczy
          </p>
          {countdown !== null ? (
            <div className="neon-button px-8 py-3 text-2xl font-black tabular-nums pointer-events-none">
              {countdown}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartCountdown}
              disabled={!full}
              className="neon-button px-8 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {full
                ? "Rozpocznij bitwę"
                : `Czekaj na graczy (${battle.participants.length}/${battle.maxPlayers})`}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── IN PROGRESS / COMPLETED ───────────────────────────────────────────────

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 animate-pulse">Ładowanie wyników…</p>
      </div>
    );
  }

  // Team revealed totals (for score bar)
  const teamATotalRevealed = isTeams
    ? [0, 1].reduce((s, i) => {
        const p = battle.participants[i];
        if (!p) return s;
        return s + (result.dropsByParticipant[p.id] ?? []).slice(0, revealedCount).reduce((a, d) => a + d.valueCents, 0);
      }, 0)
    : 0;
  const teamBTotalRevealed = isTeams
    ? [2, 3].reduce((s, i) => {
        const p = battle.participants[i];
        if (!p) return s;
        return s + (result.dropsByParticipant[p.id] ?? []).slice(0, revealedCount).reduce((a, d) => a + d.valueCents, 0);
      }, 0)
    : 0;

  const participantOrder = battle.participants;

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/bitwy" className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Swords className="w-6 h-6 text-cyan-400" />
        <h1 className="text-xl font-black text-slate-100">
          {battle.status === "in_progress" ? "Bitwa w toku" : "Bitwa zakończona"}
        </h1>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-purple-400/40 bg-purple-400/5 text-purple-300">
          {MODE_LABELS[battle.mode]}
        </span>
        {isTeams && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-400/30 bg-cyan-400/5 text-cyan-300">2v2</span>
        )}
        <span className="ml-auto text-xs text-slate-500 font-mono">
          {Math.min(revealedCount, totalSteps)}/{totalSteps} skrzynek
        </span>
      </div>

      {/* Teams score bar */}
      {isTeams && (
        <div className="glass-strong rounded-xl border border-slate-700/30 p-4 flex items-center gap-4">
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-0.5">⚔ Team A</p>
            <p className="text-2xl font-black font-mono text-cyan-300">{formatMoney(teamATotalRevealed)}</p>
          </div>
          <Shield className="w-6 h-6 text-slate-600" />
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-0.5">🛡 Team B</p>
            <p className="text-2xl font-black font-mono text-purple-300">{formatMoney(teamBTotalRevealed)}</p>
          </div>
        </div>
      )}

      {/* Participant columns */}
      <div
        className={`grid gap-4 ${
          participantOrder.length <= 2 ? "grid-cols-2"
          : participantOrder.length === 3 ? "grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {participantOrder.map((p, idx) => (
          <ParticipantColumn
            key={p.id}
            participant={p}
            slotIndex={idx}
            battle={battle}
            isTeams={isTeams}
            isShared={isShared}
            isWinner={winnerIds.has(p.id)}
            isTeamWinner={winnerTeam != null ? teamOf(idx) === winnerTeam : false}
            revealedCount={revealedCount}
            animStep={animStep}
            spinning={spinning}
            stepList={stepList}
          />
        ))}
      </div>

      {/* Result modal */}
      {showResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl border border-cyan-500/30 w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="text-center space-y-1">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
              <h2 className="text-2xl font-black text-slate-100">
                {isShared
                  ? "Wyniki bitwy"
                  : winnerTeam
                  ? `Team ${winnerTeam} wygrywa!`
                  : result.winnerId
                  ? `${battle.participants.find((p) => p.id === result.winnerId)?.name ?? "Gracz"} wygrywa!`
                  : "Koniec bitwy"}
              </h2>
            </div>

            {isShared ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-700/30 bg-slate-950/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Pula całkowita</span>
                    <span className="font-black text-slate-200 font-mono">
                      {formatMoney(
                        Object.values(result.totalValueByParticipant).reduce((s, v) => s + v, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-700/30 pt-2">
                    <span className="text-slate-400">Na głowę</span>
                    <span className="font-black text-emerald-400 font-mono text-lg">
                      {formatMoney(result.sharedPerHeadCents ?? 0)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleClaim("shared")}
                  className="neon-button w-full h-12 text-base"
                >
                  Odbierz {formatMoney(result.sharedPerHeadCents ?? 0)}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const pending = computePendingRewards(battle);
                  const userWon = pending.length > 0;
                  const totalVal = pending.reduce((s, d) => s + d.valueCents, 0);
                  return (
                    <>
                      {userWon ? (
                        <div className="space-y-1.5 max-h-52 overflow-y-auto">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Twoje nagrody ({pending.length} itemów · {formatMoney(totalVal)})
                          </p>
                          {pending.slice(0, 12).map((d) => {
                            const rc = rarityColors[d.rarity];
                            return (
                              <div key={d.instanceId} className={`flex items-center gap-2 rounded-lg border ${rc.border} bg-slate-900/60 px-2.5 py-1.5`}>
                                {d.image && <img src={d.image} alt="" className="w-7 h-7 rounded object-cover mix-blend-screen" />}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${rc.text}`}>{d.name}</p>
                                </div>
                                <span className="text-xs font-black text-slate-300 font-mono">{formatMoney(d.valueCents)}</span>
                              </div>
                            );
                          })}
                          {pending.length > 12 && (
                            <p className="text-xs text-slate-500 text-center">…i {pending.length - 12} więcej</p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-700/30 bg-slate-950/50 p-6 text-center">
                          <p className="text-slate-400 text-sm">Nie wygrałeś tej bitwy.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {userWon ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleClaim("keep")}
                              className="py-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-bold text-sm hover:bg-cyan-500/20 transition-colors"
                            >
                              Zachowaj ({pending.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClaim("sell")}
                              className="py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold text-sm hover:bg-emerald-500/20 transition-colors"
                            >
                              Sprzedaj ({formatMoney(totalVal)})
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleClaim("keep")}
                            className="col-span-2 py-3 rounded-xl border border-slate-700/40 bg-slate-900/50 text-slate-400 font-bold text-sm hover:bg-slate-800/60 transition-colors"
                          >
                            Zamknij
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
