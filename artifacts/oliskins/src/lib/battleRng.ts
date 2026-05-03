import type { Case } from "./types";
import { getEffectiveDrops } from "./chances";
import type { Battle, BattleDrop, BattleResult, SelectedCase } from "./battleTypes";

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

/** Seeded tiebreak: among tied participants, pick one via RNG. */
function pickBestWithTiebreak<T>(
  items: T[],
  scorer: (item: T) => number,
  prefer: "max" | "min",
  rng: SeededRNG
): T {
  const scored = items.map((item) => ({ item, score: scorer(item) }));
  const best =
    prefer === "max"
      ? Math.max(...scored.map((s) => s.score))
      : Math.min(...scored.map((s) => s.score));
  const tied = scored.filter((s) => s.score === best).map((s) => s.item);
  if (tied.length === 1) return tied[0];
  return tied[Math.floor(rng.next() * tied.length)];
}

// ─── Step info (carries openMode for correct filler drops in animation) ───────

export interface BattleStep {
  caseData: Case;
  sc: SelectedCase;
}

export function buildStepList(battle: Battle, allCases: Case[]): BattleStep[] {
  const list: BattleStep[] = [];
  for (const sc of battle.cases) {
    const caseData = allCases.find((c) => c.id === sc.caseId);
    if (!caseData) continue;
    for (let q = 0; q < sc.qty; q++) {
      list.push({ caseData, sc });
    }
  }
  return list;
}

/** @deprecated Use buildStepList instead */
export function buildStepCaseList(battle: Battle, allCases: Case[]): Case[] {
  return buildStepList(battle, allCases).map((s) => s.caseData);
}

// ─── Precompute all drops deterministically ───────────────────────────────────

