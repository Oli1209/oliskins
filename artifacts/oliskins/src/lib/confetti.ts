import confetti from "canvas-confetti";
import type { InventoryItem } from "./types";

const GOLD_COLORS = ["#FFD700", "#FFC107", "#FFB300", "#FFE082", "#22D3EE"];

const DURATION_MS = 2500;
const BURST_INTERVAL_MS = 220;

/**
 * Decides whether the just-opened items deserve celebration confetti.
 * Triggers on extraordinary or covert drops, or when any item value is at
 * least 5x the case price (when known).
 */
export function shouldFireForItems(
  items: InventoryItem[],
  casePriceCents?: number
): boolean {
  if (items.length === 0) return false;
  for (const it of items) {
    if (it.rarity === "extraordinary" || it.rarity === "covert") return true;
    if (
      casePriceCents !== undefined &&
      casePriceCents > 0 &&
      it.valueCents >= casePriceCents * 5
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Fires a gentle gold confetti burst from a point near the bottom-center
 * of the viewport, spreading up-left and up-right. Lasts ~2.5s.
 */
export function fireGoldConfetti(): void {
  const end = Date.now() + DURATION_MS;

  const originX = 0.5;
  const originY = 0.85;

  const baseOpts: confetti.Options = {
    particleCount: 14,
    startVelocity: 38,
    gravity: 0.55,
    decay: 0.92,
    ticks: 220,
    scalar: 0.95,
    colors: GOLD_COLORS,
    origin: { x: originX, y: originY },
    disableForReducedMotion: true,
  };

  const fireBurst = () => {
    confetti({
      ...baseOpts,
      angle: 70,
      spread: 55,
    });
    confetti({
      ...baseOpts,
      angle: 110,
      spread: 55,
    });
  };

  fireBurst();
  const interval = window.setInterval(() => {
    if (Date.now() >= end) {
      window.clearInterval(interval);
      return;
    }
    fireBurst();
  }, BURST_INTERVAL_MS);
}
