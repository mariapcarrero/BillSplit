import { avatarStyle, initials } from "@/lib/avatar";
import { cn } from "@/lib/cn";

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const style = avatarStyle(name || "?");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        style.bg,
        style.text,
        size === "sm" ? "h-6 w-6 text-[11px]" : "h-9 w-9 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}
