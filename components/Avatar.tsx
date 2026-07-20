import { avatarColor, initials } from "@/lib/avatar";
import { cn } from "@/lib/cn";

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  return (
    <span
      style={{ backgroundColor: avatarColor(name || "?") }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "sm" ? "h-6 w-6 text-[11px]" : "h-9 w-9 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}
