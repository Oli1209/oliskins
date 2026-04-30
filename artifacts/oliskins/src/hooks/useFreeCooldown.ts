import { useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { FREE_CASE_COOLDOWN_MS } from "../lib/types";

/**
 * Live tick (1s) of the global free-case cooldown.
 * Returns ms remaining until next free open is available, plus a `ready` flag.
 */
export function useFreeCooldown() {
  const lastFreeOpenAt = useGameStore((s) => s.lastFreeOpenAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = lastFreeOpenAt === null ? Infinity : now - lastFreeOpenAt;
  const msLeft = Math.max(0, FREE_CASE_COOLDOWN_MS - elapsed);
  const ready = lastFreeOpenAt === null || elapsed >= FREE_CASE_COOLDOWN_MS;

  return { msLeft, ready };
}

export function formatCooldown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
