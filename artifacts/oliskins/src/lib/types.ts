import type { Mode } from "./chances";

export type Rarity =
  | "consumer"
  | "industrial"
  | "mil_spec"
  | "restricted"
  | "classified"
  | "covert"
  | "extraordinary";

export type Drop = {
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
  valueCents: number;
  weight: number;
  /**
   * Whether this drop is eligible for the Boost weight multiplier.
   * Defaults to true when undefined (opt-out model).
   */
  boostEligible?: boolean;
};

export type ModePricing = {
  boostMult: number;
  jesterMult: number;
  /** Weight multiplier applied to boost-eligible drops in Boost mode. Default 2.0. */
  boostWeightMult: number;
};

export const DEFAULT_MODE_PRICING: ModePricing = {
  boostMult: 2.0,
  jesterMult: 1.0,
  boostWeightMult: 2.0,
};

export type ModeAvailability = {
  boostEnabled: boolean;
  jesterEnabled: boolean;
};

export const DEFAULT_MODE_AVAILABILITY: ModeAvailability = {
  boostEnabled: true,
  jesterEnabled: true,
};

export type Case = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  modePricing?: ModePricing;
  modeAvailability?: ModeAvailability;
  /** Free cases only: tier number (1–5) */
  tier?: number;
  /** Free cases only: minimum player level required to open */
  requiredLevel?: number;
  image: string;
  drops: Drop[];
};

export type FreeCase = {
  id: string;
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  requiredLevel: number;
  image: string;
  drops: Drop[];
};

export type InventoryItem = {
  instanceId: string;
  dropId: string;
  name: string;
  rarity: Rarity;
  image: string;
  valueCents: number;
  acquiredAt: number;
  locked: boolean;
};

export type InventorySort =
  | "date_new"
  | "date_old"
  | "price_asc"
  | "price_desc"
  | "rarity";

export type SellItemResult =
  | { ok: true; valueCents: number }
  | { ok: false; reason: "locked" | "not_found" };

export type SellAllResult = { soldCents: number; skipped: number };

export type Stats = {
  totalWonCents: number;
  totalSpentCents: number;
  casesOpened: number;
  freeCasesOpened: number;
  totalBattles: number;
  wonBattles: number;
  minigamesPlayed: number;
  minigamesWageredCents: number;
  minigamesProfitCents: number;
};

export type Settings = {
  confettiEnabled: boolean;
};

export type OpenFreeCaseResult =
  | { ok: true; item: InventoryItem }
  | { ok: false; reason: "unknown_case" | "locked_level" | "cooldown" };

export type GameState = {
  balanceCents: number;
  inventory: InventoryItem[];
  inventorySort: InventorySort;
  stats: Stats;
  lastFreeOpenAt: number | null;
  /** Total qualifying spend in cents. Level is derived from this. */
  qualifyingSpendCents: number;
  settings: Settings;

  addBalanceCents: (delta: number) => void;
  addQualifyingSpendCents: (delta: number) => void;
  setConfettiEnabled: (enabled: boolean) => void;
  updateMinigameStats: (delta: {
    played?: number;
    wageredCents?: number;
    profitCents?: number;
  }) => void;
  reset: () => void;
  openCase: (caseId: string, mode?: Mode) => { ok: true; item: InventoryItem } | { ok: false; reason: "insufficient" | "unknown_case" };
  openFreeCase: (caseId: string) => OpenFreeCaseResult;
  sellItem: (instanceId: string) => SellItemResult;
  sellAll: () => SellAllResult;
  toggleLock: (instanceId: string) => void;
  setInventorySort: (sort: InventorySort) => void;
};

export const FREE_CASE_COOLDOWN_MS = 60 * 60 * 1000; // 1h

// ─── Level / Progression System ───────────────────────────────────────────────

/**
 * Returns the total qualifying spend in dollars required to reach the given level.
 * Level 1 requires $0. Level 100 requires $15,000,000.
 *
 * Phase 1 (L1–20):  linear    0 → $30,000
 * Phase 2 (L21–70): quadratic $30,000 → $4,500,000
 * Phase 3 (L71–100): cubic    $4,500,000 → $15,000,000
 */
export function getSpendRequiredForLevel(level: number): number {
  const l = Math.max(1, Math.min(100, Math.floor(level)));
  if (l <= 1) return 0;
  if (l <= 20) {
    return 30000 * (l - 1) / 19;
  }
  if (l <= 70) {
    const t = (l - 20) / 50;
    return 30000 + 4470000 * t * t;
  }
  const u = (l - 70) / 30;
  return 4500000 + 10500000 * u * u * u;
}

/**
 * Returns the current level (1–100) for a given qualifying spend in dollars.
 */
export function getLevelFromSpend(dollars: number): number {
  if (dollars <= 0) return 1;
  let level = 1;
  for (let l = 2; l <= 100; l++) {
    if (dollars >= getSpendRequiredForLevel(l)) {
      level = l;
    } else {
      break;
    }
  }
  return level;
}

export type LevelProgress = {
  level: number;
  nextLevel: number;
  currentDollars: number;
  requiredDollars: number;
  pct: number;
};

/**
 * Returns progress info for the current level derived from qualifying spend in dollars.
 */
export function getLevelProgress(dollars: number): LevelProgress {
  const level = getLevelFromSpend(dollars);
  const nextLevel = Math.min(100, level + 1);
  const currentLevelRequires = getSpendRequiredForLevel(level);
  const nextLevelRequires = getSpendRequiredForLevel(nextLevel);
  const span = nextLevelRequires - currentLevelRequires;
  const progress = dollars - currentLevelRequires;
  const pct = level >= 100 ? 100 : span > 0 ? Math.min(100, (progress / span) * 100) : 100;
  return {
    level,
    nextLevel,
    currentDollars: dollars,
    requiredDollars: nextLevelRequires,
    pct,
  };
}

/**
 * XP derived from qualifying spend. 1 dollar spent = 5 XP.
 */
export function xpFromQualifyingSpend(qualifyingSpendCents: number): number {
  return Math.floor((qualifyingSpendCents / 100) * 5);
}

/** Returns true if a case has valid drops and weights for opening/battles. */
export function isCaseValid(c: Case): boolean {
  if (!c.drops || c.drops.length === 0) return false;
  if (c.drops.some((d) => d.weight <= 0)) return false;
  const sumWeights = c.drops.reduce((s, d) => s + d.weight, 0);
  return sumWeights > 0;
}

export const INVALID_CASE_MSG = "Nie można użyć tej skrzynki — błędne dropy (wagi).";
