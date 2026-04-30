import { Case, Drop } from "./types";

export type Mode = "normal" | "boost" | "jester";

export type EffectiveDrop = Drop & {
  effectiveWeight: number;
  chancePct: number;
};

/**
 * Cost multiplier applied to the case base price for the chosen mode.
 * Boost is twice as expensive; Normal and Jester cost the base price.
 */
export function getModePriceMultiplier(mode: Mode): number {
  if (mode === "boost") return 2;
  return 1;
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
