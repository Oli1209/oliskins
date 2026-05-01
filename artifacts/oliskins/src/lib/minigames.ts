/** Parse a user-entered bet string to integer cents, or null if invalid. */
export function parseBetToCents(input: string): number | null {
  const cleaned = input.trim().replace(",", ".");
  const val = parseFloat(cleaned);
  if (!isFinite(val) || val <= 0) return null;
  const cents = Math.round(val * 100);
  return cents > 0 ? cents : null;
}

/** Returns true when the player has enough balance to place the bet. */
export function canPlaceBet(balanceCents: number, betCents: number): boolean {
  return balanceCents >= betCents && betCents > 0;
}

/** Compute profit and total payout for a finished bet. */
export function resolveBet(betCents: number, payoutMultiplier: number): {
  payoutCents: number;
  profitCents: number;
} {
  const payoutCents = Math.round(betCents * payoutMultiplier);
  const profitCents = payoutCents - betCents;
  return { payoutCents, profitCents };
}
