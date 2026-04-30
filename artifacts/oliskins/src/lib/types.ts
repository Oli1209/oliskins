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

  addBalanceCents: (delta: number) => void;
  reset: () => void;
  openCase: (caseId: string, mode?: Mode) => { ok: true; item: InventoryItem } | { ok: false; reason: "insufficient" | "unknown_case" };
  openFreeCase: (caseId: string) => OpenFreeCaseResult;
  sellItem: (instanceId: string) => SellItemResult;
  sellAll: () => SellAllResult;
  toggleLock: (instanceId: string) => void;
  setInventorySort: (sort: InventorySort) => void;
};

export const FREE_CASE_COOLDOWN_MS = 60 * 60 * 1000; // 1h

export function computeLevel(casesOpened: number): number {
  return 1 + Math.floor(casesOpened / 10);
}
