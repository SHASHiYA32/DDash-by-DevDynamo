"use client";

import { useMemo, useState } from "react";
import { Menu, SearchField, Switch } from "glisse";
import { Check, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { GenericChart } from "@/components/custom/generic-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/select";
import { api, notify, withToast } from "@/lib/client";
import { buildChartData, type DataConfig, type Field, type PageConfig, type TabConfig, type TabKind } from "@/lib/custom";
import { fmtLong } from "@/lib/analytics";

type Data = Record<string, string | number | boolean>;
export interface Rec {
  id: string;
  data: Data;
  createdAt: string;
}

interface Props {
  tab: { id: string; title: string; kind: TabKind; config: TabConfig };
  records: Rec[];
  /** preview = developer builder: nothing is saved, records live in memory only */
  preview?: boolean;
}

const num = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function Cell({ field, value }: { field: Field; value: Data[string] | undefined }) {
  if (value === undefined || value === "") return <span className="text-muted-foreground/50">—</span>;
  if (field.type === "checkbox") return value ? <Check className="size-4" aria-label="Yes" /> : <span className="text-muted-foreground/50">—</span>;
  if (field.type === "number") return <span className="tabular-nums">{num(Number(value))}</span>;
  if (field.type === "date") return <span>{fmtLong(String(value))}</span>;
  return <span className="line-clamp-2">{String(value)}</span>;
}

/** Tiny safe renderer for page tabs: "# Heading", "## Subheading", "- bullet", **bold**. No HTML is ever injected. */
function RichText({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
    );
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) {
      out.push(
        <ul key={`l${out.length}`} className="ml-5 list-disc space-y-1">
          {list.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  text.split("\n").forEach((line, i) => {
    if (line.startsWith("- ")) return void list.push(line.slice(2));
    flush();
    if (line.startsWith("## ")) out.push(<h3 key={i} className="mt-4 text-lg font-semibold">{inline(line.slice(3))}</h3>);
    else if (line.startsWith("# ")) out.push(<h2 key={i} className="mt-4 text-xl font-semibold">{inline(line.slice(2))}</h2>);
    else if (line.trim()) out.push(<p key={i}>{inline(line)}</p>);
  });
  flush();
  return <div className="grid gap-2 text-sm leading-relaxed">{out}</div>;
}

export function CustomTabView({ tab, records, preview }: Props) {
  if (tab.kind === "page") {
    const c = tab.config as PageConfig;
    return (
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">{tab.title}</h1>
        <Card>
          <CardContent className="grid gap-5">
            {c.content && <RichText text={c.content} />}
            {c.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {c.links.map((l) => (
                  <Button key={l.url + l.label} asChild variant="outline">
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.label} <ExternalLink />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  return <DataTab tab={tab} config={tab.config as DataConfig} initial={records} preview={preview} />;
}

function DataTab({ tab, config, initial, preview }: { tab: Props["tab"]; config: DataConfig; initial: Rec[]; preview?: boolean }) {
  const [rows, setRows] = useState<Rec[]>(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rec | null>(null);
  const [form, setForm] = useState<Data>({});
  const [saving, setSaving] = useState(false);

  const { fields } = config;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => Object.values(r.data).join(" ").toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const summary = config.summaryField ? fields.find((f) => f.key === config.summaryField) : null;
  const sum = summary ? rows.reduce((s, r) => s + (Number(r.data[summary.key]) || 0), 0) : 0;
  const chart = config.chart;
  const chartPts = useMemo(
    () => (chart ? buildChartData(fields, rows.map((r) => r.data), chart) : []),
    [chart, fields, rows],
  );
  const valueLabel = chart?.value ? (fields.find((f) => f.key === chart.value)?.label ?? "Total") : "Records";

  function startAdd() {
    setEditing(null);
    setForm(Object.fromEntries(fields.filter((f) => f.type === "checkbox").map((f) => [f.key, false])));
    setOpen(true);
  }
  function startEdit(r: Rec) {
    setEditing(r);
    setForm({ ...r.data });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && f.type !== "checkbox" && (form[f.key] === undefined || form[f.key] === "")) {
        notify.warning(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    if (preview) {
      setRows((rs) =>
        editing
          ? rs.map((r) => (r.id === editing.id ? { ...r, data: form } : r))
          : [{ id: `p${Date.now()}`, data: form, createdAt: new Date().toISOString() }, ...rs],
      );
      notify.success(editing ? "Preview record updated" : "Preview record added", "Nothing is saved in preview mode.");
      setSaving(false);
      setOpen(false);
      return;
    }
    const r = await withToast(
      () =>
        editing
          ? api("/api/custom/records", "PATCH", { tabId: tab.id, id: editing.id, data: form })
          : api<{ record?: Rec }>("/api/custom/records", "POST", { tabId: tab.id, data: form }),
      { loading: "Saving…", success: editing ? "Record updated" : "Record added", error: "Couldn't save" },
    );
    setSaving(false);
    if (!r.ok) return;
    const created = (r.data as { record?: Rec }).record;
    setRows((rs) =>
      editing ? rs.map((x) => (x.id === editing.id ? { ...x, data: form } : x)) : created ? [created, ...rs] : rs,
    );
    setOpen(false);
  }

  async function remove(r: Rec) {
    if (!preview) {
      const res = await withToast(() => api(`/api/custom/records?tabId=${tab.id}&id=${r.id}`, "DELETE"), {
        loading: "Deleting…",
        success: "Record deleted",
        error: "Couldn't delete",
      });
      if (!res.ok) return;
    }
    setRows((rs) => rs.filter((x) => x.id !== r.id));
  }

  const set = (key: string, v: string | number | boolean) => setForm((f) => ({ ...f, [key]: v }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tab.title}</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "record" : "records"}
          </p>
        </div>
        <Button onClick={startAdd}>
          <Plus /> Add record
        </Button>
      </div>

      {(summary || chart) && (
        <div className="grid gap-4 lg:grid-cols-3">
          {summary && (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <Card className="p-5">
                <div className="text-sm text-muted-foreground">Total {summary.label.toLowerCase()}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{num(sum)}</div>
              </Card>
              <Card className="p-5">
                <div className="text-sm text-muted-foreground">Average {summary.label.toLowerCase()}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{rows.length ? num(sum / rows.length) : "0"}</div>
              </Card>
            </div>
          )}
          {chart && (
            <Card className={summary ? "lg:col-span-2" : "lg:col-span-3"}>
              <CardHeader>
                <CardTitle>{valueLabel} by {fields.find((f) => f.key === chart.groupBy)?.label.toLowerCase()}</CardTitle>
                <CardDescription>Updates as you add records</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <GenericChart type={chart.type} data={chartPts} valueLabel={valueLabel} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="sm:w-80">
        <SearchField aria-label="Search records" placeholder="Search records" value={query} onValueChange={setQuery} />
      </div>

      <Card className="overflow-hidden">
        {shown.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No records yet. Add your first one." : "Nothing matches your search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  {fields.map((f) => (
                    <th key={f.key} className="px-4 py-3 font-medium whitespace-nowrap">{f.label}</th>
                  ))}
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {shown.slice(0, 200).map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    {fields.map((f) => (
                      <td key={f.key} className="max-w-[260px] px-4 py-3 align-top">
                        <Cell field={f} value={r.data[f.key]} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <Menu
                        aria-label="Record actions"
                        align="end"
                        items={[
                          { label: "Edit", icon: <Pencil size={16} />, onSelect: () => startEdit(r) },
                          { label: "Delete", icon: <Trash2 size={16} />, destructive: true, onSelect: () => remove(r) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit record" : `Add to ${tab.title}`}</DialogTitle>
            <DialogDescription>{preview ? "Preview only, nothing is saved." : "Fill in the details below."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4">
            {fields.map((f, i) => (
              <div key={f.key} className="grid gap-2">
                {f.type === "checkbox" ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
                    <Switch aria-label={f.label} checked={!!form[f.key]} onCheckedChange={(v) => set(f.key, v)} />
                  </div>
                ) : (
                  <>
                    <Label htmlFor={`f-${f.key}`}>
                      {f.label}
                      {f.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {f.type === "textarea" ? (
                      <Textarea id={`f-${f.key}`} value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} maxLength={2000} />
                    ) : f.type === "number" ? (
                      <Input id={`f-${f.key}`} type="number" step="any" inputMode="decimal" value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} autoFocus={i === 0} />
                    ) : f.type === "date" ? (
                      <DatePicker id={`f-${f.key}`} value={String(form[f.key] ?? "")} onChange={(v) => set(f.key, v)} />
                    ) : f.type === "select" ? (
                      <Dropdown id={`f-${f.key}`} value={String(form[f.key] ?? "")} onChange={(v) => set(f.key, v)} options={f.options ?? []} placeholder="Choose…" />
                    ) : (
                      <Input id={`f-${f.key}`} value={String(form[f.key] ?? "")} onChange={(e) => set(f.key, e.target.value)} maxLength={200} autoFocus={i === 0} />
                    )}
                  </>
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {editing ? "Save changes" : "Add record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

