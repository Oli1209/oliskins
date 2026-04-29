export function pickWeighted<T extends { weight: number }>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty array");
  }
  
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Total weight must be greater than 0");
  }
  
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  
  return items[items.length - 1];
}
