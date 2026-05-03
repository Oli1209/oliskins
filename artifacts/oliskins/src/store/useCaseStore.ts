import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Case } from "../lib/types";
import { migrateRarity } from "../lib/rarity";
import { mockCases } from "../data/mockCases";

type CaseStoreState = {
  paidCases: Case[];
  addCase: (c: Case) => void;
  updateCase: (c: Case) => void;
  deleteCase: (id: string) => void;
  importCases: (cases: Case[]) => void;
};

function migrateCase(c: Case): Case {
  return {
    ...c,
    drops: c.drops.map((d) => ({
      ...d,
      rarity: migrateRarity(d.rarity as string),
    })),
  };
}

export const useCaseStore = create<CaseStoreState>()(
  persist(
    (set) => ({
      paidCases: [...mockCases],

      addCase: (c) => set((s) => ({ paidCases: [...s.paidCases, c] })),

      updateCase: (c) =>
        set((s) => ({
          paidCases: s.paidCases.map((x) => (x.id === c.id ? c : x)),
        })),

      deleteCase: (id) =>
        set((s) => ({ paidCases: s.paidCases.filter((x) => x.id !== id) })),

      importCases: (cases) => set({ paidCases: cases }),
    }),
    {
      name: "oliskins_cases_v1",
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<CaseStoreState>;
        if (version < 1) {
          state.paidCases = (state.paidCases ?? []).map(migrateCase);
        }
        return state as CaseStoreState;
      },
    }
  )
);
