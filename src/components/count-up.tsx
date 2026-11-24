"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { formatMoney } from "@/lib/utils";

interface Props {
  value: number;
  kind?: "money" | "number" | "percent";
  currency?: string;
  compact?: boolean;
  className?: string;
}

function makeFormat(kind: NonNullable<Props["kind"]>, currency: string, compact: boolean) {
  if (kind === "money") return (n: number) => formatMoney(n, currency, compact);
  if (kind === "percent") return (n: number) => `${n.toFixed(1)}%`;
  return (n: number) => Math.round(n).toLocaleString("en-US");
}

export function CountUp({ value, kind = "number", currency = "USD", compact = false, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    const format = makeFormat(kind, currency, compact);
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, kind, currency, compact]);

  return (
    <span ref={ref} className={className}>
      {makeFormat(kind, currency, compact)(value)}
    </span>
  );
}
