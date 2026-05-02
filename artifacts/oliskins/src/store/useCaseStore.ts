import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Case } from "../lib/types";
import { mockCases } from "../data/mockCases";

type CaseStoreState = {
  paidCases: Case[];
  addCase: (c: Case) => void;
  updateCase: (c: Case) => void;
  deleteCase: (id: string) => void;
  importCases: (cases: Case[]) => void;
};

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
    { name: "oliskins_cases_v1" }
  )
);
