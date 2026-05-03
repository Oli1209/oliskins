import type { Rarity } from "../lib/types";
import { rarityColors } from "../lib/rarity";

type SkinCardProps = {
  image: string;
  name: string;
  rarity: Rarity;
  /** Extra classes applied to the root wrapper (e.g. for sizing). */
  className?: string;
};

/**
 * Reusable "cutout" skin image tile.
 *
 * Renders:
 *  1. A dark glass background
 *  2. A soft radial rarity-colored glow accent behind the weapon
 *  3. The weapon image — centered, object-contain with padding (not full-bleed)
 *
 * The component fills its parent container completely; the parent controls
 * absolute dimensions (width / height / aspect-ratio).
 */
export function SkinCard({ image, name, rarity, className = "" }: SkinCardProps) {
  const r = rarityColors[rarity];
  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-950/70 flex items-center justify-center ${className}`}>
      {/* Rarity accent — soft radial glow in rarity colour */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 75% 65% at 50% 55%, ${r.accentHex}28 0%, ${r.accentHex}08 50%, transparent 75%)`,
        }}
      />
      {/* Weapon image — centered cutout with padding */}
      <img
        src={image}
        alt={name}
        className="relative z-10 w-full h-full object-contain"
        style={{ padding: "12%" }}
        draggable={false}
      />
    </div>
  );
}
