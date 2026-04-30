import { FreeCase } from "../lib/types";

function svg(color1: string, color2: string, text: string) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" />
        <stop offset="100%" stop-color="${color2}" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold">${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
}

export const freeCases: FreeCase[] = [
  {
    id: "free-tier-1",
    tier: 1,
    name: "Darmowa Skrzynia: Iskra",
    description: "Pierwsze kroki w mrocznym świecie. Skromne nagrody dla początkujących.",
    requiredLevel: 1,
    image: svg("#0f172a", "#1e293b", "Iskra"),
    drops: [
      { id: "free1-1", name: "Pistolet | Pył Ulic", rarity: "common", valueCents: 10, weight: 100, image: svg("#3f3f46", "#18181b", "Pył Ulic") },
      { id: "free1-2", name: "SMG | Cichy Strzał", rarity: "common", valueCents: 20, weight: 80, image: svg("#3f3f46", "#18181b", "Cichy Strzał") },
      { id: "free1-3", name: "Karabin | Ruda", rarity: "uncommon", valueCents: 50, weight: 30, image: svg("#064e3b", "#065f46", "Ruda") },
      { id: "free1-4", name: "Strzelba | Iskra", rarity: "rare", valueCents: 150, weight: 8, image: svg("#164e63", "#0891b2", "Iskra") },
    ],
  },
  {
    id: "free-tier-2",
    tier: 2,
    name: "Darmowa Skrzynia: Mgła",
    description: "Tajemnice nocnych zaułków. Lepsze łupy dla zaprawionych graczy.",
    requiredLevel: 20,
    image: svg("#1e1b4b", "#312e81", "Mgła"),
    drops: [
      { id: "free2-1", name: "Pistolet | Smog", rarity: "common", valueCents: 30, weight: 100, image: svg("#3f3f46", "#18181b", "Smog") },
      { id: "free2-2", name: "SMG | Mgielny Cień", rarity: "common", valueCents: 50, weight: 80, image: svg("#3f3f46", "#18181b", "Mgielny Cień") },
      { id: "free2-3", name: "Karabin | Wir", rarity: "uncommon", valueCents: 120, weight: 35, image: svg("#064e3b", "#065f46", "Wir") },
      { id: "free2-4", name: "Strzelba | Mgielne Echo", rarity: "rare", valueCents: 400, weight: 10, image: svg("#164e63", "#0891b2", "Mgielne Echo") },
      { id: "free2-5", name: "Snajperka | Indygo", rarity: "epic", valueCents: 1200, weight: 2, image: svg("#4a044e", "#c026d3", "Indygo") },
    ],
  },
  {
    id: "free-tier-3",
    tier: 3,
    name: "Darmowa Skrzynia: Zorza",
    description: "Neonowe blaski na horyzoncie. Solidne dropy dla weteranów.",
    requiredLevel: 30,
    image: svg("#0c4a6e", "#7c3aed", "Zorza"),
    drops: [
      { id: "free3-1", name: "Pistolet | Pulsar", rarity: "common", valueCents: 70, weight: 90, image: svg("#3f3f46", "#18181b", "Pulsar") },
      { id: "free3-2", name: "SMG | Polarna Noc", rarity: "uncommon", valueCents: 200, weight: 60, image: svg("#064e3b", "#065f46", "Polarna Noc") },
      { id: "free3-3", name: "Karabin | Aurora", rarity: "uncommon", valueCents: 350, weight: 35, image: svg("#064e3b", "#065f46", "Aurora") },
      { id: "free3-4", name: "Strzelba | Zorza", rarity: "rare", valueCents: 900, weight: 12, image: svg("#164e63", "#0891b2", "Zorza") },
      { id: "free3-5", name: "Snajperka | Świt", rarity: "epic", valueCents: 2500, weight: 3, image: svg("#4a044e", "#c026d3", "Świt") },
    ],
  },
  {
    id: "free-tier-4",
    tier: 4,
    name: "Darmowa Skrzynia: Inferno",
    description: "Ogień i stal. Tylko dla doświadczonych łowców skinów.",
    requiredLevel: 40,
    image: svg("#7c2d12", "#dc2626", "Inferno"),
    drops: [
      { id: "free4-1", name: "Pistolet | Żar", rarity: "uncommon", valueCents: 250, weight: 80, image: svg("#064e3b", "#065f46", "Żar") },
      { id: "free4-2", name: "SMG | Pożoga", rarity: "uncommon", valueCents: 500, weight: 50, image: svg("#064e3b", "#065f46", "Pożoga") },
      { id: "free4-3", name: "Karabin | Płomień", rarity: "rare", valueCents: 1200, weight: 25, image: svg("#164e63", "#0891b2", "Płomień") },
      { id: "free4-4", name: "Strzelba | Magma", rarity: "rare", valueCents: 2200, weight: 12, image: svg("#164e63", "#0891b2", "Magma") },
      { id: "free4-5", name: "Snajperka | Inferno", rarity: "epic", valueCents: 5500, weight: 4, image: svg("#4a044e", "#c026d3", "Inferno") },
      { id: "free4-6", name: "Nóż | Czerwone Ostrze", rarity: "legendary", valueCents: 25000, weight: 1, image: svg("#78350f", "#f59e0b", "Czerwone Ostrze") },
    ],
  },
  {
    id: "free-tier-5",
    tier: 5,
    name: "Darmowa Skrzynia: Pustka",
    description: "Najwyższy poziom. Legendarne nagrody dla mistrzów otwierania.",
    requiredLevel: 50,
    image: svg("#020617", "#1e3a8a", "Pustka"),
    drops: [
      { id: "free5-1", name: "Pistolet | Próżnia", rarity: "uncommon", valueCents: 600, weight: 70, image: svg("#064e3b", "#065f46", "Próżnia") },
      { id: "free5-2", name: "SMG | Czarna Dziura", rarity: "rare", valueCents: 1800, weight: 50, image: svg("#164e63", "#0891b2", "Czarna Dziura") },
      { id: "free5-3", name: "Karabin | Eter", rarity: "rare", valueCents: 3500, weight: 25, image: svg("#164e63", "#0891b2", "Eter") },
      { id: "free5-4", name: "Strzelba | Singularność", rarity: "epic", valueCents: 7500, weight: 10, image: svg("#4a044e", "#c026d3", "Singularność") },
      { id: "free5-5", name: "Snajperka | Pustka", rarity: "epic", valueCents: 12000, weight: 5, image: svg("#4a044e", "#c026d3", "Pustka") },
      { id: "free5-6", name: "Rękawice | Mroczna Materia", rarity: "legendary", valueCents: 45000, weight: 2, image: svg("#78350f", "#f59e0b", "Mroczna Materia") },
      { id: "free5-7", name: "Nóż | Kosmiczne Ostrze", rarity: "legendary", valueCents: 80000, weight: 1, image: svg("#78350f", "#f59e0b", "Kosmiczne Ostrze") },
    ],
  },
];
