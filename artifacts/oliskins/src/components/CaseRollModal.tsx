import { useEffect, useMemo, useRef, useState } from "react";
import { Case, Drop, InventoryItem } from "../lib/types";
import { formatMoney } from "../lib/format";
import { rarityColors } from "../lib/rarity";

type Props = {
  caseData: Case;
  winningItem: InventoryItem;
  onClose: () => void;
  onOpenAgain: () => void;
  onGoToInventory: () => void;
};

const REEL_LENGTH = 45;
const WINNING_INDEX = 35;
const ROLL_DURATION_MS = 5000;

function pickRandomDrop(drops: Drop[]): Drop {
  return drops[Math.floor(Math.random() * drops.length)];
}

export function CaseRollModal({
  caseData,
  winningItem,
  onClose,
  onOpenAgain,
  onGoToInventory,
}: Props) {
  const [phase, setPhase] = useState<"rolling" | "result">("rolling");
  const [translateX, setTranslateX] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const tileSize = isMobile ? 120 : 180;
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
          key: `r-${i}`,
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

    const winnerEl = viewport.querySelector<HTMLElement>("[data-winner='true']");
    const measuredW = winnerEl?.getBoundingClientRect().width ?? tileSize;
    const w = measuredW > 0 ? measuredW : tileSize;

    const r = Math.random();
    const biased =
      Math.random() < 0.5 ? Math.sqrt(r) : 1 - Math.sqrt(r);
    const u = biased * 2 - 1;
    const rawOffset = u * (w * 0.35);
    const maxOffset = w * 0.4;
    const offsetPx = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

    const winningCenter = WINNING_INDEX * spacing + tileSize / 2;
    const targetX = containerWidth / 2 - winningCenter + offsetPx;

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setTranslateX(targetX);
        setIsAnimating(true);
      });
    });

    const resultTimer = window.setTimeout(() => {
      setPhase("result");
    }, ROLL_DURATION_MS + 150);

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
      window.clearTimeout(resultTimer);
    };
  }, [spacing, tileSize]);

  const winnerRarity = rarityColors[winningItem.rarity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-strong w-full max-w-3xl rounded-2xl p-6 sm:p-8 border-cyan-500/40 shadow-[0_0_60px_rgba(34,211,238,0.18)] animate-in zoom-in-95 duration-300">
        <div className="flex items-baseline justify-between gap-3 mb-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {phase === "rolling" ? "Otwieranie..." : "Wypadło:"}
            </p>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 truncate">
              {caseData.name}
            </h2>
          </div>
          <span className="text-cyan-400 font-mono text-base sm:text-lg whitespace-nowrap">
            {formatMoney(caseData.priceCents)}
          </span>
        </div>

        {phase === "rolling" && (
          <div className="relative">
            <div
              ref={viewportRef}
              className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-slate-950/60"
              style={{ height: tileSize + 24 }}
            >
              <div
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
                      className={`shrink-0 relative rounded-lg border-2 overflow-hidden bg-slate-900/80 ${r.border}`}
                      style={{ width: tileSize, height: tileSize }}
                    >
                      <img
                        src={drop.image}
                        alt={drop.name}
                        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent px-1.5 pt-3 pb-1">
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

            <p className="text-center text-slate-500 text-xs uppercase tracking-[0.3em] mt-4">
              Otwieranie...
            </p>
          </div>
        )}

        {phase === "result" && (
          <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
            <div
              className={`my-4 sm:my-6 relative w-44 h-44 sm:w-56 sm:h-56 rounded-xl flex items-center justify-center overflow-hidden border-2 bg-slate-950 ${winnerRarity.border} ${winnerRarity.glow}`}
            >
              <img
                src={winningItem.image}
                alt={winningItem.name}
                className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-4">
                <span
                  className={`text-xs font-black uppercase tracking-widest ${winnerRarity.text} drop-shadow-md`}
                >
                  {winningItem.rarity}
                </span>
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-100 mb-2">
              {winningItem.name}
            </h3>
            <div className="glass px-5 py-1.5 mb-6 inline-flex">
              <p className="text-cyan-400 font-mono text-xl sm:text-2xl font-bold">
                {formatMoney(winningItem.valueCents)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button onClick={onOpenAgain} className="flex-1 neon-button">
                Otwórz ponownie
              </button>
              <button
                onClick={onGoToInventory}
                className="flex-1 py-3 px-5 rounded-lg font-semibold text-slate-200 border border-cyan-500/20 bg-slate-900/60 hover:border-cyan-400/50 hover:text-cyan-200 transition-colors"
              >
                Idź do ekwipunku
              </button>
              <button
                onClick={onClose}
                className="sm:w-auto py-3 px-5 rounded-lg font-semibold text-slate-400 hover:text-cyan-300 transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
