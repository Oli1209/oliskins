import { formatMoney } from "../lib/format";
import { Wallet } from "lucide-react";

export function BalancePill({ balanceCents }: { balanceCents: number }) {
  return (
    <div className="glass px-4 py-2 flex items-center gap-3 rounded-full border-cyan-500/30 bg-cyan-950/30">
      <Wallet className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
      <span className="font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)] text-lg">
        {formatMoney(balanceCents)}
      </span>
    </div>
  );
}
