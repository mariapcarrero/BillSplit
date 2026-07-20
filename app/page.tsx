import { Receipt } from "lucide-react";
import { BillEditor } from "@/components/BillEditor";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-112 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_srgb,indigo_18%,transparent),transparent)]"
      />

      <header className="mb-10 flex w-full max-w-2xl flex-col items-center text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
          <Receipt size={20} strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Bill Split Pro
        </h1>
        <p className="mt-2 max-w-md text-balance text-sm text-zinc-500 dark:text-zinc-400">
          Split a bill, settle up with the fewest transfers, and share the result — no account
          needed.
        </p>
      </header>

      <BillEditor />
    </div>
  );
}
