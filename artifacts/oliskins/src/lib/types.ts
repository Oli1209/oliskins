import type { Mode } from "./chances";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type Drop = {
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
  valueCents: number;
  weight: number;
};

export type Case = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  /** Optional flat Jester price (in cents). Falls back to priceCents. */
  jesterPriceCents?: number;
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
  instanceId: string;     // unique per acquired item
  dropId: string;
  name: string;
  rarity: Rarity;
  image: string;
  valueCents: number;
  acquiredAt: number;     // Date.now()
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
  balanceCents: number;          // default 1000
  inventory: InventoryItem[];    // default []
  inventorySort: InventorySort;  // default "date_new"
  stats: Stats;
  lastFreeOpenAt: number | null;
  xp: number;                    // total XP earned (paid openings only)
  settings: Settings;

  addBalanceCents: (delta: number) => void;
  addXp: (delta: number) => void;
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

export const XP_PER_LEVEL = 100;
export const CENTS_PER_XP = 500; // #5.00 spent = 1 XP

/** Returns true if a case has valid drops and weights for opening/battles. */
export function isCaseValid(c: Case): boolean {
  if (!c.drops || c.drops.length === 0) return false;
  if (c.drops.some((d) => d.weight <= 0)) return false;
  const sumWeights = c.drops.reduce((s, d) => s + d.weight, 0);
  return sumWeights > 0;
}

export const INVALID_CASE_MSG = "Nie można użyć tej skrzynki — błędne dropy (wagi).";

/** Level derived from XP. 100 XP per level. */
export function computeLevel(xp: number): number {
  return 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
}

/** XP within the current level (0..XP_PER_LEVEL-1). */
export function getCurrentLevelXp(xp: number): number {
  return Math.max(0, xp) % XP_PER_LEVEL;
}

/** XP earned for a paid opening of `totalCostCents`. Floors to integer. */
export function xpForSpend(totalCostCents: number): number {
  if (totalCostCents <= 0) return 0;
  return Math.floor(totalCostCents / CENTS_PER_XP);
}
