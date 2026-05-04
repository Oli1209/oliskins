import type { Case } from "./types";
import { DatasetV1Schema, type CaseV1, type DatasetV1 } from "../data/datasetSchema";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function caseToV1(c: Case): CaseV1 {
  const base: CaseV1 = {
    id: c.id,
    name: c.name,
    description: c.description,
    priceCents: c.priceCents,
    image: c.image,
    drops: [...c.drops]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((d) => ({
        id: d.id,
        name: d.name,
        rarity: d.rarity,
        valueCents: d.valueCents,
        weight: d.weight,
        image: d.image,
      })),
  };
  if (c.requiredLevel != null) base.requiredLevel = c.requiredLevel;
  if (c.modeAvailability) base.modeAvailability = { ...c.modeAvailability };
  if (c.modePricing) base.modePricing = { ...c.modePricing };
  return base;
}

function sortedCases(cases: Case[]): CaseV1[] {
  return [...cases].sort((a, b) => a.id.localeCompare(b.id)).map(caseToV1);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type BuildDatasetResult =
  | { ok: true; dataset: DatasetV1; json: string }
  | { ok: false; errors: string[] };

/**
 * Builds a canonical, Zod-validated, deterministically sorted DatasetV1.
 * Pass freeCases to include them in the export; omit to produce paid-only.
 */
export function buildDatasetV1(
  paidCases: Case[],
  freeCases?: Case[],
): BuildDatasetResult {
  const payload = {
    schemaVersion: 1 as const,
    currency: "$" as const,
    generatedAt: new Date().toISOString(),
    paidCases: sortedCases(paidCases),
    ...(freeCases ? { freeCases: sortedCases(freeCases) } : {}),
  };

  const result = DatasetV1Schema.safeParse(payload);
  if (!result.success) {
    const errors = result.error.errors.map(
      (e) => `${e.path.join(".")} — ${e.message}`,
    );
    return { ok: false, errors };
  }
  return { ok: true, dataset: result.data, json: JSON.stringify(result.data, null, 2) };
}

/** Triggers a browser download of a JSON string as `filename`. */
export function downloadJson(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
