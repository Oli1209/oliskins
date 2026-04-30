import { Case, Drop } from "./types";

export type Mode = "normal" | "boost" | "jester";

export type DropWithChance = Drop & { chancePct: number };

/**
 * Compute the displayed drop chances for a case under a given mode.
 *
 * For now `mode` is unused — every mode returns the natural weights so
 * future mode logic can adjust this without any caller-side changes.
 */
export function getDropsWithChances(
  caseData: Case,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mode: Mode = "normal"
): DropWithChance[] {
  const total = caseData.drops.reduce((sum, d) => sum + d.weight, 0);
  if (total <= 0) {
    return caseData.drops.map((d) => ({ ...d, chancePct: 0 }));
  }
  return caseData.drops.map((d) => ({
    ...d,
    chancePct: (d.weight / total) * 100,
  }));
}

export function formatChance(pct: number): string {
  return `${pct.toFixed(2)}%`;
}
