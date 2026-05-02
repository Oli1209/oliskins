import { useEffect, useMemo, useRef, useState } from "react";
import type { Drop } from "../lib/types";
import type { BattleDrop } from "../lib/battleTypes";
import type { EffectiveDrop } from "../lib/chances";
import { rarityColors } from "../lib/rarity";
import { formatMoney } from "../lib/format";

// ─── Vertical Reel Strip ──────────────────────────────────────────────────────

type Props = {
  fillerDrops: (Drop | EffectiveDrop)[];
  winner: BattleDrop;
  durationMs?: number;
  tileSize?: number;
};

const REEL_LENGTH = 32;
const WINNING_INDEX = 24;
const TILE_H = 68;
const TILE_GAP = 5;
const SPACING = TILE_H + TILE_GAP;
const VIEWPORT_H = 360;

// The strip scrolls upward: starts at translateY=0 (showing items 0–4 at top),
// animates to winning tile centered in the viewport.
const winnerCenter = WINNING_INDEX * SPACING + TILE_H / 2;
const BASE_TARGET_Y = VIEWPORT_H / 2 - winnerCenter; // negative (scroll up)

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function BattleReelStrip({
  fillerDrops,
  winner,
  durationMs = 3200,
}: Props) {
  const [translateY, setTranslateY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const reelItems = useMemo(() => {
    const safe = fillerDrops.length > 0
      ? fillerDrops
      : [{ id: "fb", name: "?", rarity: "common" as const, image: "", valueCents: 0, weight: 1 }];

    const items: Array<{ key: string; drop: Drop; isWinner: boolean }> = [];
    for (let i = 0; i < REEL_LENGTH; i++) {
      if (i === WINNING_INDEX) {
        items.push({
          key: `w-${winner.instanceId}`,
          drop: {
            id: winner.dropId,
            name: winner.name,
            rarity: winner.rarity,
            image: winner.image,
            valueCents: winner.valueCents,
            weight: 1,
          },
          isWinner: true,
        });
      } else {
        items.push({
          key: `r${i}-${winner.instanceId}`,
          drop: pickRandom(safe) as Drop,
          isWinner: false,
        });
      }
    }
    return items;
  }, [winner, fillerDrops]);

  useEffect(() => {
    // Small random offset so each participant's reel stops in a slightly different spot
    const rawOffset = (Math.random() * 2 - 1) * TILE_H * 0.25;
    const targetY = BASE_TARGET_Y + rawOffset;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setTranslateY(targetY);
        setIsAnimating(true);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []); // eslint-disable-line

  const rc = rarityColors[winner.rarity];

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-cyan-500/25 bg-slate-950/80 w-full"
      style={{ height: VIEWPORT_H }}
    >
      {/* Tile strip (vertical flex column) */}
      <div
        className="flex flex-col will-change-transform absolute top-0 left-0 right-0"
        style={{
          gap: TILE_GAP,
          paddingTop: 6,
          transform: `translate3d(0, ${translateY}px, 0)`,
          transition: isAnimating
            ? `transform ${durationMs}ms cubic-bezier(0.08, 0.82, 0.17, 1)`
            : "none",
        }}
      >
        {reelItems.map(({ key, drop, isWinner }) => {
          const r = rarityColors[drop.rarity];
          return (
            <div
              key={key}
              data-winner={isWinner ? "true" : undefined}
              className={`mx-1.5 shrink-0 flex items-center gap-2.5 rounded-lg border-2 overflow-hidden bg-slate-900/90 px-2 ${r.border} ${
                isWinner ? `shadow-lg` : "opacity-80"
              }`}
              style={{ height: TILE_H }}
            >
              {drop.image ? (
                <img
                  src={drop.image}
                  alt={drop.name}
                  className="w-12 h-12 rounded-md object-cover mix-blend-screen shrink-0"
                />
              ) : (
                <div className={`w-12 h-12 rounded-md border ${r.border} shrink-0`} />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate leading-tight ${r.text}`}>{drop.name}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{formatMoney(drop.valueCents)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Crosshair (horizontal center line) */}
      <div
        className="pointer-events-none absolute inset-x-0 left-0 right-0 h-[2px] bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95),0_0_28px_rgba(34,211,238,0.5)]"
        style={{ top: VIEWPORT_H / 2 - 1 }}
      />
      {/* Fade top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950 to-transparent" />
      {/* Fade bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* Winner rarity label (top-right badge) */}
      <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${rc.bg} ${rc.text} border ${rc.border}`}>
        {winner.rarity}
      </div>
    </div>
  );
}

// ─── Revealed drop tile (compact, for the 3-col grid) ─────────────────────────

export function RevealedDropCard({ drop }: { drop: BattleDrop }) {
  const rc = rarityColors[drop.rarity];
  return (
    <div className={`flex flex-col items-center rounded-lg border ${rc.border} bg-slate-900/70 p-1.5 gap-1`}>
      <div className={`w-full aspect-square rounded-md border ${rc.border} bg-slate-950/60 overflow-hidden relative`} style={{ maxHeight: 52 }}>
        {drop.image && (
          <img src={drop.image} alt={drop.name} className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80" />
        )}
      </div>
      <p className={`text-[9px] font-bold text-center w-full truncate leading-tight ${rc.text}`}>{drop.name}</p>
      <p className="text-[9px] font-mono text-slate-300">{formatMoney(drop.valueCents)}</p>
      <p className="text-[9px] text-slate-500">{drop.chanceAtDrop.toFixed(2)}%</p>
    </div>
  );
}
