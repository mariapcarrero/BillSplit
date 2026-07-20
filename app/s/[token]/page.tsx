import Link from "next/link";
import { Receipt, TriangleAlert } from "lucide-react";
import { decodeBillToken } from "@/lib/share";
import { settleBill } from "@/lib/settle";
import { Results } from "@/components/Results";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharedBillPage({ params }: PageProps) {
  const { token } = await params;
  const bill = decodeBillToken(token);

  if (!bill) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <TriangleAlert size={22} className="text-zinc-300 dark:text-zinc-700" />
        <p className="text-zinc-600 dark:text-zinc-400">This share link is invalid or corrupted.</p>
        <Link
          href="/"
          className="text-sm font-medium text-indigo-600 underline underline-offset-4 hover:text-indigo-500"
        >
          Start a new bill
        </Link>
      </div>
    );
  }

  const result = settleBill(bill);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Receipt size={16} />
            </span>
            <h1 className="truncate text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {bill.title}
            </h1>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            New bill
          </Link>
        </header>

        <section className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
            Items
          </h2>
          <ul className="mt-2.5 space-y-1.5">
            {bill.items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60"
              >
                <span className="text-zinc-700 dark:text-zinc-200">
                  {item.description || "Untitled item"}
                </span>
                <span className="font-medium text-zinc-900 tabular-nums dark:text-zinc-50">
                  ${item.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <Results people={bill.people} result={result} />
        </section>
      </div>
    </div>
  );
}
