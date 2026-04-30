import { Case } from "../lib/types";

function createSvgPlaceholder(color1: string, color2: string, text: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const mockCases: Case[] = [
  {
    id: "case-neon",
    name: "Skrzynia Nocnej Burzy",
    description: "Pełna mrocznych i tajemniczych skórek. Idealna na nocne łowy.",
    priceCents: 150, // #1.50 (Boost = #3.00)
    jesterPriceCents: 3000, // #30.00
    image: createSvgPlaceholder("#1e1b4b", "#4c1d95", "Nocna Burza"),
    drops: [
      { id: "drop-neon-1", name: "Pistolet | Cień", rarity: "common", valueCents: 20, weight: 100, image: createSvgPlaceholder("#3f3f46", "#18181b", "Cień") },
      { id: "drop-neon-2", name: "SMG | Zmierzch", rarity: "common", valueCents: 30, weight: 90, image: createSvgPlaceholder("#3f3f46", "#18181b", "Zmierzch") },
      { id: "drop-neon-3", name: "Karabin | Kwas", rarity: "uncommon", valueCents: 100, weight: 50, image: createSvgPlaceholder("#064e3b", "#065f46", "Kwas") },
      { id: "drop-neon-4", name: "Strzelba | Neon", rarity: "rare", valueCents: 350, weight: 20, image: createSvgPlaceholder("#164e63", "#0891b2", "Neon") },
      { id: "drop-neon-5", name: "Snajperka | Fiolet", rarity: "epic", valueCents: 1200, weight: 5, image: createSvgPlaceholder("#4a044e", "#c026d3", "Fiolet") },
      { id: "drop-neon-6", name: "Nóż | Nocne Ostrze", rarity: "legendary", valueCents: 8500, weight: 1, image: createSvgPlaceholder("#78350f", "#f59e0b", "Nocne Ostrze") },
    ]
  },
  {
    id: "case-cyber",
    name: "Skrzynia Cyber-Punk",
    description: "Wysoka technologia i jaskrawe neony.",
    priceCents: 300, // #3.00 (Boost = #6.00)
    jesterPriceCents: 6500, // #65.00
    image: createSvgPlaceholder("#083344", "#06b6d4", "Cyber-Punk"),
    drops: [
      { id: "drop-cyber-1", name: "Pistolet | Szum", rarity: "common", valueCents: 40, weight: 100, image: createSvgPlaceholder("#3f3f46", "#18181b", "Szum") },
      { id: "drop-cyber-2", name: "SMG | Glitch", rarity: "common", valueCents: 60, weight: 90, image: createSvgPlaceholder("#3f3f46", "#18181b", "Glitch") },
      { id: "drop-cyber-3", name: "Karabin | Sieć", rarity: "uncommon", valueCents: 200, weight: 50, image: createSvgPlaceholder("#064e3b", "#065f46", "Sieć") },
      { id: "drop-cyber-4", name: "Strzelba | Plazma", rarity: "rare", valueCents: 800, weight: 20, image: createSvgPlaceholder("#164e63", "#0891b2", "Plazma") },
      { id: "drop-cyber-5", name: "Snajperka | Kod", rarity: "epic", valueCents: 2500, weight: 5, image: createSvgPlaceholder("#4a044e", "#c026d3", "Kod") },
      { id: "drop-cyber-6", name: "Rękawice | Cyber-Ostrze", rarity: "legendary", valueCents: 15000, weight: 1, image: createSvgPlaceholder("#78350f", "#f59e0b", "Cyber-Ostrze") },
    ]
  },
  {
    id: "case-glass",
    name: "Skrzynia Mrocznego Szkła",
    description: "Kruche, piękne i zabójcze skiny.",
    priceCents: 500, // #5.00 (Boost = #10.00)
    jesterPriceCents: 12000, // #120.00
    image: createSvgPlaceholder("#171717", "#52525b", "Mroczne Szkło"),
    drops: [
      { id: "drop-glass-1", name: "Pistolet | Pył", rarity: "common", valueCents: 80, weight: 100, image: createSvgPlaceholder("#3f3f46", "#18181b", "Pył") },
      { id: "drop-glass-2", name: "SMG | Szron", rarity: "common", valueCents: 120, weight: 90, image: createSvgPlaceholder("#3f3f46", "#18181b", "Szron") },
      { id: "drop-glass-3", name: "Karabin | Odłamek", rarity: "uncommon", valueCents: 400, weight: 50, image: createSvgPlaceholder("#064e3b", "#065f46", "Odłamek") },
      { id: "drop-glass-4", name: "Strzelba | Kryształ", rarity: "rare", valueCents: 1500, weight: 20, image: createSvgPlaceholder("#164e63", "#0891b2", "Kryształ") },
      { id: "drop-glass-5", name: "Snajperka | Zwierciadło", rarity: "epic", valueCents: 4500, weight: 5, image: createSvgPlaceholder("#4a044e", "#c026d3", "Zwierciadło") },
      { id: "drop-glass-6", name: "Nóż | Szklane Serce", rarity: "legendary", valueCents: 30000, weight: 1, image: createSvgPlaceholder("#78350f", "#f59e0b", "Szklane Serce") },
    ]
  }
];
