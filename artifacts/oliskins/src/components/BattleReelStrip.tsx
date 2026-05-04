import { useEffect, useMemo, useState } from "react";
import type { Drop } from "../lib/types";
import type { BattleDrop } from "../lib/battleTypes";
import type { EffectiveDrop } from "../lib/chances";
import { rarityColors } from "../lib/rarity";
import { formatMoney } from "../lib/format";
import { SkinCard } from "./SkinCard";

// ─── Vertical Reel Strip ──────────────────────────────────────────────────────
// Tiles are image-only (no text, no rarity badge) to avoid spoilers.
// The reel is taller and tiles are proportionally larger for a cleaner
// "card-like" look closer to reference screenshots.

type Props = {
  fillerDrops: (Drop | EffectiveDrop)[];
  winner: BattleDrop;
  durationMs?: number;
};

const REEL_LENGTH = 32;
const WINNING_INDEX = 24;
const TILE_H = 164;          // taller tiles — more card-like
const TILE_GAP = 8;
const SPACING = TILE_H + TILE_GAP;
const VIEWPORT_H = 468;      // taller viewport — more tiles visible, less cramped

const winnerCenter = WINNING_INDEX * SPACING + TILE_H / 2;
const BASE_TARGET_Y = VIEWPORT_H / 2 - winnerCenter;

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function BattleReelStrip({ fillerDrops, winner, durationMs = 3200 }: Props) {
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Small random offset so the winner tile doesn't always stop dead-centre
    const rawOffset = (Math.random() * 2 - 1) * TILE_H * 0.18;
    const targetY = BASE_TARGET_Y + rawOffset;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setTranslateY(targetY);
        setIsAnimating(true);
      });
    });
    return () => { cancelAnimationFrame(raf1); if (raf2) cancelAnimationFrame(raf2); };
  }, []); // eslint-disable-line

  const reelItems = useMemo(() => {
    const safe = fillerDrops.length > 0
      ? fillerDrops
      : [{ id: "fb", name: "?", rarity: "consumer" as const, image: "", valueCents: 0, weight: 1 }];

    return Array.from({ length: REEL_LENGTH }, (_, i) => {
      if (i === WINNING_INDEX) {
        return {
          key: `w-${winner.instanceId}`,
          drop: {
            id: winner.dropId, name: winner.name, rarity: winner.rarity,
            image: winner.image, valueCents: winner.valueCents, weight: 1,
          } as Drop,
          isWinner: true,
        };
      }
      return { key: `r${i}-${winner.instanceId}`, drop: pickRandom(safe) as Drop, isWinner: false };
    });
  }, [winner, fillerDrops]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-slate-700/40 bg-slate-950/90 w-full"
      style={{ height: VIEWPORT_H }}
    >
      {/* ── Scrolling strip ── */}
      <div
        className="flex flex-col will-change-transform absolute top-0 left-0 right-0"
        style={{
          gap: TILE_GAP,
          paddingTop: 6,
          transform: `translate3d(0,${translateY}px,0)`,
          transition: isAnimating
            ? `transform ${durationMs}ms cubic-bezier(0.08,0.82,0.17,1)`
            : "none",
        }}
      >
        {reelItems.map(({ key, drop, isWinner }) => {
          const r = rarityColors[drop.rarity];
          return (
            <div
              key={key}
              className={`mx-2 shrink-0 relative rounded-xl border-2 overflow-hidden transition-none ${r.border} ${
                isWinner ? "brightness-110" : "opacity-55"
              }`}
              style={{ height: TILE_H }}
            >
              {/* Image-only — NO name/price/rarity text (anti-spoiler) */}
              <SkinCard image={drop.image} name={drop.name} rarity={drop.rarity} />

              {/* Thin rarity accent stripe at bottom — subtle, doesn't spoil outcome */}
              <div
                className={`absolute inset-x-0 bottom-0 h-1 ${r.bg} opacity-60 pointer-events-none`}
              />
            </div>
          );
        })}
      </div>

      {/* ── Centre crosshair ── */}
      <div
        className="pointer-events-none absolute inset-x-0 h-[2px] bg-cyan-300"
        style={{
          top: VIEWPORT_H / 2 - 1,
          boxShadow: "0 0 12px rgba(34,211,238,0.9), 0 0 28px rgba(34,211,238,0.45)",
        }}
      />
      {/* Crosshair side triangles for clarity */}
      <div
        className="pointer-events-none absolute left-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-cyan-400"
        style={{ top: VIEWPORT_H / 2 - 6 }}
      />
      <div
        className="pointer-events-none absolute right-0 border-y-[6px] border-y-transparent border-r-[10px] border-r-cyan-400"
        style={{ top: VIEWPORT_H / 2 - 6 }}
      />

      {/* ── Edge fades (top + bottom) ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950 via-slate-950/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
    </div>
  );
}

// ─── Revealed drop tile (3-col grid, shown after animation) ──────────────────

export function RevealedDropCard({ drop }: { drop: BattleDrop }) {
  const rc = rarityColors[drop.rarity];
  return (
    <div className={`flex flex-col items-center rounded-lg border ${rc.border} bg-slate-900/70 p-1.5 gap-1`}>
      <div
        className={`w-full aspect-square rounded-md border ${rc.border} overflow-hidden relative`}
        style={{ maxHeight: 52 }}
      >
        <SkinCard image={drop.image} name={drop.name} rarity={drop.rarity} />
      </div>
      <p className={`text-[9px] font-bold text-center w-full truncate leading-tight ${rc.text}`}>{drop.name}</p>
      <p className="text-[9px] font-mono text-slate-300">{formatMoney(drop.valueCents)}</p>
      <p className="text-[9px] text-slate-500">{drop.chanceAtDrop.toFixed(2)}%</p>
    </div>
  );
}
