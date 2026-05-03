import type { Rarity } from "./types";

export const RARITY_ORDER: Rarity[] = [
  "consumer",
  "industrial",
  "mil_spec",
  "restricted",
  "classified",
  "covert",
  "extraordinary",
];

export function rarityLabelPl(rarity: Rarity): string {
  switch (rarity) {
    case "consumer":      return "Consumer";
    case "industrial":    return "Industrial";
    case "mil_spec":      return "Mil-Spec";
    case "restricted":    return "Restricted";
    case "classified":    return "Classified";
    case "covert":        return "Covert";
    case "extraordinary": return "★ Extraordinary";
  }
}

const LEGACY_MAP: Record<string, Rarity> = {
  common:    "consumer",
  uncommon:  "industrial",
  rare:      "mil_spec",
  epic:      "restricted",
  legendary: "covert",
  mythical:  "extraordinary",
};

export function migrateRarity(raw: string): Rarity {
  if (raw in LEGACY_MAP) return LEGACY_MAP[raw];
  if (RARITY_ORDER.includes(raw as Rarity)) return raw as Rarity;
  return "consumer";
}

export const rarityColors: Record<
  Rarity,
  { text: string; bg: string; border: string; glow: string; accentHex: string }
> = {
  consumer: {
    text: "text-slate-300",
    bg: "bg-slate-400/10",
    border: "border-slate-400/40",
    glow: "shadow-[0_0_12px_rgba(176,195,217,0.2)]",
    accentHex: "#b0c3d9",
  },
  industrial: {
    text: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-500/50",
    glow: "shadow-[0_0_14px_rgba(94,152,217,0.3)]",
    accentHex: "#5e98d9",
  },
  mil_spec: {
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
    glow: "shadow-[0_0_16px_rgba(75,105,255,0.35)]",
    accentHex: "#4b69ff",
  },
  restricted: {
    text: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/50",
    glow: "shadow-[0_0_18px_rgba(136,71,255,0.4)]",
    accentHex: "#8847ff",
  },
  classified: {
    text: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/50",
    glow: "shadow-[0_0_20px_rgba(211,44,230,0.45)]",
    accentHex: "#d32ce6",
  },
  covert: {
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/50",
    glow: "shadow-[0_0_22px_rgba(235,75,75,0.5)]",
    accentHex: "#eb4b4b",
  },
  extraordinary: {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/50",
    glow: "shadow-[0_0_28px_rgba(228,174,57,0.65)]",
    accentHex: "#e4ae39",
  },
};
