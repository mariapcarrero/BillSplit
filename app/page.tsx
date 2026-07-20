import { Receipt } from "lucide-react";
import { BillEditor } from "@/components/BillEditor";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden px-4 py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-112 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_srgb,#dc2626_18%,transparent),transparent)]"
      />

      <header className="mb-10 flex w-full max-w-5xl items-start justify-between gap-4">
        <div className="flex-1" />
        <div className="flex flex-2 flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/25">
            <Receipt size={22} strokeWidth={2.2} />
          </div>
          <h1 className="font-serif text-5xl leading-none font-normal text-balance text-zinc-900 italic dark:text-zinc-50">
            Bill Split Pro
          </h1>
          <p className="mt-3.5 max-w-md text-balance text-sm text-zinc-500 dark:text-zinc-400">
            Split a bill, settle up with the fewest transfers, and share the result — no account
            needed.
          </p>
        </div>
        <div className="flex flex-1 justify-end">
          <ThemeToggle />
        </div>
      </header>

      <BillEditor />
    </div>
  );
}
