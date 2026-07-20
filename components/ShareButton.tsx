"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import type { Bill } from "@/lib/types";
import { encodeBillToken } from "@/lib/share";

export function ShareButton({ bill }: { bill: Bill }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const token = encodeBillToken(bill);
    const url = `${window.location.origin}/s/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={bill.people.length === 0}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 ${
        copied
          ? "bg-emerald-600 text-white"
          : "bg-red-600 text-white hover:bg-red-500 active:bg-red-700"
      }`}
    >
      {copied ? <Check size={15} /> : <Link2 size={15} />}
      {copied ? "Link copied" : "Copy share link"}
    </button>
  );
}
