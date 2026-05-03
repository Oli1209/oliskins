import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Battle,
  BattleFormat,
  BattleMode,
  BattleResult,
  Participant,
  RewardStatus,
  SelectedCase,
} from "../lib/battleTypes";
import { BOT_NAMES } from "../lib/battleTypes";
import { precomputeBattleResult } from "../lib/battleRng";
import { mockCases } from "../data/mockCases";
import { getUnitCostCents } from "../lib/chances";

export interface BattleSetup {
  mode: BattleMode;
  maxPlayers: number;
  battleFormat: BattleFormat;
  cases: SelectedCase[];
}

export function computeTotalCostCents(cases: SelectedCase[]): number {
  return cases.reduce((sum, sc) => {
    const caseData = mockCases.find((c) => c.id === sc.caseId);
    if (!caseData) return sum;
    return sum + getUnitCostCents(caseData, sc.openMode) * sc.qty;
  }, 0);
}

interface BattleStoreState {
  battles: Battle[];
  createBattle: (setup: BattleSetup, userName?: string) => Battle;
  addBot: (battleId: string) => void;
  removeBot: (battleId: string, participantId: string) => void;
  deleteBattle: (battleId: string) => void;
  startBattle: (battleId: string) => void;
  completeBattle: (battleId: string) => void;
  /** Mark a battle's reward as claimed. Does NOT delete the battle. */
  claimReward: (battleId: string, status: Exclude<RewardStatus, "unclaimed">) => void;
}

export const useBattleStore = create<BattleStoreState>()(
  persist(
    (set, get) => ({
      battles: [],

      createBattle: (setup, userName = "Ty") => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const user: Participant = { id: "user", name: userName, isBot: false };
        const battle: Battle = {
          id,
          createdAt: now,
          status: "waiting",
          mode: setup.mode,
          battleFormat: setup.battleFormat,
          maxPlayers: setup.maxPlayers,
          cases: setup.cases,
          participants: [user],
        };
        set((s) => ({ battles: [...s.battles, battle] }));
        return battle;
      },

      addBot: (battleId) => {
        set((s) => ({
          battles: s.battles.map((b) => {
            if (b.id !== battleId || b.status !== "waiting") return b;
            if (b.participants.length >= b.maxPlayers) return b;
            const existingBotCount = b.participants.filter((p) => p.isBot).length;
            const usedNames = b.participants.filter((p) => p.isBot).map((p) => p.name);
            const name = BOT_NAMES.find((n) => !usedNames.includes(n)) ?? `Bot ${existingBotCount + 1}`;
            const bot: Participant = {
              id: `bot-${Date.now()}-${existingBotCount}`,
              name,
              isBot: true,
            };
            return { ...b, participants: [...b.participants, bot] };
          }),
        }));
      },

      removeBot: (battleId, participantId) => {
        set((s) => ({
          battles: s.battles.map((b) => {
            if (b.id !== battleId || b.status !== "waiting") return b;
            return {
              ...b,
              participants: b.participants.filter(
                (p) => !(p.id === participantId && p.isBot)
              ),
            };
          }),
        }));
      },

      deleteBattle: (battleId) => {
        set((s) => ({
          battles: s.battles.filter((b) => b.id !== battleId),
        }));
      },

      startBattle: (battleId) => {
        set((s) => ({
          battles: s.battles.map((b) => {
            if (b.id !== battleId) return b;
            const result = precomputeBattleResult(b, mockCases);
            return { ...b, status: "in_progress", result };
          }),
        }));
      },

      completeBattle: (battleId) => {
        set((s) => ({
          battles: s.battles.map((b) => {
            if (b.id !== battleId) return b;
            return { ...b, status: "completed" };
          }),
        }));
      },

      claimReward: (battleId, status) => {
        set((s) => ({
          battles: s.battles.map((b) => {
            if (b.id !== battleId || !b.result) return b;
            // Idempotency guard: only allow claiming if currently unclaimed
            if (b.result.rewardStatus !== "unclaimed") return b;
            return {
              ...b,
              result: { ...b.result, rewardStatus: status } as BattleResult,
            };
          }),
        }));
      },
    }),
    {
      name: "oliskins_battles_v2",
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as { battles?: Battle[] };
        if (version < 2) {
          // Migrate old `claimed: boolean` to new `rewardStatus` + `rewardItems`
          state.battles = (state.battles ?? []).map((b) => {
            if (!b.result) return b;
            const oldResult = b.result as BattleResult & { claimed?: boolean };
            const wasClaimed = oldResult.claimed === true;
            return {
              ...b,
              result: {
                ...oldResult,
                rewardItems: oldResult.rewardItems ?? [],
                rewardStatus: oldResult.rewardStatus ?? (wasClaimed ? "kept" : "unclaimed"),
              } as BattleResult,
            };
          });
        }
        return state as { battles: Battle[] };
      },
    }
  )
);
