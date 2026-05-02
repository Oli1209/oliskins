import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Bot, User, Crown, Swords, Shield, Trophy,
  Plus, X as XIcon, TrendingDown, Users, SkipForward, Rewind,
} from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { useBattleStore } from "../store/useBattleStore";
import { computePendingRewards, buildStepList } from "../lib/battleRng";
import { computeTotalCostCents } from "../store/useBattleStore";
import { getEffectiveDrops } from "../lib/chances";
import { MODE_LABELS } from "../lib/battleTypes";
import { rarityColors } from "../lib/rarity";
import { formatMoney } from "../lib/format";
import { useCaseStore } from "../store/useCaseStore";
import { BattleReelStrip, RevealedDropCard } from "../components/BattleReelStrip";
import type { BattleStep } from "../lib/battleRng";
import type { Battle, BattleDrop, BattleMode, Participant } from "../lib/battleTypes";
import type { InventoryItem } from "../lib/types";

const REEL_DURATION_MS = 3200;
const PAUSE_BETWEEN_STEPS_MS = 900;
const COUNTDOWN_START = 3;
type BattlePhase = "idle" | "running" | "tiebreak" | "done";

// ─── Mode UI ──────────────────────────────────────────────────────────────────

const MODE_ICONS: Record<BattleMode, ElementType> = {
  standard: Swords, underdog: TrendingDown, shared: Users,
  terminal: SkipForward, crazy_terminal: Rewind,
};

const MODE_BADGE_COLORS: Record<BattleMode, string> = {
  standard:      "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
  underdog:      "border-amber-500/50 bg-amber-500/10 text-amber-300",
  shared:        "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
  terminal:      "border-purple-500/50 bg-purple-500/10 text-purple-300",
  crazy_terminal:"border-orange-500/50 bg-orange-500/10 text-orange-300",
};

function getLeaderRingClass(mode: BattleMode): string {
  // Terminal/CrazyTerminal rings are only shown at last step — same emerald class used for both
  switch (mode) {
    case "standard":      return "ring-2 ring-cyan-400 ring-leader-cyan";
    case "underdog":      return "ring-2 ring-amber-400 ring-leader-amber";
    case "terminal":
    case "crazy_terminal":return "ring-2 ring-emerald-400 ring-leader-emerald";
    default:              return "";
  }
}

function getWinnerRingClass(mode: BattleMode): string {
  switch (mode) {
    case "standard":      return "ring-2 ring-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.55)]";
    case "underdog":      return "ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.55)]";
    case "terminal":      return "ring-2 ring-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.55)]";
    case "crazy_terminal":return "ring-2 ring-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.55)]";
    default:              return "";
  }
}

function teamOf(idx: number): "A" | "B" { return idx < 2 ? "A" : "B"; }

// ─── Confetti ─────────────────────────────────────────────────────────────────

function ConfettiEffect() {
  const particles = useMemo(
    () => Array.from({ length: 55 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: ["#22d3ee","#f59e0b","#10b981","#a855f7","#f97316","#ec4899"][i % 6],
      size: 6 + Math.random() * 7,
      circle: i % 3 !== 0,
    })), []
  );
  return (
    <>
      <style>{`@keyframes cfFall{0%{transform:translateY(-10px) rotate(0);opacity:1}100%{transform:translateY(105vh) rotate(700deg);opacity:0}}`}</style>
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
        {particles.map((p) => (
          <div key={p.id} style={{
            position:"absolute", left:`${p.left}%`, top:0,
            width:p.size, height:p.size, backgroundColor:p.color,
            borderRadius:p.circle?"50%":"2px",
            animation:`cfFall ${p.duration}s ${p.delay}s ease-in forwards`,
          }} />
        ))}
      </div>
    </>
  );
}

// ─── Big centered countdown overlay ──────────────────────────────────────────

