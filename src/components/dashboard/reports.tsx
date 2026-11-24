"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, SegmentedControl, Switch } from "glisse";
import { CalendarClock, FilePlus2, FileText, Trash2 } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { api, notify, withToast } from "@/lib/client";
import { addDays, fmtLong, todayIso } from "@/lib/analytics";
import { formatMoney } from "@/lib/utils";

export interface ReportRow {
  id: string;
  title: string;
  kind: "weekly" | "monthly" | "custom";
  auto: boolean;
  createdAt: string;
  income: number;
  expense: number;
  net: number;
}

interface Props {
  reports: ReportRow[];
  currency: string;
  canReports: boolean;
  canCustom: boolean;
  canAutoWeekly: boolean;
  canAutoMonthly: boolean;
  autoWeekly: boolean;
  autoMonthly: boolean;
  isOwner: boolean;
}

export function Reports(p: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("weekly");
  const [from, setFrom] = useState(addDays(todayIso(), -29));
  const [to, setTo] = useState(todayIso());
  const [busy, setBusy] = useState(false);
  const [weekly, setWeekly] = useState(p.autoWeekly);
  const [monthly, setMonthly] = useState(p.autoMonthly);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (kind === "custom" && !p.canCustom) {
      notify.warning("Scale plan feature", "Custom date-range reports need the Scale plan.");
      return;
    }
    setBusy(true);
    const r = await withToast(
      () => api<{ id?: string }>("/api/reports", "POST", { kind, from, to }),
      { loading: "Generating report…", success: "Report ready", error: "Couldn't generate" },
    );
    setBusy(false);
    if (r.ok) {
      setOpen(false);
      router.push(r.data.id ? `/dashboard/reports/${r.data.id}` : "/dashboard/reports");
      router.refresh();
    }
  }

  async function toggle(which: "autoWeekly" | "autoMonthly", next: boolean) {
    const set = which === "autoWeekly" ? setWeekly : setMonthly;
    set(next);
    const r = await withToast(() => api("/api/business", "PATCH", { [which]: next }), {
      loading: "Saving…",
      success: next ? "Automatic reports on" : "Automatic reports off",
      error: "Couldn't update",
    });
    if (!r.ok) set(!next);
  }

  async function remove(id: string) {
    const r = await withToast(() => api(`/api/reports?id=${id}`, "DELETE"), {
      loading: "Deleting…",
      success: "Report deleted",
      error: "Couldn't delete",
    });
    if (r.ok) router.refresh();
  }

  if (!p.canReports) {
    return (
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <UpgradeCard feature="reports" canUpgrade={p.isOwner} className="min-h-72" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Clean summaries you can print or save as PDF.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <FilePlus2 /> Generate report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4" />
            <CardTitle>Automatic reports</CardTitle>
          </div>
          <CardDescription>
            New reports appear here by themselves, right after each period closes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <div className="text-sm font-medium">Weekly</div>
              <div className="text-xs text-muted-foreground">Every Monday, covering last week</div>
            </div>
            {p.canAutoWeekly ? (
              <Switch aria-label="Automatic weekly reports" checked={weekly} onCheckedChange={(v) => toggle("autoWeekly", v)} />
            ) : (
              <Badge tone="outline">Growth+</Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <div className="text-sm font-medium">Monthly</div>
              <div className="text-xs text-muted-foreground">1st of the month, covering last month</div>
            </div>
            {p.canAutoMonthly ? (
              <Switch aria-label="Automatic monthly reports" checked={monthly} onCheckedChange={(v) => toggle("autoMonthly", v)} />
            ) : (
              <Badge tone="outline">Scale</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        {p.reports.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No reports yet. Generate your first one.
          </p>
        ) : (
          <ul className="divide-y">
            {p.reports.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                  <FileText className="size-4" />
                </span>
                <Link href={`/dashboard/reports/${r.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{r.title}</span>
                    {r.auto && <Badge tone="brand">Auto</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {fmtLong(r.createdAt.slice(0, 10))}
                  </div>
                </Link>
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-medium tabular-nums">{formatMoney(r.net, p.currency)}</div>
                  <div className="text-xs text-muted-foreground">net profit</div>
                </div>
                <Menu
                  aria-label="Report actions"
                  align="end"
                  items={[{ label: "Delete", icon: <Trash2 size={16} />, destructive: true, onSelect: () => remove(r.id) }]}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate report</DialogTitle>
            <DialogDescription>Pick a period. Weekly and monthly use the last full period.</DialogDescription>
          </DialogHeader>
          <form onSubmit={generate} className="grid gap-4">
            <div className="flex">
              <SegmentedControl
                aria-label="Report type"
                value={kind}
                onValueChange={setKind}
                items={[
                  { value: "weekly", label: "Last week" },
                  { value: "monthly", label: "Last month" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </div>
            {kind === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="r-from">From</Label>
                  <DatePicker id="r-from" value={from} max={to} onChange={setFrom} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-to">To</Label>
                  <DatePicker id="r-to" value={to} min={from} max={todayIso()} onChange={setTo} />
                </div>
                {!p.canCustom && (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Custom ranges are part of the Scale plan.
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                Generate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
