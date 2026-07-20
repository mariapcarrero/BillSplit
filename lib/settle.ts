import type { Bill, Balance, BillItem, Transfer, SettleResult } from "./types";

const CENTS = 100;
const toCents = (n: number) => Math.round(n * CENTS);

/** Largest-remainder allocation: distributes totalCents across weights, keeping the sum exact. */
function allocateByWeights(totalCents: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  if (weightSum <= 0) return weights.map(() => 0);

  const raw = weights.map((w) => (totalCents * w) / weightSum);
  const floors = raw.map(Math.floor);
  let remainder = totalCents - floors.reduce((sum, v) => sum + v, 0);

  const byFractionDesc = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  const result = [...floors];
  for (let i = 0; i < byFractionDesc.length && remainder > 0; i++, remainder--) {
    result[byFractionDesc[i].index] += 1;
  }
  return result;
}

function splitWeights(item: BillItem): number[] {
  if (item.splitMode === "percentage" && item.splitPercentages) {
    return item.splitAmong.map((id) => item.splitPercentages?.[id] ?? 0);
  }
  return item.splitAmong.map(() => 1);
}

/** Even percent shares for a set of people, summing to exactly 100. */
export function evenPercentages(personIds: string[]): Record<string, number> {
  if (personIds.length === 0) return {};
  const base = Math.floor(100 / personIds.length);
  const remainder = 100 - base * personIds.length;
  const result: Record<string, number> = {};
  personIds.forEach((id, index) => {
    result[id] = base + (index < remainder ? 1 : 0);
  });
  return result;
}

/**
 * Rescales arbitrary positive weights (e.g. AI-guessed percentages that don't
 * quite add up, or ratios like "twice as much") into percentages that sum to
 * exactly 100. Falls back to an even split if every weight is zero/missing.
 */
export function normalizePercentages(
  personIds: string[],
  weights: Record<string, number>,
): Record<string, number> {
  const raw = personIds.map((id) => Math.max(0, weights[id] ?? 0));
  const weightSum = raw.reduce((sum, w) => sum + w, 0);
  if (weightSum <= 0) return evenPercentages(personIds);

  const allocation = allocateByWeights(100, raw);
  const result: Record<string, number> = {};
  personIds.forEach((id, index) => {
    result[id] = allocation[index];
  });
  return result;
}

/** Returns a human-readable problem with an item's split, or null if it's valid. */
export function itemSplitError(item: BillItem): string | null {
  if (item.splitMode !== "percentage") return null;
  const percentages = item.splitPercentages ?? {};
  const total = item.splitAmong.reduce((sum, id) => sum + (percentages[id] ?? 0), 0);
  if (Math.abs(total - 100) > 0.05) {
    return `Percentages add up to ${total.toFixed(total % 1 === 0 ? 0 : 1)}%, not 100%.`;
  }
  return null;
}

export function computeBalances(bill: Bill): Balance[] {
  const balanceCents = new Map<string, number>();
  for (const person of bill.people) balanceCents.set(person.id, 0);

  for (const item of bill.items) {
    const totalCents = toCents(item.amount);
    balanceCents.set(item.paidBy, (balanceCents.get(item.paidBy) ?? 0) + totalCents);

    const allocation = allocateByWeights(totalCents, splitWeights(item));
    item.splitAmong.forEach((personId, index) => {
      balanceCents.set(personId, (balanceCents.get(personId) ?? 0) - allocation[index]);
    });
  }

  return bill.people.map((person) => ({
    personId: person.id,
    amount: (balanceCents.get(person.id) ?? 0) / CENTS,
  }));
}

/** Greedy debt simplification: repeatedly match the largest debtor with the largest creditor. */
export function computeTransfers(balances: Balance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.amount > 0)
    .map((b) => ({ personId: b.personId, amount: toCents(b.amount) }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((b) => b.amount < 0)
    .map((b) => ({ personId: b.personId, amount: -toCents(b.amount) }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transfers.push({ from: debtor.personId, to: creditor.personId, amount: amount / CENTS });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) i++;
    if (creditor.amount === 0) j++;
  }

  return transfers;
}

export function settleBill(bill: Bill): SettleResult {
  const balances = computeBalances(bill);
  const transfers = computeTransfers(balances);
  return { balances, transfers };
}
