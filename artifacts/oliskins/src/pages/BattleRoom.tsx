import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bot, User, Crown, Loader2, Swords, Trophy } from "lucide-react";
import { useGameStore } from "../store/useGameStore";
import { useBattleStore } from "../store/useBattleStore";
import { computePendingRewards } from "../lib/battleRng";
import { MODE_LABELS } from "../lib/battleTypes";
import { rarityColors } from "../lib/rarity";
import { formatMoney } from "../lib/format";
import { mockCases } from "../data/mockCases";
import type { Battle, BattleDrop, Participant } from "../lib/battleTypes";
import type { InventoryItem } from "../lib/types";

const STEP_DURATION_MS = 2400;
const COUNTDOWN_START = 3;

// ─── Drop Card ────────────────────────────────────────────────────────────────

function DropCard({
  drop,
  revealed,
  scanning,
}: {
  drop: BattleDrop;
  revealed: boolean;
  scanning: boolean;
}) {
  const rc = rarityColors[drop.rarity];

  if (scanning) {
    return (
      <div className="rounded-lg border border-cyan-500/30 bg-slate-900/80 p-2 flex items-center gap-2 animate-pulse">
        <div className="w-8 h-8 rounded bg-cyan-900/40" />
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-cyan-800/30 rounded w-3/4" />
          <div className="h-1.5 bg-slate-800/60 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!revealed) {
    return (
      <div className="rounded-lg border border-slate-700/20 bg-slate-950/30 p-2 opacity-25 flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-slate-800/40" />
        <div className="flex-1 space-y-1">
          <div className="h-2 bg-slate-800/40 rounded w-2/3" />
          <div className="h-1.5 bg-slate-800/30 rounded w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border ${rc.border} ${rc.bg} p-2 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-300`}
    >
      <img src={drop.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-bold truncate ${rc.text}`}>{drop.name}</p>
        <p className="text-[9px] text-slate-500 font-mono">{formatMoney(drop.valueCents)}</p>
      </div>
    </div>
  );
}

// ─── Participant Column ───────────────────────────────────────────────────────

function ParticipantColumn({
  participant,
  drops,
  revealedCount,
  totalSteps,
  isWinner,
  isShared,
  isUser,
}: {
  participant: Participant;
  drops: BattleDrop[];
  revealedCount: number;
  totalSteps: number;
  isWinner: boolean;
  isShared: boolean;
  isUser: boolean;
}) {
  const allDone = revealedCount >= totalSteps;
  const revealedDrops = drops.slice(0, Math.min(revealedCount, drops.length));
  const runningTotal = revealedDrops.reduce((s, d) => s + d.valueCents, 0);
  const highlightWinner = allDone && isWinner && !isShared;
  const dimLoser = allDone && !isWinner && !isShared;

  return (
    <div
      className={`flex flex-col rounded-2xl border transition-all duration-500 overflow-hidden ${
        highlightWinner
          ? "border-amber-400/60 bg-amber-400/5 shadow-[0_0_30px_rgba(251,191,36,0.15)]"
          : dimLoser
          ? "border-slate-600/20 bg-slate-900/15 opacity-55"
          : "border-cyan-500/20 bg-slate-900/30"
      }`}
    >
      {/* Header */}
      <div className={`px-3 py-2.5 flex items-center gap-2 border-b ${
        highlightWinner ? "border-amber-400/30" : "border-slate-700/30"
      }`}>
        <span className={`p-1 rounded-full ${isUser ? "bg-cyan-500/15 text-cyan-400" : "bg-slate-700/40 text-slate-400"}`}>
          {participant.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
        </span>
        <span className={`text-xs font-black truncate flex-1 ${isUser ? "text-cyan-300" : "text-slate-300"}`}>
          {participant.name}
        </span>
        {highlightWinner && <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
      </div>

      {/* Running total */}
      <div className="px-3 py-2 border-b border-slate-700/20">
        <p className={`text-sm font-black font-mono tabular-nums ${
          highlightWinner ? "text-amber-300" : "text-slate-200"
        }`}>
          {formatMoney(runningTotal)}
        </p>
      </div>

      {/* Drops */}
      <div className="flex-1 p-2 space-y-1.5 min-h-[100px]">
        {drops.map((drop, i) => (
          <DropCard
            key={drop.instanceId}
            drop={drop}
            revealed={i < revealedCount}
            scanning={i === revealedCount && revealedCount < totalSteps}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Result Modal ─────────────────────────────────────────────────────────────

function ResultModal({
  battle,
  onClaim,
}: {
  battle: Battle;
  onClaim: (action: "keep" | "sell") => void;
}) {
  const result = battle.result!;
  const userId = battle.participants[0]?.id ?? "user";
  const isShared = battle.mode === "shared";
  const userWon = !isShared && result.winnerId === userId;
  const pendingRewards = computePendingRewards(battle);
  const pendingValue = pendingRewards.reduce((s, d) => s + d.valueCents, 0);
  const hasPending = pendingRewards.length > 0;
  const winner = battle.participants.find((p) => p.id === result.winnerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl border border-cyan-500/25 w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
        {/* Title */}
        <div className="p-5 border-b border-slate-700/40 text-center">
          {isShared ? (
            <>
              <Trophy className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
              <h2 className="text-xl font-black text-slate-100">Każdy zachowuje swoje dropy</h2>
            </>
          ) : userWon ? (
            <>
              <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h2 className="text-xl font-black text-amber-300">Wygrałeś!</h2>
              <p className="text-sm text-slate-400 mt-1">Zdobywasz wszystkie dropy bitwy</p>
            </>
          ) : (
            <>
              <Swords className="w-10 h-10 text-red-400 mx-auto mb-2" />
              <h2 className="text-xl font-black text-red-300">Przegrałeś</h2>
              {winner && (
                <p className="text-sm text-slate-400 mt-1">
                  Wygrał: <span className="font-bold text-slate-200">{winner.name}</span>
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Scores */}
          <div className="space-y-2">
            {battle.participants.map((p) => {
              const total = result.totalValueByParticipant[p.id] ?? 0;
              const isWinner = result.winnerId === p.id;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${
                    isWinner && !isShared
                      ? "border-amber-400/40 bg-amber-400/5"
                      : "border-slate-700/30 bg-slate-900/30"
                  }`}
                >
                  <span className="p-1 rounded-full bg-slate-800/50">
                    {p.isBot ? <Bot className="w-3 h-3 text-slate-400" /> : <User className="w-3 h-3 text-cyan-400" />}
                  </span>
                  <span className="text-sm font-bold text-slate-300 flex-1">{p.name}</span>
                  {isWinner && !isShared && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  <span className={`text-sm font-black font-mono ${
                    isWinner && !isShared ? "text-amber-300" : "text-slate-400"
                  }`}>
                    {formatMoney(total)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pending rewards */}
          {hasPending && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {isShared ? "Twoje dropy" : "Zdobyte dropy"}{" "}
                <span className="text-cyan-300">{formatMoney(pendingValue)}</span>
              </p>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {pendingRewards.map((drop) => {
                  const rc = rarityColors[drop.rarity];
                  return (
                    <div
                      key={drop.instanceId}
                      className={`flex items-center gap-2 rounded-lg border ${rc.border} ${rc.bg} px-3 py-1.5`}
                    >
                      <img src={drop.image} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                      <span className={`text-xs font-bold flex-1 truncate ${rc.text}`}>{drop.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatMoney(drop.valueCents)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isShared && !userWon && (
            <p className="text-sm text-red-300/70 text-center py-4">Przegrałeś — brak nagrody.</p>
          )}
        </div>

        {/* Actions */}
        {hasPending ? (
          <div className="p-5 border-t border-slate-700/40 flex gap-3">
            <button
              type="button"
              onClick={() => onClaim("keep")}
              className="flex-1 h-11 rounded-xl border-2 border-emerald-400/60 bg-emerald-500/15 text-emerald-200 font-black text-sm hover:bg-emerald-400/25 transition-colors"
            >
              Zachowaj wszystko
            </button>
            <button
              type="button"
              onClick={() => onClaim("sell")}
              className="flex-1 h-11 rounded-xl border-2 border-amber-400/50 bg-amber-500/10 text-amber-200 font-black text-sm hover:bg-amber-400/20 transition-colors"
            >
              Sprzedaj wszystko
            </button>
          </div>
        ) : (
          <div className="p-5 border-t border-slate-700/40">
            <button
              type="button"
              onClick={() => onClaim("keep")}
              className="w-full h-11 rounded-xl border border-cyan-500/30 bg-slate-900/60 text-cyan-200 font-bold text-sm hover:border-cyan-400/60 transition-colors"
            >
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main BattleRoom ──────────────────────────────────────────────────────────

export function BattleRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addBalanceCents = useGameStore((s) => s.addBalanceCents);
  const { battles, addBot, deleteBattle, startBattle, completeBattle, markClaimed } =
    useBattleStore();

  const battle = battles.find((b) => b.id === id);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animStarted = useRef(false);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, []);

  const beginCountdown = () => {
    if (!battle) return;
    setCountdown(COUNTDOWN_START);
    let count = COUNTDOWN_START;
    countdownRef.current = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        setCountdown(null);
        startBattle(battle.id);
      }
    }, 1000);
  };

  // Start animation when battle transitions to in_progress
  useEffect(() => {
    if (!battle || battle.status !== "in_progress") return;
    if (animStarted.current) return;
    animStarted.current = true;

    const totalSteps = battle.cases.reduce((s, c) => s + c.qty, 0);
    let step = 0;

    const advance = () => {
      step++;
      setRevealedCount(step);
      if (step < totalSteps) {
        animRef.current = setTimeout(advance, STEP_DURATION_MS);
      } else {
        animRef.current = setTimeout(() => {
          completeBattle(battle.id);
          setShowResult(true);
        }, 600);
      }
    };

    animRef.current = setTimeout(advance, STEP_DURATION_MS);

    return () => {
      if (animRef.current) clearTimeout(animRef.current);
    };
  }, [battle?.status]);

  // If already completed (revisit), show result immediately
  useEffect(() => {
    if (battle?.status === "completed") {
      const totalSteps = battle.cases.reduce((s, c) => s + c.qty, 0);
      setRevealedCount(totalSteps);
      if (!battle.result?.claimed) {
        setShowResult(true);
      }
    }
  }, []);

  const handleClaim = (action: "keep" | "sell") => {
    if (!battle?.result) {
      setShowResult(false);
      return;
    }

    const pending = computePendingRewards(battle);

    if (pending.length > 0) {
      if (action === "sell") {
        const total = pending.reduce((s, d) => s + d.valueCents, 0);
        addBalanceCents(total);
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
        useGameStore.setState((s) => ({
          inventory: [...s.inventory, ...newItems],
        }));
      }
    }

    markClaimed(battle.id);
    setShowResult(false);
    navigate("/bitwy");
  };

  // ── Not found ──
  if (!battle) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <p className="text-slate-400 text-lg mb-4">Bitwa nie istnieje.</p>
        <Link to="/bitwy" className="text-cyan-300 hover:underline">
          ← Wróć do bitw
        </Link>
      </div>
    );
  }

  const totalSteps = battle.cases.reduce((s, c) => s + c.qty, 0);
  const userId = battle.participants[0]?.id ?? "user";

  // ── Waiting lobby ──
  if (battle.status === "waiting" || countdown !== null) {
    const slotsFull = battle.participants.length >= battle.maxPlayers;
    const slotsEmpty = battle.maxPlayers - battle.participants.length;

    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/bitwy"
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-black text-slate-100">Poczekalnia</h1>
        </div>

        <div className="glass-strong rounded-2xl border border-cyan-500/25 p-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full border border-purple-400/40 bg-purple-400/5 text-purple-300">
              {MODE_LABELS[battle.mode]}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full border border-slate-700/40 bg-slate-900/50 text-slate-400">
              {battle.participants.length}/{battle.maxPlayers} graczy
            </span>
          </div>

          {/* Player slots */}
          <div className={`grid gap-3 ${
            battle.maxPlayers === 4 ? "grid-cols-2 sm:grid-cols-4" :
            battle.maxPlayers === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}>
            {Array.from({ length: battle.maxPlayers }).map((_, i) => {
              const p = battle.participants[i];
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 flex flex-col items-center gap-2 text-center min-h-[100px] justify-center ${
                    p
                      ? p.isBot
                        ? "border-slate-600/40 bg-slate-800/30"
                        : "border-cyan-500/30 bg-cyan-500/5"
                      : "border-dashed border-slate-600/30 bg-slate-900/20"
                  }`}
                >
                  {p ? (
                    <>
                      <span className={`p-2 rounded-full ${p.isBot ? "bg-slate-700/60 text-slate-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                        {p.isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </span>
                      <span className="text-sm font-bold text-slate-200">{p.name}</span>
                      <span className={`text-[10px] font-bold ${p.isBot ? "text-slate-500" : "text-cyan-400"}`}>
                        {p.isBot ? "Bot" : "Ty"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="p-2 rounded-full bg-slate-800/40 text-slate-600">
                        <User className="w-5 h-5" />
                      </span>
                      <span className="text-sm text-slate-600">Oczekiwanie…</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Countdown */}
          {countdown !== null && (
            <div className="text-center py-6">
              <p className="text-7xl font-black text-cyan-300 font-mono animate-in zoom-in duration-200">
                {countdown}
              </p>
              <p className="text-slate-500 text-sm mt-2 uppercase tracking-widest">Bitwa zaczyna się…</p>
            </div>
          )}

          {/* Actions */}
          {countdown === null && (
            <div className="flex gap-3 flex-wrap">
              {slotsEmpty > 0 && (
                <button
                  type="button"
                  onClick={() => addBot(battle.id)}
                  className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-slate-600/40 bg-slate-800/30 text-slate-300 font-bold text-sm hover:border-slate-500/60 hover:bg-slate-700/30 transition-colors"
                >
                  <Bot className="w-4 h-4" />
                  Dodaj bota
                </button>
              )}
              <button
                type="button"
                onClick={() => { deleteBattle(battle.id); navigate("/bitwy"); }}
                className="h-11 px-4 rounded-xl border border-red-400/20 bg-red-400/5 text-red-400 font-bold text-sm hover:bg-red-400/10 transition-colors"
              >
                Usuń bitwę
              </button>
              {slotsFull && (
                <button
                  type="button"
                  onClick={beginCountdown}
                  className="neon-button h-11 px-6 text-sm flex-1"
                >
                  Rozpocznij bitwę →
                </button>
              )}
            </div>
          )}

          {/* Cases info */}
          <div className="border-t border-slate-700/30 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Skrzynki</p>
            <div className="flex flex-wrap gap-2">
              {battle.cases.map((sc, i) => {
                const c = mockCases.find((x) => x.id === sc.caseId);
                return (
                  <span
                    key={i}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-700/40 bg-slate-900/50 text-slate-300"
                  >
                    {c?.name ?? sc.caseId} ×{sc.qty} [{sc.openMode}]
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Column grid (in_progress or completed) ──
  const colClass =
    battle.participants.length === 4
      ? "grid-cols-2 lg:grid-cols-4"
      : battle.participants.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        {battle.status === "completed" && (
          <Link to="/bitwy" className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <Swords className="w-6 h-6 text-cyan-400" />
        <h1 className="text-2xl font-black text-slate-100">
          {battle.status === "completed" ? "Wyniki" : "Bitwa"}
        </h1>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-purple-400/40 bg-purple-400/5 text-purple-300 ml-1">
          {MODE_LABELS[battle.mode]}
        </span>
        {battle.status === "in_progress" && (
          <span className="ml-auto text-sm text-slate-400 font-mono">
            {Math.min(revealedCount, totalSteps)}/{totalSteps}
          </span>
        )}
      </div>

      {battle.result ? (
        <div className={`grid gap-4 ${colClass}`}>
          {battle.participants.map((p) => {
            const drops = battle.result!.dropsByParticipant[p.id] ?? [];
            return (
              <ParticipantColumn
                key={p.id}
                participant={p}
                drops={drops}
                revealedCount={battle.status === "completed" ? totalSteps : revealedCount}
                totalSteps={totalSteps}
                isWinner={battle.result!.winnerId === p.id}
                isShared={battle.mode === "shared"}
                isUser={p.id === userId}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Przygotowanie bitwy…</span>
        </div>
      )}

      {showResult && battle.result && (
        <ResultModal battle={battle} onClaim={handleClaim} />
      )}
    </div>
  );
}
