import { useEffect, useMemo, useRef, useState } from "react";
import type { Drop } from "../lib/types";
import type { BattleDrop } from "../lib/battleTypes";
import { rarityColors } from "../lib/rarity";
import { formatMoney } from "../lib/format";

type Props = {
  fillerDrops: Drop[];
  winner: BattleDrop;
  durationMs?: number;
  tileSize?: number;
};

const REEL_LENGTH = 30;
const WINNING_INDEX = 22;
const DEFAULT_DURATION = 3000;

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function BattleReelStrip({
  fillerDrops,
  winner,
  durationMs = DEFAULT_DURATION,
  tileSize = 90,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const tileGap = 8;
  const spacing = tileSize + tileGap;

  const reelItems = useMemo(() => {
    const safe = fillerDrops.length > 0 ? fillerDrops : [
      { id: "fb", name: "?", rarity: "common" as const, image: "", valueCents: 0, weight: 1 },
    ];
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
          drop: pickRandom(safe),
          isWinner: false,
        });
      }
    }
    return items;
  }, [winner, fillerDrops]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const containerWidth = vp.offsetWidth;
    const winnerCenter = WINNING_INDEX * spacing + tileSize / 2;
    const rawOffset = (Math.random() * 2 - 1) * tileSize * 0.3;
    const targetX = containerWidth / 2 - winnerCenter + rawOffset;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setTranslateX(targetX);
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
    <div className="space-y-2">
      {/* Reel viewport */}
      <div
        ref={viewportRef}
        className="relative overflow-hidden rounded-xl border border-cyan-500/25 bg-slate-950/70"
        style={{ height: tileSize + 20 }}
      >
        <div
          className="flex items-center h-full will-change-transform"
          style={{
            gap: `${tileGap}px`,
            paddingLeft: 8,
            paddingRight: 8,
            transform: `translate3d(${translateX}px, 0, 0)`,
            transition: isAnimating
              ? `transform ${durationMs}ms cubic-bezier(0.12, 0.8, 0.2, 1)`
              : "none",
          }}
        >
          {reelItems.map(({ key, drop, isWinner }) => {
            const r = rarityColors[drop.rarity];
            return (
              <div
                key={key}
                data-winner={isWinner ? "true" : undefined}
                className={`shrink-0 relative rounded-lg border-2 overflow-hidden bg-slate-900/80 ${r.border} ${
                  isWinner ? `shadow-lg shadow-${r.text.replace("text-", "")}/30` : ""
                }`}
                style={{ width: tileSize, height: tileSize }}
              >
                {drop.image && (
                  <img
                    src={drop.image}
                    alt={drop.name}
                    className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent px-1 pb-0.5 pt-2">
                  <p className={`text-[8px] font-bold truncate ${r.text}`}>{drop.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Crosshair */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95),0_0_28px_rgba(34,211,238,0.5)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950 to-transparent" />
      </div>

      {/* Winner label shown below reel while spinning */}
      <div className={`text-center text-xs font-bold animate-pulse ${rc.text}`}>
        Losowanie…
      </div>
    </div>
  );
}

// ─── Revealed drop card (after reel finishes) ─────────────────────────────────

export function RevealedDropCard({ drop }: { drop: BattleDrop }) {
  const rc = rarityColors[drop.rarity];
  return (
    <div className={`flex items-center gap-2.5 rounded-lg border ${rc.border} bg-slate-900/70 p-2`}>
      <div className={`w-10 h-10 shrink-0 rounded-md border ${rc.border} bg-slate-950/60 overflow-hidden relative`}>
        {drop.image && (
          <img src={drop.image} alt={drop.name} className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate ${rc.text}`}>{drop.name}</p>
        <p className="text-[10px] text-slate-500 font-mono">{formatMoney(drop.valueCents)}</p>
      </div>
    </div>
  );
}
