import { Rarity } from "./types";

export const rarityColors: Record<Rarity, { text: string; bg: string; border: string; glow: string }> = {
  common: {
    text: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/50",
    glow: "shadow-[0_0_15px_rgba(148,163,184,0.3)]",
  },
  uncommon: {
    text: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/50",
    glow: "shadow-[0_0_15px_rgba(74,222,128,0.3)]",
  },
  rare: {
    text: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/50",
    glow: "shadow-[0_0_15px_rgba(96,165,250,0.3)]",
  },
  epic: {
    text: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/50",
    glow: "shadow-[0_0_15px_rgba(192,132,252,0.3)]",
  },
  legendary: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/50",
    glow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]",
  },
};
