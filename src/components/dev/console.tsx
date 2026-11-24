"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, SegmentedControl, Switch } from "glisse";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { TabIcon } from "@/components/custom-icons";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/select";
import { api, withToast } from "@/lib/client";
import { fmtLong } from "@/lib/analytics";
import { PLANS } from "@/lib/plans";
import type { BusinessAdminRow, CustomRequest } from "@/lib/db";

interface TabRow {
  id: string;
  businessName: string;
  title: string;
  slug: string;
  icon: string;
  kind: "data" | "page";
  enabled: boolean;
  access: "all" | "managers";
}

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "declined", label: "Declined" },
];

export function DevConsole({
  businesses,
  requests,
  tabs,
}: {
  businesses: BusinessAdminRow[];
  requests: CustomRequest[];
  tabs: TabRow[];
}) {
  const router = useRouter();
  const [view, setView] = useState("requests");
  const [del, setDel] = useState<TabRow | null>(null);
  const open = requests.filter((r) => r.status === "pending" || r.status === "in_progress").length;

  async function setStatus(id: string, status: string) {
    const r = await withToast(() => api("/api/dev/requests", "PATCH", { id, status }), {
      loading: "Updating…",
      success: "Status updated",
      error: "Couldn't update",
    });
    if (r.ok) router.refresh();
  }

  async function saveNote(id: string, devNote: string, prev: string) {
    if (devNote === prev) return;
    const r = await withToast(() => api("/api/dev/requests", "PATCH", { id, devNote }), {
      loading: "Saving note…",
      success: "Note saved",
      error: "Couldn't save note",
    });
    if (r.ok) router.refresh();
  }

  async function toggle(t: TabRow, enabled: boolean) {
    const r = await withToast(() => api("/api/dev/tabs", "PATCH", { id: t.id, enabled }), {
      loading: "Saving…",
      success: enabled ? "Tab is live" : "Tab hidden",
      error: "Couldn't update",
    });
    if (r.ok) router.refresh();
  }

  async function remove(t: TabRow) {
    const r = await withToast(() => api(`/api/dev/tabs?id=${t.id}`, "DELETE"), {
      loading: "Deleting…",
      success: "Tab deleted",
      error: "Couldn't delete",
    });
    setDel(null);
    if (r.ok) router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Developer console</h1>
          <p className="text-sm text-muted-foreground">
            {businesses.length} businesses · {open} open request{open === 1 ? "" : "s"} · {tabs.length} custom tabs
          </p>
        </div>
        <Button asChild>
          <Link href="/dev/tabs/new">
            <Plus /> Build a tab from scratch
          </Link>
        </Button>
      </div>

      <div className="flex">
        <SegmentedControl
          aria-label="Console view"
          value={view}
          onValueChange={setView}
          items={[
            { value: "requests", label: `Requests${open ? ` (${open})` : ""}` },
            { value: "tabs", label: "Custom tabs" },
            { value: "businesses", label: "Businesses" },
          ]}
        />
      </div>

      {view === "requests" && (
        <div className="grid gap-3">
          {requests.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">No requests yet.</Card>}
          {requests.map((r) => (
            <Card key={r.id} className="grid gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.title}</span>
                    {r.extra && <Badge tone="brand">Paid add-on</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.businessName} · {r.requesterName ?? "unknown"} · {fmtLong(r.createdAt.slice(0, 10))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-40">
                    <Dropdown value={r.status} onChange={(v) => setStatus(r.id, v)} options={STATUSES} />
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/dev/tabs/new?request=${r.id}`}>
                      <Wrench /> Build tab
                    </Link>
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <Input
                defaultValue={r.devNote}
                placeholder="Note to the customer (shown in their Custom tab). Saves when you click away."
                maxLength={1000}
                onBlur={(e) => saveNote(r.id, e.target.value, r.devNote)}
              />
            </Card>
          ))}
        </div>
      )}

      {view === "tabs" && (
        <Card className="overflow-hidden">
          {tabs.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No custom tabs yet. Build your first one.</p>
          ) : (
            <ul className="divide-y">
              {tabs.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                    <TabIcon name={t.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.businessName} · /dashboard/t/{t.slug}
                    </div>
                  </div>
                  <Badge tone="outline">{t.kind === "data" ? "Data" : "Page"}</Badge>
                  <Switch aria-label={`Enable ${t.title}`} checked={t.enabled} onCheckedChange={(v) => toggle(t, v)} />
                  <Menu
                    aria-label="Tab actions"
                    align="end"
                    items={[
                      { label: "Edit", icon: <Pencil size={16} />, onSelect: () => router.push(`/dev/tabs/${t.id}`) },
                      { label: "Delete", icon: <Trash2 size={16} />, destructive: true, onSelect: () => setDel(t) },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {view === "businesses" && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                {["Business", "Plan", "Members", "Transactions", "Requests", "Tabs", "Joined", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">/b/{b.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={b.plan === "starter" ? "default" : "brand"}>{PLANS[b.plan].name}</Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{b.members}</td>
                  <td className="px-4 py-3 tabular-nums">{b.transactions}</td>
                  <td className="px-4 py-3 tabular-nums">{b.openRequests}</td>
                  <td className="px-4 py-3 tabular-nums">{b.tabs}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtLong(b.createdAt.slice(0, 10))}</td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dev/tabs/new?business=${b.id}`}>Build tab</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete “{del?.title}”?</DialogTitle>
            <DialogDescription>
              This removes the tab and every record inside it for {del?.businessName}. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => del && remove(del)}>Delete tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
