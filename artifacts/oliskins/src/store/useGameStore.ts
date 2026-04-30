import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameState, InventoryItem } from "../lib/types";
import { mockCases } from "../data/mockCases";
import { pickWeighted } from "../lib/random";
import { getEffectiveDrops, getTotalCostCents } from "../lib/chances";

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      balanceCents: 1000,
      inventory: [],
      inventorySort: "date_new",

      addBalanceCents: (delta) =>
        set((state) => ({
          balanceCents: Math.max(0, state.balanceCents + delta),
        })),

      reset: () =>
        set({ balanceCents: 1000, inventory: [], inventorySort: "date_new" }),

      openCase: (caseId, mode = "normal") => {
        const state = get();
        const caseData = mockCases.find((c) => c.id === caseId);

        if (!caseData) return { ok: false, reason: "unknown_case" };

        const cost = getTotalCostCents(caseData.priceCents, 1, mode);
        if (state.balanceCents < cost)
          return { ok: false, reason: "insufficient" };

        // Single RNG path: derive mode-aware weights via getEffectiveDrops
        // and feed them into pickWeighted using the `weight` field.
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
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<GameState>;
        if (version < 1) {
          state.inventory = (state.inventory ?? []).map((it) => ({
            ...it,
            locked: (it as Partial<InventoryItem>).locked ?? false,
          }));
          state.inventorySort = state.inventorySort ?? "date_new";
        }
        return state as GameState;
      },
    }
  )
);
