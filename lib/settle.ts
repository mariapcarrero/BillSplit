import type { Bill, Balance, Transfer, SettleResult } from "./types";

const CENTS = 100;
const toCents = (n: number) => Math.round(n * CENTS);

export function computeBalances(bill: Bill): Balance[] {
  const balanceCents = new Map<string, number>();
  for (const person of bill.people) balanceCents.set(person.id, 0);

  for (const item of bill.items) {
    const totalCents = toCents(item.amount);
    const shareCount = item.splitAmong.length;
    const baseShare = Math.floor(totalCents / shareCount);
    const remainder = totalCents - baseShare * shareCount;

    balanceCents.set(item.paidBy, (balanceCents.get(item.paidBy) ?? 0) + totalCents);

    item.splitAmong.forEach((personId, index) => {
      const share = baseShare + (index < remainder ? 1 : 0);
      balanceCents.set(personId, (balanceCents.get(personId) ?? 0) - share);
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
