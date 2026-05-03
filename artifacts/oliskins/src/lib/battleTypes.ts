import type { Mode } from "./chances";
import type { Rarity } from "./types";

export type BattleMode =
  | "standard"
  | "underdog"
  | "shared"
  | "terminal"
  | "crazy_terminal";

export type BattleFormat = "ffa" | "teams";

export type BattleStatus = "waiting" | "in_progress" | "completed";

export type RewardStatus = "unclaimed" | "kept" | "sold" | "shared_claimed";

export interface SelectedCase {
  caseId: string;
  qty: number;
  openMode: Mode;
}

export interface Participant {
  id: string;
  name: string;
  isBot: boolean;
}

export interface BattleDrop {
  instanceId: string;
  dropId: string;
  name: string;
  rarity: Rarity;
  image: string;
  valueCents: number;
  stepIndex: number;
  groupIndex: number;
  /** Which case this drop came from */
  caseId: string;
  /** Opening mode used (Normal/Boost/Jester) — affects chanceAtDrop */
  openMode: Mode;
  /** Drop probability (0–100) under the effective mode weights */
  chanceAtDrop: number;
}

export interface BattleResult {
  dropsByParticipant: Record<string, BattleDrop[]>;
  totalValueByParticipant: Record<string, number>;
  lastGroupDropsByParticipant: Record<string, BattleDrop[]>;
  /** null for shared mode and teams mode (use teamWinnerId instead) */
  winnerId: string | null;
  /** Only set when battleFormat = 'teams' */
  teamWinnerId?: "A" | "B" | null;
  /** Only set when mode = 'shared': cash per head in cents */
  sharedPerHeadCents?: number;
  /**
   * Full loot pool the winner receives (all drops from all participants).
   * Empty for shared mode.
   */
  rewardItems: BattleDrop[];
  /** Reward claim status — guards against duplicate claims */
  rewardStatus: RewardStatus;
}

export interface Battle {
  id: string;
  createdAt: number;
  status: BattleStatus;
  mode: BattleMode;
  /** 'ffa' = free-for-all (default), 'teams' = 2v2 (always maxPlayers=4) */
  battleFormat?: BattleFormat;
  maxPlayers: number;
  cases: SelectedCase[];
  participants: Participant[];
  result?: BattleResult;
}

export const MODE_LABELS: Record<BattleMode, string> = {
  standard: "Standard",
  underdog: "Underdog",
  shared: "Shared",
  terminal: "Terminal",
  crazy_terminal: "Crazy Terminal",
};

export const MODE_DESCRIPTIONS: Record<BattleMode, string> = {
  standard: "Wygrywa gracz z najwyższą łączną wartością dropów.",
  underdog: "Wygrywa gracz z najniższą łączną wartością dropów.",
  shared: "Każdy otrzymuje równą część puli w gotówce (bez itemów).",
  terminal: "Wygrywa gracz z najlepszym dropem w ostatniej skrzynce.",
  crazy_terminal: "Wygrywa gracz z najgorszym dropem w ostatniej skrzynce.",
};

export const BOT_NAMES = ["Bot Alpha", "Bot Beta", "Bot Gamma", "Bot Delta"];
