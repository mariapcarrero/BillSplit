"use client";

import { useEffect, useReducer, useState } from "react";
import { billReducer, createEmptyBill } from "@/lib/billReducer";
import { itemSplitError } from "@/lib/settle";
import type { SettleResult } from "@/lib/types";
import { PersonList } from "./PersonList";
import { BillForm } from "./BillForm";
import { Results } from "./Results";
import { ShareButton } from "./ShareButton";

const CARD =
  "rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60";

export function BillEditor() {
  const [bill, dispatch] = useReducer(billReducer, undefined, createEmptyBill);
  const [settled, setSettled] = useState<{ key: string; result: SettleResult | null }>({
    key: "",
    result: null,
  });

  const hasSplitIssues = bill.items.some((item) => itemSplitError(item) !== null);
  const hasEnoughData = bill.people.length > 0 && bill.items.length > 0 && !hasSplitIssues;
  const billKey = JSON.stringify(bill);
  const loading = hasEnoughData && settled.key !== billKey;
  const effectiveResult = hasEnoughData ? settled.result : null;
  const emptyMessage =
    hasSplitIssues && bill.items.length > 0
      ? "Fix the split percentages above to see totals."
      : undefined;

  useEffect(() => {
    if (!hasEnoughData) return;

    const controller = new AbortController();

    fetch("/api/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bill),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSettled({ key: billKey, result: data }))
      .catch(() => {});

    return () => controller.abort();
  }, [bill, billKey, hasEnoughData]);

  return (
    <div className="w-full max-w-5xl space-y-5">
      <div className={`flex items-center justify-between gap-3 ${CARD}`}>
        <input
          value={bill.title}
          onChange={(e) => dispatch({ type: "SET_TITLE", title: e.target.value })}
          aria-label="Bill title"
          className="min-w-0 flex-1 truncate rounded-md bg-transparent text-xl font-semibold text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-red-500/40 dark:text-zinc-50"
        />
        <ShareButton bill={bill} />
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <section className={CARD}>
            <PersonList
              people={bill.people}
              onAdd={(name) => dispatch({ type: "ADD_PERSON", name })}
              onRemove={(personId) => dispatch({ type: "REMOVE_PERSON", personId })}
            />
          </section>

          <section className={CARD}>
            <BillForm
              bill={bill}
              onAddItem={() => dispatch({ type: "ADD_ITEM" })}
              onUpdateItem={(itemId, patch) => dispatch({ type: "UPDATE_ITEM", itemId, patch })}
              onRemoveItem={(itemId) => dispatch({ type: "REMOVE_ITEM", itemId })}
              onAddAiItems={(items) => dispatch({ type: "ADD_AI_ITEMS", items })}
            />
          </section>
        </div>

        <section className={`w-full lg:sticky lg:top-6 lg:w-90 ${CARD}`}>
          <Results
            people={bill.people}
            result={effectiveResult}
            loading={loading}
            emptyMessage={emptyMessage}
          />
        </section>
      </div>
    </div>
  );
}
