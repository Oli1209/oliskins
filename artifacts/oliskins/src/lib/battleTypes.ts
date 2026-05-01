import type { Mode } from "./chances";
import type { Rarity } from "./types";

export type BattleMode =
  | "standard"
  | "underdog"
  | "shared"
  | "terminal"
  | "crazy_terminal";

export type BattleStatus = "waiting" | "in_progress" | "completed";

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
}

export interface BattleResult {
  dropsByParticipant: Record<string, BattleDrop[]>;
  totalValueByParticipant: Record<string, number>;
  lastGroupDropsByParticipant: Record<string, BattleDrop[]>;
  winnerId: string | null;
  claimed: boolean;
}

export interface Battle {
  id: string;
  createdAt: number;
  status: BattleStatus;
  mode: BattleMode;
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
  shared: "Każdy zatrzymuje własne dropy (brak zwycięzcy).",
  terminal: "Wygrywa gracz z najlepszym dropem w ostatniej skrzynce.",
  crazy_terminal: "Wygrywa gracz z najgorszym dropem w ostatniej skrzynce.",
};

export const BOT_NAMES = ["Bot Alpha", "Bot Beta", "Bot Gamma", "Bot Delta"];