function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400 mb-6">Bitwa za…</p>
      <div
        key={value}
        className="countdown-pop text-[10rem] leading-none font-black text-cyan-300 tabular-nums"
        style={{ textShadow: "0 0 50px rgba(34,211,238,0.9), 0 0 100px rgba(34,211,238,0.45)" }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────────────

function TopBar({ battle }: { battle: Battle }) {
  const Icon = MODE_ICONS[battle.mode];
  const total = computeTotalCostCents(battle.cases);
  return (
    <div className="glass-strong rounded-xl border border-slate-700/30 px-4 py-3 flex items-center gap-4">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-black shrink-0 ${MODE_BADGE_COLORS[battle.mode]}`}>
        <Icon className="w-4 h-4" />
        {MODE_LABELS[battle.mode]}
        {battle.battleFormat === "teams" && <span className="text-[10px] opacity-60 ml-1">2v2</span>}
      </div>
      <div className="flex-1 overflow-x-auto">
        <div className="flex items-center gap-2 py-0.5" style={{ minWidth: "max-content" }}>
          {battle.cases.map((sc, i) => {
            const c = useCaseStore.getState().paidCases.find((x) => x.id === sc.caseId);
            return (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-700/40 bg-slate-900/60 text-[11px]">
                {c?.image && <img src={c.image} alt="" className="w-6 h-5 rounded object-cover" />}
                <span className="font-bold text-slate-300 whitespace-nowrap">{c?.name}</span>
                <span className="text-slate-600">×{sc.qty}</span>
                {sc.openMode !== "normal" && (
                  <span className={`font-bold text-[10px] ${sc.openMode === "boost" ? "text-amber-400" : "text-purple-400"}`}>{sc.openMode}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-slate-600">Koszt bitwy</p>
        <p className="text-sm font-black text-slate-300 font-mono">{formatMoney(total)}</p>
      </div>
    </div>
  );
}

// ─── Tiebreak banner ──────────────────────────────────────────────────────────

function TiebreakBanner({ names }: { names: string[] }) {
  return (
    <div className="glass-strong rounded-2xl border border-amber-400/50 bg-amber-400/5 p-5 text-center animate-pulse">
      <Swords className="w-8 h-8 text-amber-400 mx-auto mb-2" />
      <p className="text-xl font-black text-amber-300">Remis — losowanie zwycięzcy…</p>
      <p className="text-sm text-amber-400/70 mt-1">{names.join(" vs ")}</p>
    </div>
  );
}

// ─── Winner banner ────────────────────────────────────────────────────────────

function WinnerBanner({
  battle, result, onClaimShared,
}: {
  battle: Battle;
  result: { winnerId: string|null; teamWinnerId?: "A"|"B"|null; sharedPerHeadCents?: number; claimed: boolean };
  onClaimShared: () => void;
}) {
  const isShared = battle.mode === "shared";
  const isTeams = battle.battleFormat === "teams";
  const userId = battle.participants[0]?.id ?? "";

  let title = "Koniec bitwy";
  let subtitle = "";
  let borderCls = "border-slate-600/40";

  if (isShared) {
    title = "Shared — Równa wypłata";
    subtitle = `Każdy otrzymuje ${formatMoney(result.sharedPerHeadCents ?? 0)} gotówki`;
    borderCls = "border-emerald-500/40";
  } else if (isTeams && result.teamWinnerId) {
    title = `Team ${result.teamWinnerId} wygrywa!`;
    borderCls = result.teamWinnerId === "A" ? "border-cyan-500/50" : "border-purple-500/50";
  } else if (result.winnerId) {
    const w = battle.participants.find((p) => p.id === result.winnerId);
    title = `${w?.name ?? "Gracz"} wygrywa!`;
    subtitle = result.winnerId === userId ? "Gratulacje! Nagrody pojawią się za chwilę." : "Nie tym razem.";
    borderCls = result.winnerId === userId ? "border-amber-400/50" : "border-slate-600/40";
  }

  return (
    <div className={`glass-strong rounded-2xl border ${borderCls} p-5 text-center space-y-2`}>
      <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
      <h2 className="text-2xl font-black text-slate-100">{title}</h2>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      {isShared && !result.claimed && (
        <button type="button" onClick={onClaimShared} className="neon-button mt-2 px-8 py-3 text-base">
          Odbierz {formatMoney(result.sharedPerHeadCents ?? 0)}
        </button>
      )}
      {isShared && result.claimed && <p className="text-xs text-emerald-400 mt-1">Nagroda odebrana.</p>}
    </div>
  );
}

// ─── Waiting slot ─────────────────────────────────────────────────────────────

function WaitingSlot({
  participant, slotIndex, isHost, isTeams, onAddBot, onRemoveBot,
}: {
  participant?: Participant; slotIndex: number; isHost: boolean; isTeams: boolean;
  onAddBot: () => void; onRemoveBot: (id: string) => void;
}) {
  const team = isTeams ? teamOf(slotIndex) : null;
  const tBorder = team === "A" ? "border-cyan-500/40" : "border-purple-500/40";
  const tBg    = team === "A" ? "bg-cyan-500/5"     : "bg-purple-500/5";
  if (participant) {
    return (
      <div className={`glass-strong rounded-xl border p-4 flex items-center gap-3 ${isTeams ? `${tBorder} ${tBg}` : "border-cyan-500/20"}`}>
        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
          {participant.isBot ? <Bot className="w-5 h-5 text-slate-400" /> : <User className="w-5 h-5 text-cyan-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-200 truncate">{participant.name}</p>
          {team && <p className={`text-[10px] font-bold ${team==="A"?"text-cyan-400":"text-purple-400"}`}>Team {team}</p>}
        </div>
        {isHost && participant.isBot && (
          <button type="button" onClick={() => onRemoveBot(participant.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
  return (
    <button type="button" onClick={onAddBot} disabled={!isHost}
      className={`glass-strong rounded-xl border p-4 flex items-center gap-3 w-full transition-all ${isTeams?`${tBorder} ${tBg}`:"border-slate-700/30"} ${isHost?"hover:border-cyan-500/40 cursor-pointer":"opacity-40 cursor-not-allowed"}`}>
      <div className="w-9 h-9 rounded-full bg-slate-900/60 border border-dashed border-slate-600/50 flex items-center justify-center shrink-0">
        <Plus className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold text-slate-500">Wolne miejsce</p>
        {team && <p className={`text-[10px] font-bold ${team==="A"?"text-cyan-500/60":"text-purple-500/60"}`}>Team {team}</p>}
      </div>
      {isHost && <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded border border-slate-700/40">Dodaj bota</span>}
    </button>
  );
}

// ─── Participant Column ───────────────────────────────────────────────────────

interface ColProps {
  participant: Participant;
  slotIndex: number;
  battle: Battle;
  isTeams: boolean;
  isShared: boolean;
  isLeader: boolean;
  isWinner: boolean;
  isTeamWinner: boolean;
  isTiebreakHighlight: boolean;
  battlePhase: BattlePhase;
  revealedCount: number;
  animStep: number;
  spinning: boolean;
  stepList: BattleStep[];
  totalSteps: number;
}

function ParticipantColumn({
  participant, slotIndex, battle, isTeams, isShared,
  isLeader, isWinner, isTeamWinner, isTiebreakHighlight,
  battlePhase, revealedCount, animStep, spinning, stepList, totalSteps,
}: ColProps) {
  const result = battle.result!;
  const drops = result.dropsByParticipant[participant.id] ?? [];
  const revealedDrops = drops.slice(0, revealedCount);
  const currentTotal = revealedDrops.reduce((s, d) => s + d.valueCents, 0);
  const team = isTeams ? teamOf(slotIndex) : null;
  const mode = battle.mode;

  const safeStep = animStep >= 0 ? animStep : 0;
  const currentStep = stepList[safeStep];
  const currentDrop = drops[safeStep];
  const fillerDrops = currentStep ? getEffectiveDrops(currentStep.caseData, currentStep.sc.openMode) : [];
  const showReel = spinning && animStep >= 0 && animStep < drops.length && !!currentDrop && !!currentStep;
  const betweenSteps = !spinning && revealedCount > 0 && revealedCount < drops.length;

  // "Decyduje ostatnia skrzynka" hint for terminal modes while not yet at last step
  const showTerminalHint = (mode === "terminal" || mode === "crazy_terminal")
    && battlePhase === "running" && revealedCount < totalSteps;

  const isActualWinner = !isShared && (isWinner || isTeamWinner);
  const isLoser = battlePhase === "done" && !isShared && !isActualWinner;

  let ringClass = "";
  if (battlePhase === "running" && isLeader && !isShared) {
    ringClass = getLeaderRingClass(mode);
  } else if (battlePhase === "tiebreak" && isTiebreakHighlight) {
    ringClass = "ring-2 ring-yellow-300 shadow-[0_0_24px_rgba(253,224,71,0.6)]";
  } else if (battlePhase === "done" && isActualWinner) {
    ringClass = getWinnerRingClass(mode);
  }

  const borderCls = team === "A"
    ? "border-cyan-500/30"
    : team === "B"
      ? "border-purple-500/30"
      : "border-slate-700/30";

  return (
    <div className={`glass-strong relative rounded-2xl border flex flex-col gap-3 p-3 transition-all duration-500 ${borderCls} ${ringClass}`}>
      {/* Loser red-X overlay */}
      {isLoser && (
        <div className="absolute inset-0 rounded-2xl bg-red-950/35 z-10 pointer-events-none flex items-center justify-center">
          <XIcon className="w-20 h-20 text-red-500/45" strokeWidth={1.5} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          participant.isBot ? "bg-slate-800" : team === "B" ? "bg-purple-500/20" : "bg-cyan-500/20"
        }`}>
          {participant.isBot
            ? <Bot className="w-5 h-5 text-slate-400" />
            : <User className={`w-5 h-5 ${team==="B"?"text-purple-400":"text-cyan-400"}`} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-slate-200 truncate">{participant.name}</p>
          {team && <p className={`text-[10px] font-bold ${team==="A"?"text-cyan-400":"text-purple-400"}`}>Team {team}</p>}
        </div>
        {battlePhase === "done" && isActualWinner && <Crown className="w-5 h-5 text-amber-400 shrink-0" />}
      </div>

      {/* Running total */}
      <div className={`text-center py-2 rounded-xl border ${
        team === "A" ? "border-cyan-500/20 bg-cyan-500/5" :
        team === "B" ? "border-purple-500/20 bg-purple-500/5" :
        "border-slate-700/30 bg-slate-900/40"
      }`}>
        <p className={`text-xl font-black font-mono ${team==="A"?"text-cyan-300":team==="B"?"text-purple-300":"text-slate-200"}`}>
          {formatMoney(currentTotal)}
        </p>
        <p className="text-[10px] text-slate-500">{revealedCount}/{drops.length} skrzynek</p>
        {showTerminalHint && (
          <p className="text-[10px] text-purple-400/70 mt-0.5 font-bold">Decyduje ostatnia skrzynka</p>
        )}
      </div>

      {/* Vertical reel */}
      {showReel ? (
        <BattleReelStrip
          key={`${participant.id}-step-${animStep}`}
          fillerDrops={fillerDrops}
          winner={currentDrop}
          durationMs={REEL_DURATION_MS}
        />
      ) : betweenSteps ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-700/30 bg-slate-950/40" style={{ height: 60 }}>
          <p className="text-xs text-slate-600 animate-pulse">Następna skrzynka…</p>
        </div>
      ) : null}

      {/* Revealed items (3-col) */}
      {revealedDrops.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {[...revealedDrops].reverse().map((drop) => (
            <RevealedDropCard key={drop.instanceId} drop={drop} />
          ))}
        </div>
      )}
      {revealedDrops.length === 0 && (
        <p className="text-[11px] text-slate-700 text-center py-2">Brak dropów</p>
      )}
    </div>
  );
}

