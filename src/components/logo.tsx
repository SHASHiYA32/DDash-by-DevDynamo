import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-8 place-items-center rounded-[10px] bg-foreground text-background",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none">
        {/* two D shapes: DD = DevDynamo */}
        <path d="M4 5h4.2a5 5 0 0 1 0 14H4V5Z" fill="currentColor" />
        <path
          d="M13.5 5h2.2a5 5 0 0 1 0 14h-2.2"
          stroke="var(--brand)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  className,
  showName = true,
}: {
  href?: string;
  className?: string;
  showName?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <LogoMark />
      {showName && <span className="text-[17px]">DDash</span>}
    </Link>
  );
}