export function precomputeBattleResult(
  battle: Battle,
  allCases: Case[]
): BattleResult {
  const rng = new SeededRNG(seedFromString(battle.id + battle.createdAt));
  const tieRng = new SeededRNG(seedFromString("tie" + battle.id + battle.createdAt));
  const isTeams = battle.battleFormat === "teams";

  const dropsByParticipant: Record<string, BattleDrop[]> = {};
  for (const p of battle.participants) dropsByParticipant[p.id] = [];

  let stepIndex = 0;
  let groupIndex = 0;

  for (const sc of battle.cases) {
    const caseData = allCases.find((c) => c.id === sc.caseId);
    if (!caseData) { groupIndex++; continue; }

    for (let q = 0; q < sc.qty; q++) {
      const thisStep = stepIndex++;
      const thisGroup = groupIndex;

      for (const p of battle.participants) {
        const effectiveDrops = getEffectiveDrops(caseData, sc.openMode);
        const pickable = effectiveDrops.map((d) => ({ ...d, weight: d.effectiveWeight }));
        const drop = pickWeightedSeeded(pickable, rng);

        const droppedEffective = effectiveDrops.find((ed) => ed.id === drop.id);
        const chanceAtDrop = droppedEffective?.chancePct ?? 0;

        dropsByParticipant[p.id].push({
          instanceId: `battle-${battle.id}-${p.id}-${thisStep}`,
          dropId: drop.id,
          name: drop.name,
          rarity: drop.rarity,
          image: drop.image,
          valueCents: drop.valueCents,
          stepIndex: thisStep,
          groupIndex: thisGroup,
          caseId: caseData.id,
          openMode: sc.openMode,
          chanceAtDrop,
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
    totalValueByParticipant[p.id] = drops.reduce((s, d) => s + d.valueCents, 0);
    lastGroupDropsByParticipant[p.id] = drops.filter((d) => d.groupIndex === lastGroupIndex);
  }

  // Full loot pool = all drops from every participant (winner takes all)
  const fullLootPool: BattleDrop[] = Object.values(dropsByParticipant).flat();

  // ── Shared ─────────────────────────────────────────────────────────────────
  if (battle.mode === "shared") {
    const potTotal = Object.values(totalValueByParticipant).reduce((s, v) => s + v, 0);
    return {
      dropsByParticipant,
      totalValueByParticipant,
      lastGroupDropsByParticipant,
      winnerId: null,
      sharedPerHeadCents: Math.floor(potTotal / battle.maxPlayers),
      rewardItems: [],
      rewardStatus: "unclaimed",
    };
  }

  // ── Teams 2v2 ─────────────────────────────────────────────────────────────
  if (isTeams && battle.participants.length === 4) {
    const pts = battle.participants;
    const teamATotal = totalValueByParticipant[pts[0].id] + totalValueByParticipant[pts[1].id];
    const teamBTotal = totalValueByParticipant[pts[2].id] + totalValueByParticipant[pts[3].id];

    let teamWinnerId: "A" | "B" | null = null;

    if (battle.mode === "standard") {
      if (teamATotal !== teamBTotal) teamWinnerId = teamATotal > teamBTotal ? "A" : "B";
      else teamWinnerId = tieRng.next() < 0.5 ? "A" : "B";
    } else if (battle.mode === "underdog") {
      if (teamATotal !== teamBTotal) teamWinnerId = teamATotal < teamBTotal ? "A" : "B";
      else teamWinnerId = tieRng.next() < 0.5 ? "A" : "B";
    } else if (battle.mode === "terminal") {
      const aMax = Math.max(
        ...[...lastGroupDropsByParticipant[pts[0].id], ...lastGroupDropsByParticipant[pts[1].id]].map((d) => d.valueCents), 0
      );
      const bMax = Math.max(
        ...[...lastGroupDropsByParticipant[pts[2].id], ...lastGroupDropsByParticipant[pts[3].id]].map((d) => d.valueCents), 0
      );
      if (aMax !== bMax) teamWinnerId = aMax > bMax ? "A" : "B";
      else teamWinnerId = tieRng.next() < 0.5 ? "A" : "B";
    } else if (battle.mode === "crazy_terminal") {
      const aMin = Math.min(
        ...[...lastGroupDropsByParticipant[pts[0].id], ...lastGroupDropsByParticipant[pts[1].id]].map((d) => d.valueCents), Infinity
      );
      const bMin = Math.min(
        ...[...lastGroupDropsByParticipant[pts[2].id], ...lastGroupDropsByParticipant[pts[3].id]].map((d) => d.valueCents), Infinity
      );
      if (aMin !== bMin) teamWinnerId = aMin < bMin ? "A" : "B";
      else teamWinnerId = tieRng.next() < 0.5 ? "A" : "B";
    }

    return {
      dropsByParticipant,
      totalValueByParticipant,
      lastGroupDropsByParticipant,
      winnerId: null,
      teamWinnerId,
      rewardItems: fullLootPool,
      rewardStatus: "unclaimed",
    };
  }

  // ── FFA with seeded tiebreak ───────────────────────────────────────────────
  let winnerId: string | null = null;
  const pts = battle.participants;

  if (pts.length > 0) {
    if (battle.mode === "standard") {
      winnerId = pickBestWithTiebreak(pts, (p) => totalValueByParticipant[p.id], "max", tieRng).id;
    } else if (battle.mode === "underdog") {
      winnerId = pickBestWithTiebreak(pts, (p) => totalValueByParticipant[p.id], "min", tieRng).id;
    } else if (battle.mode === "terminal") {
      winnerId = pickBestWithTiebreak(
        pts,
        (p) => Math.max(...(lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents), 0),
        "max",
        tieRng
      ).id;
    } else if (battle.mode === "crazy_terminal") {
      winnerId = pickBestWithTiebreak(
        pts,
        (p) => Math.min(...(lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents), Infinity),
        "min",
        tieRng
      ).id;
    }
  }

  return {
    dropsByParticipant,
    totalValueByParticipant,
    lastGroupDropsByParticipant,
    winnerId,
    rewardItems: fullLootPool,
    rewardStatus: "unclaimed",
  };
}

// ─── Pending rewards for the real user ───────────────────────────────────────

/**
 * Returns the reward items the real user (first participant) is eligible to
 * claim. Empty if already claimed, not the winner, or shared mode.
 */
export function computePendingRewards(battle: Battle): BattleDrop[] {
  const result = battle.result;
  if (!result || result.rewardStatus !== "unclaimed") return [];

  const userId = battle.participants[0]?.id;
  if (!userId) return [];

  if (battle.mode === "shared") return [];

  if (battle.battleFormat === "teams" && result.teamWinnerId != null) {
    const userIdx = battle.participants.findIndex((p) => p.id === userId);
    const userTeam = userIdx < 2 ? "A" : "B";
    if (userTeam === result.teamWinnerId) return result.rewardItems;
    return [];
  }

  if (result.winnerId === userId) return result.rewardItems;

  return [];
}
