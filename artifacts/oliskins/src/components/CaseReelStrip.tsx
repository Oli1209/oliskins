import { useEffect, useMemo, useRef, useState } from "react";
import { Case, Drop, InventoryItem } from "../lib/types";
import { rarityColors } from "../lib/rarity";
import { SkinCard } from "./SkinCard";

type Props = {
  caseData: Case;
  winningItem: InventoryItem;
  onResolved: () => void;
  tileSize?: number;
};

const REEL_LENGTH = 45;
const WINNING_INDEX = 35;
const ROLL_DURATION_MS = 5000;

function pickRandomDrop(drops: Drop[]): Drop {
  return drops[Math.floor(Math.random() * drops.length)];
}

export function CaseReelStrip({
  caseData,
  winningItem,
  onResolved,
  tileSize: tileSizeProp,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const targetXRef = useRef<number>(0);
  const resolvedRef = useRef(false);
  const resolveTimerRef = useRef<number | null>(null);

  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const tileSize = tileSizeProp ?? (isMobile ? 102 : 153);
  const tileGap = 10;
  const spacing = tileSize + tileGap;

  const reelItems = useMemo(() => {
    const items: Array<{ key: string; drop: Drop; isWinner: boolean }> = [];
    for (let i = 0; i < REEL_LENGTH; i++) {
      if (i === WINNING_INDEX) {
        items.push({
          key: `winner-${winningItem.instanceId}`,
          drop: {
            id: winningItem.dropId,
            name: winningItem.name,
            rarity: winningItem.rarity,
            image: winningItem.image,
            valueCents: winningItem.valueCents,
            weight: 1,
          },
          isWinner: true,
        });
      } else {
        items.push({
          key: `r-${winningItem.instanceId}-${i}`,
          drop: pickRandomDrop(caseData.drops),
          isWinner: false,
        });
      }
    }
    return items;
  }, [caseData, winningItem]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const containerWidth = viewport.offsetWidth;
    const winnerEl = viewport.querySelector<HTMLElement>(
      "[data-winner='true']"
    );
    const measuredW = winnerEl?.getBoundingClientRect().width ?? tileSize;
    const w = measuredW > 0 ? measuredW : tileSize;

    const rawOffset = (Math.random() * 2 - 1) * (w * 0.48);
    const maxOffset = w * 0.45;
    const offsetPx = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

    const winningCenter = WINNING_INDEX * spacing + tileSize / 2;
    const targetX = containerWidth / 2 - winningCenter + offsetPx;
    targetXRef.current = targetX;

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setTranslateX(targetX);
        setIsAnimating(true);
      });
    });

    resolveTimerRef.current = window.setTimeout(() => {
      if (!resolvedRef.current) {
        resolvedRef.current = true;
        onResolved();
      }
    }, ROLL_DURATION_MS + 150);

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      if (resolveTimerRef.current) window.clearTimeout(resolveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={viewportRef}
      className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-950/60"
      style={{ height: tileSize + 24 }}
    >
      <div
        ref={trackRef}
        className="flex items-center h-full will-change-transform"
        style={{
          gap: `${tileGap}px`,
          paddingLeft: 12,
          paddingRight: 12,
          transform: `translate3d(${translateX}px, 0, 0)`,
          transition: isAnimating
            ? `transform ${ROLL_DURATION_MS}ms cubic-bezier(0.12, 0.8, 0.2, 1)`
            : "none",
        }}
      >
        {reelItems.map(({ key, drop, isWinner }) => {
          const r = rarityColors[drop.rarity];
          return (
            <div
              key={key}
              data-winner={isWinner ? "true" : undefined}
              className={`shrink-0 relative rounded-lg border-2 overflow-hidden ${r.border}`}
              style={{ width: tileSize, height: tileSize }}
            >
              <SkinCard image={drop.image} name={drop.name} rarity={drop.rarity} />
              {/* Name badge at bottom */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent px-1.5 pt-3 pb-1 pointer-events-none">
                <p className={`text-[9px] font-bold uppercase tracking-wider truncate ${r.text}`}>
                  {drop.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.95),0_0_28px_rgba(34,211,238,0.5)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950 to-transparent" />
    </div>
  );
}
