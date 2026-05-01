import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Battle,
  BattleMode,
  Participant,
  SelectedCase,
} from "../lib/battleTypes";
import { BOT_NAMES } from "../lib/battleTypes";
import { precomputeBattleResult } from "../lib/battleRng";
import { mockCases } from "../data/mockCases";
import { getUnitCostCents } from "../lib/chances";

export interface BattleSetup {
  mode: BattleMode;
  maxPlayers: number;
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
  deleteBattle: (battleId: string) => void;
  startBattle: (battleId: string) => void;
  completeBattle: (battleId: string) => void;
  markClaimed: (battleId: string) => void;
}

export const useBattleStore = create<BattleStoreState>()(
  persist(
    (set, get) => ({
      battles: [],

      createBattle: (setup, userName = "Ty") => {
        const id = crypto.randomUUID();
        const now = Date.now();
        const user: Participant = {
          id: "user",
          name: userName,
          isBot: false,
        };
        const battle: Battle = {
          id,
          createdAt: now,
          status: "waiting",
          mode: setup.mode,
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

            const existingBotCount = b.participants.filter(
              (p) => p.isBot
            ).length;
            const name = BOT_NAMES[existingBotCount] ?? `Bot ${existingBotCount + 1}`;
            const bot: Participant = {
              id: `bot-${Date.now()}-${existingBotCount}`,
              name,
              isBot: true,
            };
            return { ...b, participants: [...b.participants, bot] };
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

      markClaimed: (battleId) => {
        set((s) => ({
          battles: s.battles.map((b) => {
            if (b.id !== battleId || !b.result) return b;
            return { ...b, result: { ...b.result, claimed: true } };
          }),
        }));
        // Update battle stats via game store is done from the component
      },
    }),
    {
      name: "oliskins_battles_v1",
      version: 1,
    }
  )
);
