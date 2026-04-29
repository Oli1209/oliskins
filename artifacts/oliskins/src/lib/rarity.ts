import { Rarity } from "./types";

export const rarityColors: Record<Rarity, { text: string; bg: string; border: string; glow: string }> = {
  common: {
    text: "text-zinc-400",
    bg: "bg-zinc-400/10",
    border: "border-zinc-400/50",
    glow: "shadow-[0_0_15px_rgba(161,161,170,0.3)]",
  },
  uncommon: {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/50",
    glow: "shadow-[0_0_15px_rgba(52,211,153,0.3)]",
  },
  rare: {
    text: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/50",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.3)]",
  },
  epic: {
    text: "text-fuchsia-400",
    bg: "bg-fuchsia-400/10",
    border: "border-fuchsia-400/50",
    glow: "shadow-[0_0_15px_rgba(232,121,249,0.3)]",
  },
  legendary: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/50",
    glow: "shadow-[0_0_15px_rgba(251,191,36,0.3)]",
  },
};
