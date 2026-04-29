import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GameState, InventoryItem } from "../lib/types";
import { mockCases } from "../data/mockCases";
import { pickWeighted } from "../lib/random";

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      balanceCents: 1000,
      inventory: [],

      addBalanceCents: (delta) => set((state) => ({ 
        balanceCents: Math.max(0, state.balanceCents + delta) 
      })),

      reset: () => set({ balanceCents: 1000, inventory: [] }),

      openCase: (caseId) => {
        const state = get();
        const caseData = mockCases.find(c => c.id === caseId);
        
        if (!caseData) return { ok: false, reason: "unknown_case" };
        if (state.balanceCents < caseData.priceCents) return { ok: false, reason: "insufficient" };
        
        const drop = pickWeighted(caseData.drops);
        
        const newItem: InventoryItem = {
          instanceId: crypto.randomUUID(),
          dropId: drop.id,
          name: drop.name,
          rarity: drop.rarity,
          image: drop.image,
          valueCents: drop.valueCents,
          acquiredAt: Date.now(),
        };

        set((s) => ({
          balanceCents: s.balanceCents - caseData.priceCents,
          inventory: [...s.inventory, newItem]
        }));

        return { ok: true, item: newItem };
      },

      sellItem: (instanceId) => {
        set((state) => {
          const item = state.inventory.find(i => i.instanceId === instanceId);
          if (!item) return state;
          
          return {
            balanceCents: state.balanceCents + item.valueCents,
            inventory: state.inventory.filter(i => i.instanceId !== instanceId)
          };
        });
      },

      sellAll: () => {
        set((state) => {
          const totalValue = state.inventory.reduce((sum, item) => sum + item.valueCents, 0);
          return {
            balanceCents: state.balanceCents + totalValue,
            inventory: []
          };
        });
      }
    }),
    {
      name: "oliskins_state_v1",
    }
  )
);
