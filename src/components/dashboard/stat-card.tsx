"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/count-up";
import { Sparkline } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  kind: "money" | "percent";
  currency: string;
  change: number | null;
  /** For expenses, a rise is bad news. */
  invert?: boolean;
  spark?: number[];
  sparkColor?: string;
  delay?: number;
}

export function StatCard({ label, value, kind, currency, change, invert, spark, sparkColor, delay = 0 }: Props) {
  const good = change === null ? null : invert ? change <= 0 : change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="flex h-full flex-col overflow-hidden p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-[28px]">
          <CountUp value={value} kind={kind} currency={currency} compact={Math.abs(value) >= 100_000} />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {change === null ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Minus className="size-3" /> Of total income
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
          {change !== null && <span className="text-muted-foreground">vs previous period</span>}
        </div>
        {spark && spark.length > 1 && (
          <div className="pointer-events-none -mx-5 mt-auto -mb-5 h-14 pt-3 opacity-90">
            <Sparkline values={spark} color={sparkColor} />
          </div>
        )}
      </Card>
    </motion.div>
  );
}
