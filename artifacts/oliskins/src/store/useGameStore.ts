import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GameState,
  InventoryItem,
  Settings,
  Stats,
  FREE_CASE_COOLDOWN_MS,
  getLevelFromSpend,
} from "../lib/types";
import { migrateRarity } from "../lib/rarity";
import { useCaseStore } from "./useCaseStore";
import { useFreeCaseStore } from "./useFreeCaseStore";
import { pickWeighted } from "../lib/random";
import { getEffectiveDrops, getTotalCostCents } from "../lib/chances";

const DEFAULT_STATS: Stats = {
  totalWonCents: 0,
  totalSpentCents: 0,
  casesOpened: 0,
  freeCasesOpened: 0,
  totalBattles: 0,
  wonBattles: 0,
  minigamesPlayed: 0,
  minigamesWageredCents: 0,
  minigamesProfitCents: 0,
};

const DEFAULT_SETTINGS: Settings = {
  confettiEnabled: true,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      balanceCents: 1000,
      inventory: [],
      inventorySort: "date_new",
      stats: { ...DEFAULT_STATS },
      lastFreeOpenAt: null,
      qualifyingSpendCents: 0,
      settings: { ...DEFAULT_SETTINGS },

      addBalanceCents: (delta) =>
        set((state) => ({
          balanceCents: Math.max(0, state.balanceCents + delta),
        })),

      addQualifyingSpendCents: (delta) =>
        set((state) => {
          const safe = Math.floor(delta);
          if (!isFinite(safe) || safe <= 0) return state;
          return { qualifyingSpendCents: state.qualifyingSpendCents + safe };
        }),

      setConfettiEnabled: (enabled) =>
        set((state) => ({
          settings: { ...state.settings, confettiEnabled: !!enabled },
        })),

      updateMinigameStats: ({ played = 0, wageredCents = 0, profitCents = 0 }) =>
        set((s) => ({
          stats: {
            ...s.stats,
            minigamesPlayed: s.stats.minigamesPlayed + played,
            minigamesWageredCents: s.stats.minigamesWageredCents + wageredCents,
            minigamesProfitCents: s.stats.minigamesProfitCents + profitCents,
          },
        })),

      reset: () =>
        set({
          balanceCents: 1000,
          inventory: [],
          inventorySort: "date_new",
          stats: { ...DEFAULT_STATS },
          lastFreeOpenAt: null,
          qualifyingSpendCents: 0,
          settings: { ...DEFAULT_SETTINGS },
        }),

      openCase: (caseId, mode = "normal") => {
        const state = get();
        const caseData = useCaseStore.getState().paidCases.find((c) => c.id === caseId);

        if (!caseData) return { ok: false, reason: "unknown_case" };

        const cost = getTotalCostCents(caseData, 1, mode);
        if (state.balanceCents < cost)
          return { ok: false, reason: "insufficient" };

        const pickable = getEffectiveDrops(caseData, mode).map((d) => ({
          ...d,
          weight: d.effectiveWeight,
        }));
        const drop = pickWeighted(pickable);

        const newItem: InventoryItem = {
          instanceId: crypto.randomUUID(),
          dropId: drop.id,
          name: drop.name,
          rarity: drop.rarity,
          image: drop.image,
          valueCents: drop.valueCents,
          acquiredAt: Date.now(),
          locked: false,
        };

        set((s) => ({
          balanceCents: s.balanceCents - cost,
          inventory: [...s.inventory, newItem],
          // Paid case openings always add to qualifying spend
          qualifyingSpendCents: s.qualifyingSpendCents + cost,
          stats: {
            ...s.stats,
            casesOpened: s.stats.casesOpened + 1,
            totalSpentCents: s.stats.totalSpentCents + cost,
            totalWonCents: s.stats.totalWonCents + drop.valueCents,
          },
        }));

        return { ok: true, item: newItem };
      },

      openFreeCase: (caseId) => {
        const state = get();
        const caseData = useFreeCaseStore.getState().freeCases.find((c) => c.id === caseId);
        if (!caseData) return { ok: false, reason: "unknown_case" };

        const level = getLevelFromSpend(state.qualifyingSpendCents / 100);
        const requiredLevel = caseData.requiredLevel ?? 1;
        if (level < requiredLevel)
          return { ok: false, reason: "locked_level" };

        const now = Date.now();
        if (
          state.lastFreeOpenAt !== null &&
          now - state.lastFreeOpenAt < FREE_CASE_COOLDOWN_MS
        ) {
          return { ok: false, reason: "cooldown" };
        }

        const drop = pickWeighted(caseData.drops);

        const newItem: InventoryItem = {
          instanceId: crypto.randomUUID(),
          dropId: drop.id,
          name: drop.name,
          rarity: drop.rarity,
          image: drop.image,
          valueCents: drop.valueCents,
          acquiredAt: now,
          locked: false,
        };

        set((s) => ({
          inventory: [...s.inventory, newItem],
          lastFreeOpenAt: now,
          stats: {
            ...s.stats,
            casesOpened: s.stats.casesOpened + 1,
            freeCasesOpened: s.stats.freeCasesOpened + 1,
            totalWonCents: s.stats.totalWonCents + drop.valueCents,
          },
        }));

        return { ok: true, item: newItem };
      },

      sellItem: (instanceId) => {
        const state = get();
        const item = state.inventory.find((i) => i.instanceId === instanceId);
        if (!item) return { ok: false, reason: "not_found" };
        if (item.locked) return { ok: false, reason: "locked" };

        set((s) => ({
          balanceCents: s.balanceCents + item.valueCents,
          inventory: s.inventory.filter((i) => i.instanceId !== instanceId),
        }));

        return { ok: true, valueCents: item.valueCents };
      },

      sellAll: () => {
        const state = get();
        const unlocked = state.inventory.filter((i) => !i.locked);
        const locked = state.inventory.filter((i) => i.locked);
        const soldCents = unlocked.reduce((sum, i) => sum + i.valueCents, 0);

        if (unlocked.length === 0) {
          return { soldCents: 0, skipped: locked.length };
        }

        set((s) => ({
          balanceCents: s.balanceCents + soldCents,
          inventory: locked,
        }));

        return { soldCents, skipped: locked.length };
      },

      toggleLock: (instanceId) => {
        set((state) => ({
          inventory: state.inventory.map((i) =>
            i.instanceId === instanceId ? { ...i, locked: !i.locked } : i
          ),
        }));
      },

      setInventorySort: (sort) => set({ inventorySort: sort }),
    }),
    {
      name: "oliskins_state_v1",
      version: 7,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<GameState> & { xp?: number };
        if (version < 1) {
          state.inventory = (state.inventory ?? []).map((it) => ({
            ...it,
            locked: (it as Partial<InventoryItem>).locked ?? false,
          }));
          state.inventorySort = state.inventorySort ?? "date_new";
        }
        if (version < 2) {
          state.stats = { ...DEFAULT_STATS, ...(state.stats ?? {}) };
          state.lastFreeOpenAt = state.lastFreeOpenAt ?? null;
        }
        if (version < 4) {
          state.settings = { ...DEFAULT_SETTINGS, ...(state.settings ?? {}) };
        }
        if (version < 5) {
          state.stats = { ...DEFAULT_STATS, ...(state.stats ?? {}) };
        }
        if (version < 6) {
          state.inventory = (state.inventory ?? []).map((it) => ({
            ...it,
            rarity: migrateRarity(it.rarity as string),
          }));
        }
        if (version < 7) {
          // Migrate old xp-based progression to qualifyingSpendCents.
          // Old qualifying spend was purely from paid case openings = totalSpentCents.
          state.qualifyingSpendCents = state.stats?.totalSpentCents ?? 0;
          // Remove legacy xp field
          delete state.xp;
        }
        return state as GameState;
      },
    }
  )
);
