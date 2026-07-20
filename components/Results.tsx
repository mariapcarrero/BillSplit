import { ArrowRight, PartyPopper, Receipt, TriangleAlert } from "lucide-react";
import type { Person, SettleResult } from "@/lib/types";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/cn";

type ResultsProps = {
  people: Person[];
  result: SettleResult | null;
  loading?: boolean;
  emptyMessage?: string;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Math.abs(amount));

export function Results({ people, result, loading, emptyMessage }: ResultsProps) {
  const nameFor = (personId: string) => people.find((p) => p.id === personId)?.name ?? "?";

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
        <div className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
      </div>
    );
  }

  if (!result) {
    const Icon = emptyMessage ? TriangleAlert : Receipt;
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <Icon size={22} className="text-zinc-300 dark:text-zinc-700" />
        <p className="text-sm text-zinc-500">
          {emptyMessage ?? "Add people and items to see the split."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Balances
        </h2>
        <ul className="mt-2.5 space-y-2.5">
          {(() => {
            const maxAbs = Math.max(1, ...result.balances.map((b) => Math.abs(b.amount)));
            return result.balances.map((b) => (
              <li key={b.personId}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                    <Avatar name={nameFor(b.personId)} />
                    {nameFor(b.personId)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
                      b.amount > 0.005 &&
                        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                      b.amount < -0.005 &&
                        "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
                      Math.abs(b.amount) <= 0.005 &&
                        "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                    )}
                  >
                    {b.amount > 0.005 ? "+" : b.amount < -0.005 ? "−" : ""}
                    {formatMoney(b.amount)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      b.amount > 0.005 && "bg-emerald-500",
                      b.amount < -0.005 && "bg-red-500",
                      Math.abs(b.amount) <= 0.005 && "bg-zinc-300 dark:bg-zinc-600",
                    )}
                    style={{ width: `${Math.round((Math.abs(b.amount) / maxAbs) * 100)}%` }}
                  />
                </div>
              </li>
            ));
          })()}
        </ul>
      </div>

      <div>
        <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Who pays whom
        </h2>
        {result.transfers.length === 0 ? (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
            <PartyPopper size={16} />
            Everyone is settled up.
          </div>
        ) : (
          <ul className="mt-2.5 space-y-1.5">
            {result.transfers.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60"
              >
                <span className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-200">
                  <Avatar name={nameFor(t.from)} />
                  {nameFor(t.from)}
                </span>
                <ArrowRight size={14} className="shrink-0 text-zinc-400" />
                <span className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-200">
                  <Avatar name={nameFor(t.to)} />
                  {nameFor(t.to)}
                </span>
                <span className="ml-auto font-mono font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
                  {formatMoney(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
