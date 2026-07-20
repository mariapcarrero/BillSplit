import { describe, expect, it } from "vitest";
import {
  computeBalances,
  computeTransfers,
  evenPercentages,
  itemSplitError,
  normalizePercentages,
  settleBill,
} from "../lib/settle";
import type { Bill, BillItem } from "../lib/types";

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

describe("computeBalances with percentage splits", () => {
  it("splits a $100 bill 52%/48% instead of evenly", () => {
    // Mirrors the real scenario: Maria fronts a $100 sushi bill, but Mateo
    // only owes 52% of it.
    const mateoAndMaria = [
      { id: "mateo", name: "Mateo" },
      { id: "maria", name: "Maria" },
    ];
    const bill: Bill = {
      title: "Sushi Bill",
      people: mateoAndMaria,
      items: [
        {
          id: "1",
          description: "Sushi Bill",
          amount: 100,
          paidBy: "maria",
          splitAmong: ["mateo", "maria"],
          splitMode: "percentage",
          splitPercentages: { mateo: 52, maria: 48 },
        },
      ],
    };

    const balances = computeBalances(bill);
    expect(balances).toEqual([
      { personId: "mateo", amount: -52 },
      { personId: "maria", amount: 52 },
    ]);

    const { transfers } = settleBill(bill);
    expect(transfers).toEqual([{ from: "mateo", to: "maria", amount: 52 }]);
  });

  it("keeps rounding exact when percentages don't divide evenly into cents", () => {
    const bill: Bill = {
      title: "Split",
      people,
      items: [
        {
          id: "1",
          description: "Something",
          amount: 10,
          paidBy: "a",
          splitAmong: ["a", "b", "c"],
          splitMode: "percentage",
          splitPercentages: { a: 34, b: 33, c: 33 },
        },
      ],
    };

    const balances = computeBalances(bill);
    const total = balances.reduce((sum, b) => sum + b.amount, 0);
    expect(total).toBeCloseTo(0);
  });
});

describe("evenPercentages", () => {
  it("splits 100 evenly and puts the remainder on the first ids", () => {
    expect(evenPercentages(["a", "b", "c"])).toEqual({ a: 34, b: 33, c: 33 });
    expect(evenPercentages(["a", "b"])).toEqual({ a: 50, b: 50 });
  });
});

describe("normalizePercentages", () => {
  it("passes through weights that already sum to 100", () => {
    expect(normalizePercentages(["a", "b"], { a: 47, b: 53 })).toEqual({ a: 47, b: 53 });
  });

  it("rescales weights that don't sum to 100", () => {
    // AI said "47% and 53%" but only heard 47/40 due to rounding elsewhere.
    const result = normalizePercentages(["a", "b"], { a: 47, b: 40 });
    expect(result.a + result.b).toBe(100);
    expect(result.a).toBeGreaterThan(result.b);
  });

  it("converts ratios like 'twice as much' into percentages", () => {
    expect(normalizePercentages(["a", "b"], { a: 2, b: 1 })).toEqual({ a: 67, b: 33 });
  });

  it("falls back to an even split when weights are missing or zero", () => {
    expect(normalizePercentages(["a", "b"], {})).toEqual({ a: 50, b: 50 });
    expect(normalizePercentages(["a", "b"], { a: 0, b: 0 })).toEqual({ a: 50, b: 50 });
  });
});

describe("itemSplitError", () => {
  const base: BillItem = {
    id: "1",
    description: "Item",
    amount: 100,
    paidBy: "a",
    splitAmong: ["a", "b"],
  };

  it("is null for equal-mode items", () => {
    expect(itemSplitError(base)).toBeNull();
  });

  it("is null when percentages sum to 100", () => {
    const item: BillItem = {
      ...base,
      splitMode: "percentage",
      splitPercentages: { a: 52, b: 48 },
    };
    expect(itemSplitError(item)).toBeNull();
  });

  it("flags percentages that don't sum to 100", () => {
    const item: BillItem = {
      ...base,
      splitMode: "percentage",
      splitPercentages: { a: 52, b: 40 },
    };
    expect(itemSplitError(item)).toMatch(/92%/);
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
