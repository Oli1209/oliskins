import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Case } from "../lib/types";
import { freeCases as builtinFreeCases } from "../data/freeCases";
import type { FreeCase } from "../lib/types";

function freeCaseToCase(fc: FreeCase): Case {
  return {
    id: fc.id,
    name: fc.name,
    description: fc.description,
    priceCents: 0,
    image: fc.image,
    drops: fc.drops,
    tier: fc.tier,
    requiredLevel: fc.requiredLevel,
  };
}

const DEFAULT_FREE_CASES: Case[] = builtinFreeCases.map(freeCaseToCase);

type FreeCaseStoreState = {
  freeCases: Case[];
  addCase: (c: Case) => void;
  updateCase: (c: Case) => void;
  deleteCase: (id: string) => void;
  importCases: (cases: Case[]) => void;
};

export const useFreeCaseStore = create<FreeCaseStoreState>()(
  persist(
    (set) => ({
      freeCases: DEFAULT_FREE_CASES,

      addCase: (c) => set((s) => ({ freeCases: [...s.freeCases, c] })),

      updateCase: (c) =>
        set((s) => ({
          freeCases: s.freeCases.map((x) => (x.id === c.id ? c : x)),
        })),

      deleteCase: (id) =>
        set((s) => ({ freeCases: s.freeCases.filter((x) => x.id !== id) })),

      importCases: (cases) => set({ freeCases: cases }),
    }),
    {
      name: "oliskins_free_cases_v1",
      version: 1,
    }
  )
);
