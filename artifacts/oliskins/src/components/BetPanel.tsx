import { formatMoney } from "../lib/format";

type Props = {
  betInput: string;
  onBetChange: (v: string) => void;
  balanceCents: number;
  disabled: boolean;
  error: string | null;
};

export function BetPanel({ betInput, onBetChange, balanceCents, disabled, error }: Props) {
  const addAmount = (deltaCents: number) => {
    const current = parseFloat(betInput.replace(",", ".")) || 0;
    const next = Math.max(0, current + deltaCents / 100);
    onBetChange(next.toFixed(2));
  };

  const setMax = () => {
    onBetChange((balanceCents / 100).toFixed(2));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="bet-input"
          className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
        >
          Stawka
        </label>
        <span className="text-[11px] font-mono text-slate-500">
          Balans:{" "}
          <span className="text-cyan-300 font-bold">{formatMoney(balanceCents)}</span>
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-black text-base select-none">
            $
          </span>
          <input
            id="bet-input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={betInput}
            onChange={(e) => onBetChange(e.target.value)}
            disabled={disabled}
            className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-slate-950/70 border border-cyan-500/20 text-slate-100 font-mono text-base focus:outline-none focus:border-cyan-400/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        <div className="flex gap-1.5">
          {([100, 500] as const).map((deltaCents) => (
            <button
              key={deltaCents}
              type="button"
              onClick={() => addAmount(deltaCents)}
              disabled={disabled}
              className="px-2.5 h-full rounded-lg border border-cyan-500/25 bg-slate-900/60 text-cyan-300 text-xs font-bold hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              +{formatMoney(deltaCents)}
            </button>
          ))}
          <button
            type="button"
            onClick={setMax}
            disabled={disabled || balanceCents === 0}
            className="px-2.5 h-full rounded-lg border border-cyan-500/25 bg-slate-900/60 text-cyan-300 text-xs font-bold hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            MAX
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-400/90 text-xs font-semibold">{error}</p>
      )}
    </div>
  );
}
