"use client";

import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import type { Bill, BillItem } from "@/lib/types";
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
    const next = isIncluded
      ? item.splitAmong.filter((id) => id !== personId)
      : [...item.splitAmong, personId];
    if (next.length === 0) return;
    onUpdateItem(item.id, { splitAmong: next });
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

      <div className="mt-3 rounded-xl border border-violet-200/70 bg-linear-to-br from-violet-50 to-indigo-50 p-3 dark:border-violet-500/20 dark:from-violet-500/10 dark:to-indigo-500/10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-violet-500"
            />
            <input
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiParse()}
              placeholder='Describe it — "Ana paid $40 for pizza, split with Leo"'
              disabled={aiLoading || bill.people.length === 0}
              className="w-full rounded-lg border border-violet-200 bg-white/80 py-2 pr-3 pl-8 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:ring-3 focus:ring-violet-500/15 focus:outline-none disabled:opacity-60 dark:border-violet-500/25 dark:bg-zinc-900/60 dark:text-zinc-100"
            />
          </div>
          <button
            type="button"
            onClick={handleAiParse}
            disabled={aiLoading || bill.people.length === 0}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {aiLoading ? "Parsing…" : "Parse with AI"}
          </button>
        </div>
        {aiError && <p className="mt-2 px-1 text-xs text-rose-600 dark:text-rose-400">{aiError}</p>}
      </div>

      <div className="mt-4 space-y-3">
        {bill.items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-zinc-200 bg-white/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={item.description}
                onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                placeholder="Description"
                className="min-w-32 flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                  className="w-24 rounded-lg border border-zinc-200 py-1.5 pr-2 pl-5 text-sm text-zinc-900 tabular-nums placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <select
                value={item.paidBy}
                onChange={(e) => onUpdateItem(item.id, { paidBy: e.target.value })}
                aria-label="Paid by"
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/15 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                className="ml-auto rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
                    )}
                  >
                    <Avatar name={p.name} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddItem}
        disabled={bill.people.length === 0}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5 dark:hover:text-indigo-400"
      >
        <Plus size={15} />
        Add item
      </button>
    </div>
  );
}
