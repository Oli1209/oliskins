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

// ─── Step → case lookup ───────────────────────────────────────────────────────

export function buildStepCaseList(battle: Battle, allCases: Case[]): Case[] {
  const list: Case[] = [];
  for (const sc of battle.cases) {
    const caseData = allCases.find((c) => c.id === sc.caseId);
    for (let q = 0; q < sc.qty; q++) {
      if (caseData) list.push(caseData);
    }
  }
  return list;
}

// ─── Precompute all drops deterministically ───────────────────────────────────

export function precomputeBattleResult(
  battle: Battle,
  allCases: Case[]
): BattleResult {
  const rng = new SeededRNG(seedFromString(battle.id + battle.createdAt));
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
    totalValueByParticipant[p.id] = drops.reduce((s, d) => s + d.valueCents, 0);
    lastGroupDropsByParticipant[p.id] = drops.filter((d) => d.groupIndex === lastGroupIndex);
  }

  // ── Shared: cash-only, equal split ──
  if (battle.mode === "shared") {
    const potTotal = Object.values(totalValueByParticipant).reduce((s, v) => s + v, 0);
    const perHead = Math.floor(potTotal / battle.maxPlayers);
    return {
      dropsByParticipant,
      totalValueByParticipant,
      lastGroupDropsByParticipant,
      winnerId: null,
      sharedPerHeadCents: perHead,
      claimed: false,
    };
  }

  // ── Teams 2v2: compare team totals ──
  if (isTeams && battle.participants.length === 4) {
    const pts = battle.participants;
    const teamATotal = totalValueByParticipant[pts[0].id] + totalValueByParticipant[pts[1].id];
    const teamBTotal = totalValueByParticipant[pts[2].id] + totalValueByParticipant[pts[3].id];
    let teamWinnerId: "A" | "B" | null = null;

    if (battle.mode === "standard") teamWinnerId = teamATotal >= teamBTotal ? "A" : "B";
    else if (battle.mode === "underdog") teamWinnerId = teamATotal <= teamBTotal ? "A" : "B";
    else if (battle.mode === "terminal") {
      const aMax = Math.max(
        ...[...lastGroupDropsByParticipant[pts[0].id], ...lastGroupDropsByParticipant[pts[1].id]].map((d) => d.valueCents), 0
      );
      const bMax = Math.max(
        ...[...lastGroupDropsByParticipant[pts[2].id], ...lastGroupDropsByParticipant[pts[3].id]].map((d) => d.valueCents), 0
      );
      teamWinnerId = aMax >= bMax ? "A" : "B";
    } else if (battle.mode === "crazy_terminal") {
      const aMin = Math.min(
        ...[...lastGroupDropsByParticipant[pts[0].id], ...lastGroupDropsByParticipant[pts[1].id]].map((d) => d.valueCents), Infinity
      );
      const bMin = Math.min(
        ...[...lastGroupDropsByParticipant[pts[2].id], ...lastGroupDropsByParticipant[pts[3].id]].map((d) => d.valueCents), Infinity
      );
      teamWinnerId = aMin <= bMin ? "A" : "B";
    }

    return {
      dropsByParticipant,
      totalValueByParticipant,
      lastGroupDropsByParticipant,
      winnerId: null,
      teamWinnerId,
      claimed: false,
    };
  }

  // ── FFA: standard winner logic ──
  let winnerId: string | null = null;
  const pts = battle.participants;
  if (pts.length > 0) {
    if (battle.mode === "standard") {
      winnerId = pts.reduce((b, p) => totalValueByParticipant[p.id] > totalValueByParticipant[b.id] ? p : b).id;
    } else if (battle.mode === "underdog") {
      winnerId = pts.reduce((b, p) => totalValueByParticipant[p.id] < totalValueByParticipant[b.id] ? p : b).id;
    } else if (battle.mode === "terminal") {
      winnerId = pts.reduce((b, p) => {
        const pv = Math.max(...(lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents), 0);
        const bv = Math.max(...(lastGroupDropsByParticipant[b.id] ?? []).map((d) => d.valueCents), 0);
        return pv > bv ? p : b;
      }).id;
    } else if (battle.mode === "crazy_terminal") {
      winnerId = pts.reduce((b, p) => {
        const pv = Math.min(...(lastGroupDropsByParticipant[p.id] ?? []).map((d) => d.valueCents), Infinity);
        const bv = Math.min(...(lastGroupDropsByParticipant[b.id] ?? []).map((d) => d.valueCents), Infinity);
        return pv < bv ? p : b;
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

export function computePendingRewards(battle: Battle): BattleDrop[] {
  const result = battle.result;
  if (!result || result.claimed) return [];
  const userId = battle.participants[0]?.id;
  if (!userId) return [];

  // Shared = cash only, no items
  if (battle.mode === "shared") return [];

  // Teams mode: winning team gets all items
  if (battle.battleFormat === "teams" && result.teamWinnerId != null) {
    const pts = battle.participants;
    const userIdx = pts.findIndex((p) => p.id === userId);
    const userTeam = userIdx < 2 ? "A" : "B";
    if (userTeam === result.teamWinnerId) {
      return Object.values(result.dropsByParticipant).flat();
    }
    return [];
  }

  // FFA: single winner takes all
  if (result.winnerId === userId) {
    return Object.values(result.dropsByParticipant).flat();
  }

  return [];
}