// ─── Loot Modal ───────────────────────────────────────────────────────────────

function LootModal({ pending, onKeep, onSell }: { pending: BattleDrop[]; onKeep: () => void; onSell: () => void; }) {
  const totalVal = pending.reduce((s, d) => s + d.valueCents, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl border border-amber-400/30 w-full max-w-lg shadow-2xl p-6 space-y-5">
        <div className="text-center">
          <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-2" />
          <h2 className="text-2xl font-black text-slate-100">Twoje nagrody!</h2>
          <p className="text-sm text-slate-400 mt-1">{pending.length} itemów · łączna wartość {formatMoney(totalVal)}</p>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {pending.map((d) => {
            const rc = rarityColors[d.rarity];
            return (
              <div key={d.instanceId} className={`flex items-center gap-3 rounded-lg border ${rc.border} bg-slate-900/70 px-3 py-2`}>
                {d.image && <img src={d.image} alt="" className="w-10 h-10 rounded-md object-cover mix-blend-screen shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${rc.text}`}>{d.name}</p>
                  <p className="text-[10px] text-slate-500">{d.chanceAtDrop.toFixed(2)}% szans</p>
                </div>
                <span className="text-sm font-black text-slate-300 font-mono shrink-0">{formatMoney(d.valueCents)}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onKeep}
            className="py-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-black text-sm hover:bg-cyan-500/20 transition-colors">
            Zachowaj ({pending.length})
          </button>
          <button type="button" onClick={onSell}
            className="py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-black text-sm hover:bg-emerald-500/20 transition-colors">
            Sprzedaj ({formatMoney(totalVal)})
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main BattleRoom ──────────────────────────────────────────────────────────

export function BattleRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { battles, addBot, removeBot, startBattle, completeBattle, markClaimed } = useBattleStore();
  const { addBalanceCents } = useGameStore();

  const battle = battles.find((b) => b.id === id);
  const result = battle?.result ?? null;

  // ── Phase & animation state ──────────────────────────────────────
  const [battlePhase, setBattlePhase] = useState<BattlePhase>("idle");
  const [animStep, setAnimStep] = useState(-1);
  const [revealedCount, setRevealedCount] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [tiebreakHighlightId, setTiebreakHighlightId] = useState<string | null>(null);
  const [showLootModal, setShowLootModal] = useState(false);
  const animStarted = useRef(false);
  const animCleanupRef = useRef<(() => void) | null>(null);

  // ── Countdown ────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // ── Derived ──────────────────────────────────────────────────────
  const isTeams = battle?.battleFormat === "teams";
  const isShared = battle?.mode === "shared";
  const userId = battle?.participants[0]?.id ?? "user";

  const paidCases = useCaseStore((s) => s.paidCases);

  const stepList = useMemo(
    () => (battle ? buildStepList(battle, paidCases) : []),
    [battle, paidCases]
  );
  const totalSteps = stepList.length;

  // Tiebreak detection
  const tiedParticipants = useMemo((): Participant[] => {
    if (!result?.winnerId || !battle || isShared || isTeams) return [];
    const pts = battle.participants;
    const wid = result.winnerId;
    const mode = battle.mode;
    if (mode === "standard" || mode === "underdog") {
      const wScore = result.totalValueByParticipant[wid];
      const tied = pts.filter((p) => result.totalValueByParticipant[p.id] === wScore);
      return tied.length > 1 ? tied : [];
    }
    if (mode === "terminal") {
      const wMax = Math.max(...(result.lastGroupDropsByParticipant[wid] ?? []).map((d) => d.valueCents), 0);
      const tied = pts.filter((p) => Math.max(...(result.lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents), 0) === wMax);
      return tied.length > 1 ? tied : [];
    }
    if (mode === "crazy_terminal") {
      const wMin = Math.min(...(result.lastGroupDropsByParticipant[wid] ?? []).map((d) => d.valueCents), Infinity);
      const tied = pts.filter((p) => Math.min(...(result.lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents), Infinity) === wMin);
      return tied.length > 1 ? tied : [];
    }
    return [];
  }, [result, battle, isShared, isTeams]);

  const hadTiebreak = tiedParticipants.length > 1;
  const tiedParticipantsRef = useRef(tiedParticipants);
  tiedParticipantsRef.current = tiedParticipants;

  // User won
  const userWon = useMemo(() => {
    if (!result || isShared) return false;
    if (result.winnerId) return result.winnerId === userId;
    if (result.teamWinnerId && isTeams) {
      const idx = battle?.participants.findIndex((p) => p.id === userId) ?? -1;
      return (idx < 2 ? "A" : "B") === result.teamWinnerId;
    }
    return false;
  }, [result, isShared, isTeams, userId, battle?.participants]);

  const userWonRef = useRef(userWon);
  userWonRef.current = userWon;
  const hadTiebreakRef = useRef(hadTiebreak);
  hadTiebreakRef.current = hadTiebreak;

  // ── Dynamic leader IDs ─────────────────────────────────────────────
  // Terminal/CrazyTerminal: ONLY show ring after the LAST step is revealed
  const currentLeaderIds = useMemo((): Set<string> => {
    if (!result || !battle || isShared || battlePhase !== "running" || revealedCount === 0) {
      return new Set();
    }
    const pts = battle.participants;
    const mode = battle.mode;

    // Terminal / Crazy Terminal — ring only after last step
    if (mode === "terminal" || mode === "crazy_terminal") {
      if (revealedCount < totalSteps) return new Set(); // no ring yet
      // Show based on the single last-step drop per participant
      const lastDropVal = Object.fromEntries(
        pts.map((p) => {
          const allDrops = result.dropsByParticipant[p.id] ?? [];
          const last = allDrops[allDrops.length - 1];
          return [p.id, last?.valueCents ?? 0];
        })
      );
      const vals = Object.values(lastDropVal);
      if (mode === "terminal") {
        const max = Math.max(...vals);
        return new Set(pts.filter((p) => lastDropVal[p.id] === max).map((p) => p.id));
      } else {
        const min = Math.min(...vals);
        return new Set(pts.filter((p) => lastDropVal[p.id] === min).map((p) => p.id));
      }
    }

    // Standard / Underdog — running total
    const scores = Object.fromEntries(
      pts.map((p) => [p.id, (result.dropsByParticipant[p.id] ?? []).slice(0, revealedCount).reduce((s, d) => s + d.valueCents, 0)])
    );
    const vals = Object.values(scores);
    if (mode === "standard") {
      const max = Math.max(...vals);
      if (max === 0) return new Set();
      return new Set(pts.filter((p) => scores[p.id] === max).map((p) => p.id));
    }
    if (mode === "underdog") {
      const min = Math.min(...vals);
      return new Set(pts.filter((p) => scores[p.id] === min).map((p) => p.id));
    }
    return new Set();
  }, [result, battle, isShared, battlePhase, revealedCount, totalSteps]);

  const winnerIds = result?.winnerId ? new Set([result.winnerId]) : new Set<string>();
  const winnerTeam = result?.teamWinnerId ?? null;

  // ── Auto-start countdown when lobby is full ──────────────────────
  const participantCount = battle?.participants.length ?? 0;
  const battleMaxPlayers = battle?.maxPlayers ?? 0;

  useEffect(() => {
    if (battle?.status !== "waiting") return;
    if (participantCount < battleMaxPlayers) return;
    if (countdownRef.current !== null) return; // already running

    let c = COUNTDOWN_START;
    setCountdown(c);
    countdownRef.current = window.setInterval(() => {
      c--;
      if (c <= 0) {
        window.clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        startBattle(battle!.id);
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, [participantCount]); // eslint-disable-line

  // ── Mount: if already completed, skip animation ──────────────────
  useEffect(() => {
    if (battle?.status === "completed") {
      animStarted.current = true;
      setBattlePhase("done");
      const steps = buildStepList(battle, useCaseStore.getState().paidCases).length;
      setRevealedCount(steps);
      if (steps > 0) setAnimStep(steps - 1);
      if (!battle.result?.claimed && userWonRef.current) setShowLootModal(true);
    }
  }, []); // eslint-disable-line

  // ── Animation runner ─────────────────────────────────────────────
  useEffect(() => {
    if (battle?.status !== "in_progress" || animStarted.current) return;
    animStarted.current = true;
    setBattlePhase("running");

    const battleId = battle.id;
    const steps = totalSteps;
    const timers: number[] = [];
    let cancelled = false;

    const cleanup = () => { cancelled = true; timers.forEach((t) => window.clearTimeout(t)); timers.length = 0; };
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
            completeBattle(battleId);
            if (hadTiebreakRef.current) {
              setBattlePhase("tiebreak");
            } else {
              setBattlePhase("done");
              if (userWonRef.current) {
                timers.push(window.setTimeout(() => setShowLootModal(true), 3000));
              }
            }
          }
        }, PAUSE_BETWEEN_STEPS_MS);
        timers.push(t2);
      }, REEL_DURATION_MS + 150);
      timers.push(t1);
    };

    runStep(0);
    return cleanup;
  }, [battle?.status]); // eslint-disable-line

  // ── Tiebreak animation ───────────────────────────────────────────
  useEffect(() => {
    if (battlePhase !== "tiebreak") return;
    const tied = tiedParticipantsRef.current;
    if (tied.length < 2) { setBattlePhase("done"); return; }

    const winnerId = result?.winnerId ?? null;
    const timers: number[] = [];
    const CYCLE_MS = 160;
    const TOTAL_CYCLES = 11;
    let count = 0;

    const cycle = () => {
      count++;
      if (count < TOTAL_CYCLES) {
        setTiebreakHighlightId(tied[count % tied.length].id);
        timers.push(window.setTimeout(cycle, CYCLE_MS));
      } else {
        setTiebreakHighlightId(winnerId);
        timers.push(window.setTimeout(() => {
          setBattlePhase("done");
          if (userWonRef.current) timers.push(window.setTimeout(() => setShowLootModal(true), 3000));
        }, 700));
      }
    };

    setTiebreakHighlightId(tied[0].id);
    timers.push(window.setTimeout(cycle, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [battlePhase]); // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => () => {
    animCleanupRef.current?.();
    if (countdownRef.current) window.clearInterval(countdownRef.current);
  }, []);

  // ── Claim handlers ───────────────────────────────────────────────
  const handleClaimShared = () => {
    if (!battle?.result || battle.result.claimed) { navigate("/bitwy"); return; }
    const perHead = battle.result.sharedPerHeadCents ?? 0;
    if (perHead > 0) addBalanceCents(perHead);
    markClaimed(battle.id);
    navigate("/bitwy");
  };

  const handleClaimItems = (action: "keep" | "sell") => {
    if (!battle?.result || battle.result.claimed) { setShowLootModal(false); return; }
    const pending = computePendingRewards(battle);
    if (action === "sell") {
      addBalanceCents(pending.reduce((s, d) => s + d.valueCents, 0));
    } else {
      const newItems: InventoryItem[] = pending.map((d) => ({
        instanceId: d.instanceId, dropId: d.dropId, name: d.name,
        rarity: d.rarity, image: d.image, valueCents: d.valueCents,
        acquiredAt: Date.now(), locked: false,
      }));
      useGameStore.setState((s) => ({ inventory: [...s.inventory, ...newItems] }));
    }
    markClaimed(battle.id);
    setShowLootModal(false);
    navigate("/bitwy");
  };

  // ── Not found ────────────────────────────────────────────────────
  if (!battle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-slate-400">Nie znaleziono bitwy.</p>
        <Link to="/bitwy" className="text-cyan-400 mt-4 inline-block">← Wróć</Link>
      </div>
    );
  }

  // ── WAITING ROOM ─────────────────────────────────────────────────
  if (battle.status === "waiting") {
    const full = battle.participants.length === battle.maxPlayers;
    const slots = Array.from({ length: battle.maxPlayers }, (_, i) => battle.participants[i]);

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Big countdown overlay — covers everything while counting */}
        {countdown !== null && <CountdownOverlay value={countdown} />}

        {/* Header — hide back while counting */}
        <div className="flex items-center gap-3">
          {countdown === null ? (
            <Link to="/bitwy" className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <div className="w-9" />
          )}
          <Swords className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-black text-slate-100">Poczekalnia</h1>
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${MODE_BADGE_COLORS[battle.mode]}`}>
            {MODE_LABELS[battle.mode]}
          </span>
          {isTeams && <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-purple-400/30 bg-purple-400/5 text-purple-300">2v2</span>}
        </div>

        {isTeams && (
          <div className="grid grid-cols-2 gap-4">
            {(["A","B"] as const).map((t) => (
              <div key={t} className="text-center">
                <span className={`text-xs font-black uppercase tracking-widest border px-3 py-1 rounded-full ${t==="A"?"text-cyan-400 border-cyan-500/30 bg-cyan-500/5":"text-purple-400 border-purple-500/30 bg-purple-500/5"}`}>
                  {t==="A"?"⚔ Team A":"🛡 Team B"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={`grid gap-3 ${isTeams?"grid-cols-2":battle.maxPlayers===2?"grid-cols-2":battle.maxPlayers===3?"grid-cols-3":"grid-cols-2 sm:grid-cols-4"}`}>
          {slots.map((p, i) => (
            <WaitingSlot key={i} participant={p} slotIndex={i} isHost isTeams={isTeams}
              onAddBot={() => addBot(battle.id)} onRemoveBot={(pid) => removeBot(battle.id, pid)} />
          ))}
        </div>

        <div className="glass-strong rounded-xl border border-slate-700/30 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">Skrzynki</p>
          <div className="flex flex-wrap gap-2">
            {battle.cases.map((sc, i) => {
              const c = useCaseStore.getState().paidCases.find((x) => x.id === sc.caseId);
              return (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/40 bg-slate-900/50">
                  {c?.image && <img src={c.image} alt="" className="w-6 h-5 rounded object-cover" />}
                  <span className="text-xs font-bold text-slate-300">{c?.name}</span>
                  <span className="text-[10px] text-slate-500">×{sc.qty} · {sc.openMode}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status line — no manual start button, auto-start handles it */}
        <div className="text-center">
          {full ? (
            <p className="text-sm text-emerald-400 font-bold animate-pulse">Wszyscy gotowi — startowanie…</p>
          ) : (
            <p className="text-sm text-slate-500">{battle.participants.length}/{battle.maxPlayers} graczy · dodaj bota, aby wypełnić miejsca</p>
          )}
        </div>
      </div>
    );
  }

  // ── IN PROGRESS / COMPLETED ──────────────────────────────────────
  if (!result) {
    return <div className="container mx-auto px-4 py-16 text-center"><p className="text-slate-400 animate-pulse">Ładowanie wyników…</p></div>;
  }

  const pendingRewards = computePendingRewards(battle);
  const colCount = battle.participants.length;
  const gridCls = colCount <= 2 ? "grid-cols-2" : colCount === 3 ? "grid-cols-3" : "grid-cols-2 xl:grid-cols-4";

  const teamTotals = isTeams ? [0, 1].map((teamIdx) =>
    [0, 1].reduce((s, offset) => {
      const p = battle.participants[teamIdx * 2 + offset];
      if (!p) return s;
      return s + (result.dropsByParticipant[p.id] ?? []).slice(0, revealedCount).reduce((a, d) => a + d.valueCents, 0);
    }, 0)
  ) : [0, 0];

  // Block back button during active battle
  const backLocked = battlePhase === "running" || battlePhase === "tiebreak";

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl space-y-5">
      {/* Back + top bar */}
      <div className="flex items-center gap-3">
        {backLocked
          ? <div className="w-9 shrink-0" />
          : (
            <Link to="/bitwy" className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )
        }
        <div className="flex-1 min-w-0"><TopBar battle={battle} /></div>
        <span className="text-xs text-slate-500 font-mono shrink-0">{Math.min(revealedCount, totalSteps)}/{totalSteps}</span>
      </div>

      {/* Tiebreak banner */}
      {battlePhase === "tiebreak" && <TiebreakBanner names={tiedParticipants.map((p) => p.name)} />}

      {/* Winner banner */}
      {battlePhase === "done" && <WinnerBanner battle={battle} result={result} onClaimShared={handleClaimShared} />}

      {/* Teams score bar */}
      {isTeams && (
        <div className="glass-strong rounded-xl border border-slate-700/30 p-4 flex items-center gap-4">
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-0.5">⚔ Team A</p>
            <p className="text-2xl font-black font-mono text-cyan-300">{formatMoney(teamTotals[0])}</p>
          </div>
          <Shield className="w-6 h-6 text-slate-600" />
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-0.5">🛡 Team B</p>
            <p className="text-2xl font-black font-mono text-purple-300">{formatMoney(teamTotals[1])}</p>
          </div>
        </div>
      )}

      {/* Participant columns */}
      <div className={`grid gap-4 ${gridCls}`}>
        {battle.participants.map((p, idx) => (
          <ParticipantColumn
            key={p.id}
            participant={p}
            slotIndex={idx}
            battle={battle}
            isTeams={isTeams}
            isShared={isShared}
            isLeader={currentLeaderIds.has(p.id)}
            isWinner={winnerIds.has(p.id)}
            isTeamWinner={winnerTeam != null ? teamOf(idx) === winnerTeam : false}
            isTiebreakHighlight={tiebreakHighlightId === p.id}
            battlePhase={battlePhase}
            revealedCount={revealedCount}
            animStep={animStep}
            spinning={spinning}
            stepList={stepList}
            totalSteps={totalSteps}
          />
        ))}
      </div>

      {/* Confetti for winner */}
      {battlePhase === "done" && userWon && !isShared && <ConfettiEffect />}

      {/* Loot modal (delayed) */}
      {showLootModal && !isShared && pendingRewards.length > 0 && (
        <LootModal pending={pendingRewards} onKeep={() => handleClaimItems("keep")} onSell={() => handleClaimItems("sell")} />
      )}
    </div>
  );
}
