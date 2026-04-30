import { Case, Drop } from "./types";

export type Mode = "normal" | "boost" | "jester";

export type EffectiveDrop = Drop & {
  effectiveWeight: number;
  chancePct: number;
};

/**
 * Per-open cost (in cents) for a case under the chosen mode.
 *
 * - Normal: case.priceCents
 * - Boost:  case.priceCents * 2
 * - Jester: case.jesterPriceCents (falls back to case.priceCents)
 */
export function getUnitCostCents(caseData: Case, mode: Mode): number {
  if (mode === "boost") return caseData.priceCents * 2;
  if (mode === "jester")
    return caseData.jesterPriceCents ?? caseData.priceCents;
  return caseData.priceCents;
}

/**
 * Single source of truth for the total opening cost (in cents).
 * Used by the modal's "Cena otwarcia", the affordability check,
 * and the store's per-open balance deduction.
 */
export function getTotalCostCents(
  caseData: Case,
  quantity: number,
  mode: Mode
): number {
  return getUnitCostCents(caseData, mode) * quantity;
}

/**
 * Returns the case's drops with their mode-effective weight and the
 * derived display chance (percent). This is the single source of truth
 * for both the chance UI and the RNG opening logic.
 *
 * - normal: weight = drop.weight
 * - boost:  weight = drop.weight * 2 if drop.valueCents > case.priceCents
 *           else drop.weight
 * - jester: weight = 1 for every drop (uniform distribution)
 */
export function getEffectiveDrops(
  caseData: Case,
  mode: Mode = "normal"
): EffectiveDrop[] {
  const withWeights = caseData.drops.map((d) => {
    let effectiveWeight: number;
    if (mode === "jester") {
      effectiveWeight = 1;
    } else if (mode === "boost") {
      effectiveWeight =
        d.valueCents > caseData.priceCents ? d.weight * 2 : d.weight;
    } else {
      effectiveWeight = d.weight;
    }
    return { ...d, effectiveWeight };
  });

  const total = withWeights.reduce((sum, d) => sum + d.effectiveWeight, 0);
  return withWeights.map((d) => ({
    ...d,
    chancePct: total > 0 ? (d.effectiveWeight / total) * 100 : 0,
  }));
}

export function formatChance(pct: number): string {
  return `${pct.toFixed(2)}%`;
}
