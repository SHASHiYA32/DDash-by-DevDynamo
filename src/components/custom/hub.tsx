"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Send } from "lucide-react";
import { TabIcon } from "@/components/custom-icons";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { api, notify } from "@/lib/client";
import { BRAND } from "@/lib/brand";
import { fmtLong } from "@/lib/analytics";

interface Req {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "delivered" | "declined";
  extra: boolean;
  devNote: string;
  createdAt: string;
}

interface Props {
  planName: string;
  allowance: number;
  used: number;
  requests: Req[];
  tabs: { slug: string; title: string; icon: string; kind: string }[];
}

const STATUS: Record<Req["status"], { label: string; tone: "default" | "brand" | "outline" | "danger" }> = {
  pending: { label: "Waiting for developers", tone: "outline" },
  in_progress: { label: "In progress", tone: "default" },
  delivered: { label: "Delivered", tone: "brand" },
  declined: { label: "Declined", tone: "danger" },
};

export function CustomHub({ planName, allowance, used, requests, tabs }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const left = Math.max(0, allowance - used);
  const willBeExtra = used >= allowance;
  const pct = Math.min(100, (used / allowance) * 100);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await api<{ extra?: boolean }>("/api/custom/requests", "POST", { title, description });
    setBusy(false);
    if (!r.ok) return notify.error("Couldn't send your idea", r.error);
    notify.success(
      "Sent to the developers",
      r.data.extra ? "This one is a paid add-on. We'll contact you with a quote." : "We'll get back to you soon.",
    );
    setTitle("");
    setDescription("");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Custom upgrades</h1>
        <p className="text-sm text-muted-foreground">Want a tab built around your idea? Contact the developers!</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Included in {planName}</CardTitle>
            <CardDescription>Upgrades built just for you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {Math.min(used, allowance)}
              <span className="text-base font-normal text-muted-foreground"> / {allowance} used</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {left > 0
                ? `${left} included upgrade${left === 1 ? "" : "s"} left. More than ${allowance} are paid add-ons.`
                : "You've used all included upgrades. Extra ones are paid add-ons, we'll send a quote."}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Describe your idea</CardTitle>
            <CardDescription>A tracker, a form, a list, a page: tell us what your business needs.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cr-title">Title</Label>
                <Input id="cr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Supplier orders tracker" minLength={3} maxLength={80} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cr-desc">What should it do?</Label>
                <Textarea id="cr-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us what to track and who will use it." minLength={10} maxLength={2000} required />
              </div>
              {willBeExtra && (
                <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  This will be a <strong className="text-foreground">paid add-on</strong>. We&apos;ll contact you with a price before building.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  <Send /> Send to developers
                </Button>
                <Button asChild type="button" variant="outline">
                  <a href={BRAND.companyUrl} target="_blank" rel="noopener noreferrer">
                    Contact {BRAND.company} <ExternalLink />
                  </a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {tabs.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold">Your custom tabs</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tabs.map((t) => (
              <Link key={t.slug} href={`/dashboard/t/${t.slug}`}>
                <Card className="flex items-center gap-3 p-4 transition-colors hover:border-foreground/30">
                  <span className="grid size-10 place-items-center rounded-lg bg-secondary">
                    <TabIcon name={t.icon} className="size-5" />
                  </span>
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.kind === "data" ? "Data tab" : "Page"}</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Your requests</h2>
        <Card className="overflow-hidden">
          {requests.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No requests yet. Send your first idea above.</p>
          ) : (
            <ul className="divide-y">
              {requests.map((r) => (
                <li key={r.id} className="grid gap-1.5 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{r.title}</span>
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                    {r.extra && <Badge tone="outline">Paid add-on</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  {r.devNote && (
                    <p className="rounded-lg bg-secondary p-3 text-sm">
                      <span className="font-medium">Developer note: </span>
                      {r.devNote}
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">Sent {fmtLong(r.createdAt.slice(0, 10))}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
