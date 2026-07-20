"use client";

import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import type { Bill, BillItem, SplitMode } from "@/lib/types";
import { evenPercentages, itemSplitError } from "@/lib/settle";
import { avatarColor } from "@/lib/avatar";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/cn";

type BillFormProps = {
  bill: Bill;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Partial<Omit<BillItem, "id">>) => void;
  onRemoveItem: (itemId: string) => void;
  onAddAiItems: (items: Omit<BillItem, "id">[]) => void;
};

export function BillForm({
  bill,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onAddAiItems,
}: BillFormProps) {
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const toggleSplit = (item: BillItem, personId: string) => {
    const isIncluded = item.splitAmong.includes(personId);
    const nextIds = isIncluded
      ? item.splitAmong.filter((id) => id !== personId)
      : [...item.splitAmong, personId];
    if (nextIds.length === 0) return;

    if (item.splitMode === "percentage") {
      onUpdateItem(item.id, { splitAmong: nextIds, splitPercentages: evenPercentages(nextIds) });
    } else {
      onUpdateItem(item.id, { splitAmong: nextIds });
    }
  };

  const setSplitMode = (item: BillItem, mode: SplitMode) => {
    if (mode === "equal") {
      onUpdateItem(item.id, { splitMode: "equal", splitPercentages: undefined });
    } else {
      onUpdateItem(item.id, {
        splitMode: "percentage",
        splitPercentages: evenPercentages(item.splitAmong),
      });
    }
  };

  const updatePercentage = (item: BillItem, personId: string, value: number) => {
    const clamped = Math.min(100, Math.max(0, value));
    onUpdateItem(item.id, {
      splitPercentages: { ...(item.splitPercentages ?? {}), [personId]: clamped },
    });
  };

  const handleAiParse = async () => {
    if (!aiText.trim() || bill.people.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText, people: bill.people }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI parsing failed");
      onAddAiItems(data.items);
      setAiText("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI parsing failed");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Items
      </h2>

      <div className="mt-3 rounded-xl border border-red-200/70 bg-linear-to-br from-red-50 to-orange-50 p-3 dark:border-red-500/20 dark:from-red-500/10 dark:to-orange-500/10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-red-500"
            />
            <input
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiParse()}
              placeholder='Describe it — "Ana paid $40 for pizza, split with Leo"'
              disabled={aiLoading || bill.people.length === 0}
              className="w-full rounded-lg border border-red-200 bg-white/80 py-2 pr-3 pl-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-3 focus:ring-red-500/15 focus:outline-none disabled:opacity-60 dark:border-red-500/25 dark:bg-zinc-900/60 dark:text-zinc-100"
            />
          </div>
          <button
            type="button"
            onClick={handleAiParse}
            disabled={aiLoading || bill.people.length === 0}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {aiLoading ? "Parsing…" : "Parse with AI"}
          </button>
        </div>
        {aiError && <p className="mt-2 px-1 text-xs text-red-600 dark:text-red-400">{aiError}</p>}
      </div>

      <div className="mt-4 space-y-3">
        {bill.items.map((item) => {
          const payer = bill.people.find((p) => p.id === item.paidBy);
          return (
            <div
              key={item.id}
              style={{ borderLeftColor: avatarColor(payer?.name ?? "?"), borderLeftWidth: 4 }}
              className="rounded-xl border border-zinc-200 bg-white/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={item.description}
                  onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                  placeholder="Description"
                  className="min-w-32 flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-3 focus:ring-red-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-zinc-400">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.amount || ""}
                    onChange={(e) => onUpdateItem(item.id, { amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-24 rounded-lg border border-zinc-200 py-1.5 pr-2 pl-5 font-mono text-sm text-zinc-900 tabular-nums placeholder:text-zinc-400 focus:border-red-400 focus:ring-3 focus:ring-red-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <select
                  value={item.paidBy}
                  onChange={(e) => onUpdateItem(item.id, { paidBy: e.target.value })}
                  aria-label="Paid by"
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-red-400 focus:ring-3 focus:ring-red-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {bill.people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} paid
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label="Remove item"
                  className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-0.5 text-xs text-zinc-400">split:</span>
                  {bill.people.map((p) => {
                    const active = item.splitAmong.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleSplit(item, p.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full py-1 pr-2.5 pl-1 text-xs font-medium transition-colors",
                          active
                            ? "bg-red-600 text-white"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
                        )}
                      >
                        <Avatar name={p.name} />
                        {p.name}
                      </button>
                    );
                  })}
                </div>

                <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs font-medium dark:bg-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSplitMode(item, "equal")}
                    className={cn(
                      "rounded-full px-2.5 py-1 transition-colors",
                      (item.splitMode ?? "equal") === "equal"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                        : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    Equal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode(item, "percentage")}
                    className={cn(
                      "rounded-full px-2.5 py-1 transition-colors",
                      item.splitMode === "percentage"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                        : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    %
                  </button>
                </div>
              </div>

              {item.splitMode === "percentage" && (
                <div className="mt-2 space-y-1.5 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-900/50">
                  {item.splitAmong.map((personId) => {
                    const person = bill.people.find((p) => p.id === personId);
                    if (!person) return null;
                    return (
                      <div key={personId} className="flex items-center gap-2">
                        <Avatar name={person.name} />
                        <span className="flex-1 text-xs text-zinc-600 dark:text-zinc-300">
                          {person.name}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          value={item.splitPercentages?.[personId] ?? 0}
                          onChange={(e) => updatePercentage(item, personId, Number(e.target.value))}
                          aria-label={`Percent for ${person.name}`}
                          className="w-16 rounded-md border border-zinc-200 py-1 pr-1.5 text-right text-xs tabular-nums focus:border-red-400 focus:ring-3 focus:ring-red-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                        />
                        <span className="text-xs text-zinc-400">%</span>
                      </div>
                    );
                  })}
                  {(() => {
                    const error = itemSplitError(item);
                    const total = item.splitAmong.reduce(
                      (sum, id) => sum + (item.splitPercentages?.[id] ?? 0),
                      0,
                    );
                    return (
                      <div
                        className={cn(
                          "flex items-center justify-between border-t border-zinc-200 pt-1.5 text-xs font-medium dark:border-zinc-700",
                          error
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        <span>{error ? "Must total 100%" : "Total"}</span>
                        <span>{total.toFixed(total % 1 === 0 ? 0 : 1)}%</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddItem}
        disabled={bill.people.length === 0}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:border-red-300 hover:bg-red-50/50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-500/40 dark:hover:bg-red-500/5 dark:hover:text-red-400"
      >
        <Plus size={15} />
        Add item
      </button>
    </div>
  );
}
