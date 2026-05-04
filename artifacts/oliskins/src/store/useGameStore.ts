import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  GameState,
  InventoryItem,
  Settings,
  Stats,
  FREE_CASE_COOLDOWN_MS,
  CENTS_PER_XP,
  computeLevel,
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
      xp: 0,
      settings: { ...DEFAULT_SETTINGS },

      addBalanceCents: (delta) =>
        set((state) => ({
          balanceCents: Math.max(0, state.balanceCents + delta),
        })),

      addXp: (delta) =>
        set((state) => {
          const safe = Math.floor(delta);
          if (!isFinite(safe) || safe <= 0) return state;
          return { xp: state.xp + safe };
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
          xp: 0,
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

        set((s) => {
          const prevSpent = s.stats.totalSpentCents;
          const newSpent = prevSpent + cost;
          // Accrue 1 XP per CENTS_PER_XP cumulatively spent. Computing the
          // delta against the previous total ensures correct XP across
          // multi-open batches and Boost-doubled costs.
          const xpDelta =
            Math.floor(newSpent / CENTS_PER_XP) -
            Math.floor(prevSpent / CENTS_PER_XP);
          return {
            balanceCents: s.balanceCents - cost,
            inventory: [...s.inventory, newItem],
            xp: s.xp + xpDelta,
            stats: {
              ...s.stats,
              casesOpened: s.stats.casesOpened + 1,
              totalSpentCents: newSpent,
              totalWonCents: s.stats.totalWonCents + drop.valueCents,
            },
          };
        });

        return { ok: true, item: newItem };
      },

      openFreeCase: (caseId) => {
        const state = get();
        const caseData = useFreeCaseStore.getState().freeCases.find((c) => c.id === caseId);
        if (!caseData) return { ok: false, reason: "unknown_case" };

        const level = computeLevel(state.xp);
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
      version: 6,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<GameState>;
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
        if (version < 3) {
          if (state.xp == null) {
            const spent = state.stats?.totalSpentCents ?? 0;
            state.xp = Math.floor(spent / CENTS_PER_XP);
          }
        }
        if (version < 4) {
          state.settings = { ...DEFAULT_SETTINGS, ...(state.settings ?? {}) };
        }
        if (version < 5) {
          state.stats = { ...DEFAULT_STATS, ...(state.stats ?? {}) };
        }
        if (version < 6) {
          // Migrate old rarity keys to CS-style keys in inventory
          state.inventory = (state.inventory ?? []).map((it) => ({
            ...it,
            rarity: migrateRarity(it.rarity as string),
          }));
        }
        return state as GameState;
      },
    }
  )
);
