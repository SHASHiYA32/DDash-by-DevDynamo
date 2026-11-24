"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, SearchField, SegmentedControl } from "glisse";
import { Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, notify, withToast } from "@/lib/client";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/brand";
import { fmtLong, todayIso } from "@/lib/analytics";
import { cn, formatMoney } from "@/lib/utils";

export interface TxRow {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
  createdBy: string;
}

interface Props {
  txs: TxRow[];
  currency: string;
  userId: string;
  isManager: boolean;
  canExport: boolean;
}

const PAGE = 25;

export function Transactions({ txs, currency, userId, isManager, canExport }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState(false);

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...txs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) => filter === "all" || t.type === filter)
      .filter((t) => !q || `${t.category} ${t.note}`.toLowerCase().includes(q));
  }, [txs, filter, query]);

  function switchType(next: string) {
    const t = next as "income" | "expense";
    setType(t);
    setCategory((t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      notify.warning("Enter an amount", "The amount must be greater than zero.");
      return;
    }
    setSaving(true);
    const r = await withToast(() => api("/api/transactions", "POST", { type, amount: value, category, note, date }), {
      loading: "Saving…",
      success: type === "income" ? "Income added" : "Expense added",
      error: "Couldn't save",
    });
    setSaving(false);
    if (r.ok) {
      setOpen(false);
      setAmount("");
      setNote("");
      router.refresh();
    }
  }

  async function remove(id: string) {
    const r = await withToast(() => api(`/api/transactions?id=${id}`, "DELETE"), {
      loading: "Deleting…",
      success: "Transaction deleted",
      error: "Couldn't delete",
    });
    if (r.ok) router.refresh();
  }

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">Every sale and expense in one place.</p>
        </div>
        <div className="flex gap-2">
          {isManager &&
            (canExport ? (
              <Button asChild variant="outline">
                <a href="/api/export" download>
                  <Download /> Export CSV
                </a>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => notify.info("CSV export", "Available on the Growth plan and higher.")}
              >
                <Download /> Export CSV
              </Button>
            ))}
          <Button onClick={() => setOpen(true)}>
            <Plus /> Add transaction
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SegmentedControl
          aria-label="Filter"
          value={filter}
          onValueChange={(v) => {
            setFilter(v);
            setLimit(PAGE);
          }}
          items={[
            { value: "all", label: "All" },
            { value: "income", label: "Income" },
            { value: "expense", label: "Expenses" },
          ]}
        />
        <div className="sm:ml-auto sm:w-72">
          <SearchField
            aria-label="Search transactions"
            placeholder="Search category or note"
            value={query}
            onValueChange={(v) => {
              setQuery(v);
              setLimit(PAGE);
            }}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {txs.length === 0 ? "No transactions yet. Add your first one." : "Nothing matches your filters."}
          </p>
        ) : (
          <ul className="divide-y">
            {rows.slice(0, limit).map((t) => {
              const canDelete = isManager || t.createdBy === userId;
              return (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold",
                      t.type === "income"
                        ? "bg-brand/25 text-emerald-700 dark:text-brand"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.note || t.category}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.category} · {fmtLong(t.date)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      t.type === "income" && "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(t.amount, currency)}
                  </span>
                  {canDelete ? (
                    <Menu
                      aria-label="Transaction actions"
                      align="end"
                      items={[
                        {
                          label: "Delete",
                          icon: <Trash2 size={16} />,
                          destructive: true,
                          onSelect: () => remove(t.id),
                        },
                      ]}
                    />
                  ) : (
                    <span className="w-10" />
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {rows.length > limit && (
          <div className="border-t p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({rows.length - limit} left)
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
            <DialogDescription>Record money coming in or going out.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4">
            <div className="flex">
              <SegmentedControl
                aria-label="Type"
                value={type}
                onValueChange={switchType}
                items={[
                  { value: "income", label: "Income" },
                  { value: "expense", label: "Expense" },
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                inputMode="decimal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Dropdown id="category" value={category} onChange={setCategory} options={categories} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <DatePicker id="date" value={date} max={todayIso()} onChange={setDate} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Weekend sales" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                Save transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
