export function formatMoney(cents: number): string {
  const safeCents = Math.max(0, Math.floor(cents));
  return `$${(safeCents / 100).toFixed(2)}`;
}

export function formatGain(cents: number): string {
  const safeCents = Math.max(0, Math.floor(cents));
  return `+$${(safeCents / 100).toFixed(2)}`;
}
