import { describe, expect, it } from "vitest";
import { computeBalances, computeTransfers, settleBill } from "../lib/settle";
import type { Bill } from "../lib/types";

const people = [
  { id: "a", name: "Ana" },
  { id: "b", name: "Leo" },
  { id: "c", name: "Mia" },
];

describe("computeBalances", () => {
  it("splits an item evenly among participants", () => {
    const bill: Bill = {
      title: "Dinner",
      people,
      items: [
        { id: "1", description: "Pizza", amount: 30, paidBy: "a", splitAmong: ["a", "b", "c"] },
      ],
    };

    const balances = computeBalances(bill);
    expect(balances).toEqual([
      { personId: "a", amount: 20 },
      { personId: "b", amount: -10 },
      { personId: "c", amount: -10 },
    ]);
  });

  it("distributes rounding remainder to the first participants", () => {
    const bill: Bill = {
      title: "Coffee",
      people,
      items: [
        { id: "1", description: "Coffee", amount: 10, paidBy: "a", splitAmong: ["a", "b", "c"] },
      ],
    };

    const balances = computeBalances(bill);
    const total = balances.reduce((sum, b) => sum + b.amount, 0);
    expect(total).toBeCloseTo(0);
    // 10 / 3 = 3.33 each, remainder 1 cent goes to "a"; a paid 10 and owes 3.34
    expect(balances.find((b) => b.personId === "a")?.amount).toBeCloseTo(6.66);
  });

  it("returns zero balances when there are no items", () => {
    const bill: Bill = { title: "Empty", people, items: [] };
    const balances = computeBalances(bill);
    expect(balances.every((b) => b.amount === 0)).toBe(true);
  });
});

describe("computeTransfers", () => {
  it("produces no transfers when balances are settled", () => {
    const transfers = computeTransfers([
      { personId: "a", amount: 0 },
      { personId: "b", amount: 0 },
    ]);
    expect(transfers).toEqual([]);
  });

  it("minimizes transfers for a simple three-person case", () => {
    const transfers = computeTransfers([
      { personId: "a", amount: 20 },
      { personId: "b", amount: -10 },
      { personId: "c", amount: -10 },
    ]);

    expect(transfers).toHaveLength(2);
    expect(transfers.every((t) => t.to === "a")).toBe(true);
    expect(transfers.reduce((sum, t) => sum + t.amount, 0)).toBeCloseTo(20);
  });
});

describe("settleBill", () => {
  it("combines balances and transfers for a full bill", () => {
    const bill: Bill = {
      title: "Trip",
      people,
      items: [
        { id: "1", description: "Hotel", amount: 90, paidBy: "a", splitAmong: ["a", "b", "c"] },
        { id: "2", description: "Gas", amount: 30, paidBy: "b", splitAmong: ["a", "b", "c"] },
      ],
    };

    const result = settleBill(bill);
    expect(result.balances).toHaveLength(3);
    expect(result.transfers.length).toBeGreaterThan(0);

    const balanceSum = result.balances.reduce((sum, b) => sum + b.amount, 0);
    expect(balanceSum).toBeCloseTo(0);
  });
});
