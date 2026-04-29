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

export type GameState = {
  balanceCents: number;          // default 1000
  inventory: InventoryItem[];    // default []
  inventorySort: InventorySort;  // default "date_new"

  addBalanceCents: (delta: number) => void;
  reset: () => void;
  openCase: (caseId: string) => { ok: true; item: InventoryItem } | { ok: false; reason: "insufficient" | "unknown_case" };
  sellItem: (instanceId: string) => SellItemResult;
  sellAll: () => SellAllResult;
  toggleLock: (instanceId: string) => void;
  setInventorySort: (sort: InventorySort) => void;
};
