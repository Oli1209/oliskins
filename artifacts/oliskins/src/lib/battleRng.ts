import type { Case } from "./types";
import { getEffectiveDrops } from "./chances";
import type { Battle, BattleDrop, BattleResult } from "./battleTypes";

// ─── LCG seeded RNG ───────────────────────────────────────────────────────────

export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
}

export function seedFromString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function pickWeightedSeeded<T extends { weight: number }>(
  items: T[],
  rng: SeededRNG
): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng.next() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// ─── Precompute all drops deterministically ───────────────────────────────────

export function precomputeBattleResult(
  battle: Battle,
  allCases: Case[]
): BattleResult {
  const rng = new SeededRNG(seedFromString(battle.id + battle.createdAt));

  const dropsByParticipant: Record<string, BattleDrop[]> = {};
  for (const p of battle.participants) {
    dropsByParticipant[p.id] = [];
  }

  let stepIndex = 0;
  let groupIndex = 0;

  for (const sc of battle.cases) {
    const caseData = allCases.find((c) => c.id === sc.caseId);
    if (!caseData) {
      groupIndex++;
      continue;
    }

    for (let q = 0; q < sc.qty; q++) {
      const thisStep = stepIndex++;
      const thisGroup = groupIndex;

      for (const p of battle.participants) {
        const effectiveDrops = getEffectiveDrops(caseData, sc.openMode);
        const pickable = effectiveDrops.map((d) => ({
          ...d,
          weight: d.effectiveWeight,
        }));
        const drop = pickWeightedSeeded(pickable, rng);

        dropsByParticipant[p.id].push({
          instanceId: `battle-${battle.id}-${p.id}-${thisStep}`,
          dropId: drop.id,
          name: drop.name,
          rarity: drop.rarity,
          image: drop.image,
          valueCents: drop.valueCents,
          stepIndex: thisStep,
          groupIndex: thisGroup,
        });
      }
    }

    groupIndex++;
  }

  const lastGroupIndex = battle.cases.length - 1;
  const totalValueByParticipant: Record<string, number> = {};
  const lastGroupDropsByParticipant: Record<string, BattleDrop[]> = {};

  for (const p of battle.participants) {
    const drops = dropsByParticipant[p.id];
    totalValueByParticipant[p.id] = drops.reduce(
      (s, d) => s + d.valueCents,
      0
    );
    lastGroupDropsByParticipant[p.id] = drops.filter(
      (d) => d.groupIndex === lastGroupIndex
    );
  }

  let winnerId: string | null = null;

  if (battle.mode !== "shared" && battle.participants.length > 0) {
    const pts = battle.participants;

    if (battle.mode === "standard") {
      winnerId = pts.reduce((best, p) =>
        totalValueByParticipant[p.id] > totalValueByParticipant[best.id]
          ? p
          : best
      ).id;
    } else if (battle.mode === "underdog") {
      winnerId = pts.reduce((best, p) =>
        totalValueByParticipant[p.id] < totalValueByParticipant[best.id]
          ? p
          : best
      ).id;
    } else if (battle.mode === "terminal") {
      winnerId = pts.reduce((best, p) => {
        const pBest = Math.max(
          ...(lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents),
          0
        );
        const bBest = Math.max(
          ...(lastGroupDropsByParticipant[best.id] ?? []).map(
            (d) => d.valueCents
          ),
          0
        );
        return pBest > bBest ? p : best;
      }).id;
    } else if (battle.mode === "crazy_terminal") {
      winnerId = pts.reduce((best, p) => {
        const pWorst = Math.min(
          ...(lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents),
          Infinity
        );
        const bWorst = Math.min(
          ...(lastGroupDropsByParticipant[best.id] ?? []).map(
            (d) => d.valueCents
          ),
          Infinity
        );
        return pWorst < bWorst ? p : best;
      }).id;
    }
  }

  return {
    dropsByParticipant,
    totalValueByParticipant,
    lastGroupDropsByParticipant,
    winnerId,
    claimed: false,
  };
}

// ─── Pending rewards for the real user ───────────────────────────────────────

export function computePendingRewards(
  battle: Battle
): BattleDrop[] {
  const result = battle.result;
  if (!result || result.claimed) return [];

  const userId = battle.participants[0]?.id;
  if (!userId) return [];

  if (battle.mode === "shared") {
    return result.dropsByParticipant[userId] ?? [];
  }

  if (result.winnerId === userId) {
    return Object.values(result.dropsByParticipant).flat();
  }

  return [];
}
