"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SegmentedControl, Switch } from "glisse";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { TabIcon } from "@/components/custom-icons";
import { CustomTabView } from "@/components/custom/tab-view";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Dropdown, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, notify, withToast } from "@/lib/client";
import {
  FIELD_TYPES,
  keyFromLabel,
  normalizeConfig,
  slugFromTitle,
  TAB_ICON_KEYS,
  type DataConfig,
  type FieldType,
  type PageConfig,
  type TabConfig,
  type TabKind,
} from "@/lib/custom";

export interface BuilderInitial {
  id: string;
  businessId: string;
  requestId: string | null;
  title: string;
  slug: string;
  icon: string;
  kind: TabKind;
  access: "all" | "managers";
  enabled: boolean;
  config: TabConfig;
}

interface BField {
  uid: string;
  key?: string; // kept when editing so stored records stay valid
  label: string;
  type: FieldType;
  required: boolean;
  options: string; // comma separated (select)
}

const NONE = "__none";
let counter = 0;
const uid = () => `u${Date.now().toString(36)}${counter++}`;

function fromConfig(c: TabConfig | undefined): { fields: BField[]; summary: string; chart: { type: string; group: string; value: string }; page: PageConfig } {
  if (c && "fields" in c) {
    return {
      fields: c.fields.map((f) => ({ uid: f.key, key: f.key, label: f.label, type: f.type, required: !!f.required, options: (f.options ?? []).join(", ") })),
      summary: c.summaryField ?? NONE,
      chart: c.chart ? { type: c.chart.type, group: c.chart.groupBy, value: c.chart.value ?? NONE } : { type: NONE, group: NONE, value: NONE },
      page: { content: "", links: [] },
    };
  }
  return {
    fields: [{ uid: uid(), label: "Name", type: "text", required: true, options: "" }],
    summary: NONE,
    chart: { type: NONE, group: NONE, value: NONE },
    page: c && "content" in c ? c : { content: "", links: [] },
  };
}

export function TabBuilder({
  initial,
  businesses,
  prefill,
}: {
  initial: BuilderInitial | null;
  businesses: { id: string; name: string }[];
  prefill: { businessId?: string; requestId?: string; title?: string; hint?: string };
}) {
  const router = useRouter();
  const editing = !!initial;
  const seed = useMemo(() => fromConfig(initial?.config), [initial]);

  const [businessId, setBusinessId] = useState(initial?.businessId ?? prefill.businessId ?? "");
  const [title, setTitle] = useState(initial?.title ?? prefill.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [icon, setIcon] = useState(initial?.icon ?? "layout-grid");
  const [kind, setKind] = useState<TabKind>(initial?.kind ?? "data");
  const [access, setAccess] = useState<"all" | "managers">(initial?.access ?? "all");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [fields, setFields] = useState<BField[]>(seed.fields);
  const [summary, setSummary] = useState(seed.summary);
  const [chartType, setChartType] = useState(seed.chart.type);
  const [chartGroup, setChartGroup] = useState(seed.chart.group);
  const [chartValue, setChartValue] = useState(seed.chart.value);
  const [page, setPage] = useState<PageConfig>(seed.page);
  const [saving, setSaving] = useState(false);

  // resolve a stable key for every field (existing keys are kept)
  const keyed = useMemo(() => {
    const used = new Set<string>();
    return fields.map((f) => {
      let key = f.key ?? keyFromLabel(f.label || "field");
      for (let n = 2; used.has(key); n++) key = `${keyFromLabel(f.label || "field").slice(0, 26)}_${n}`;
      used.add(key);
      return { ...f, key };
    });
  }, [fields]);
  const keyOf = (u: string) => keyed.find((f) => f.uid === u)?.key ?? "";

  const rawConfig = useMemo(() => {
    if (kind === "page") return page;
    return {
      fields: keyed.map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        options: f.type === "select" ? f.options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      })),
      summaryField: summary === NONE ? null : keyOf(summary),
      chart: chartType === NONE || chartGroup === NONE ? null : { type: chartType, groupBy: keyOf(chartGroup), value: chartValue === NONE ? null : keyOf(chartValue) },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, page, keyed, summary, chartType, chartGroup, chartValue]);

  const checked = useMemo(() => normalizeConfig(kind, rawConfig), [kind, rawConfig]);

  const numberFields = fields.filter((f) => f.type === "number");
  const groupFields = fields.filter((f) => ["select", "text", "date"].includes(f.type));
  const label = (f: BField) => f.label || "Untitled field";

  const patchField = (u: string, p: Partial<BField>) => setFields((fs) => fs.map((f) => (f.uid === u ? { ...f, ...p } : f)));
  const move = (i: number, d: -1 | 1) =>
    setFields((fs) => {
      const j = i + d;
      if (j < 0 || j >= fs.length) return fs;
      const next = [...fs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function save() {
    if (!businessId) return notify.warning("Choose a business");
    if (!title.trim()) return notify.warning("Give the tab a title");
    if (!checked.ok) return notify.warning("Fix the tab first", checked.error);
    setSaving(true);
    const body = {
      id: initial?.id,
      businessId,
      requestId: initial?.requestId ?? prefill.requestId ?? null,
      title,
      slug: slug || undefined,
      icon,
      kind,
      access,
      enabled,
      config: rawConfig,
    };
    const r = await withToast(() => api("/api/dev/tabs", editing ? "PATCH" : "POST", body), {
      loading: "Saving tab…",
      success: editing ? "Tab updated" : "Tab is live for that business",
      error: "Couldn't save the tab",
    });
    setSaving(false);
    if (r.ok) {
      router.push("/dev");
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/dev">
              <ArrowLeft /> Console
            </Link>
          </Button>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{editing ? "Edit tab" : "Build a tab from scratch"}</h1>
        </div>
        <Button onClick={save} disabled={saving}>
          {editing ? "Save changes" : "Publish tab"}
        </Button>
      </div>

      {prefill.hint && (
        <Card className="border-dashed p-4 text-sm">
          <span className="font-medium">Customer request: </span>
          <span className="text-muted-foreground">{prefill.hint}</span>
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tb-biz">Business</Label>
                <Dropdown id="tb-biz" value={businessId} onChange={setBusinessId} options={businesses.map((b) => ({ value: b.id, label: b.name }))} placeholder="Choose a business" disabled={editing} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tb-title">Tab title</Label>
                  <Input
                    id="tb-title"
                    value={title}
                    maxLength={40}
                    placeholder="e.g. Supplier orders"
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!slugTouched) setSlug(slugFromTitle(e.target.value));
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tb-slug">Address</Label>
                  <Input
                    id="tb-slug"
                    value={slug}
                    maxLength={40}
                    placeholder="supplier-orders"
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugFromTitle(e.target.value));
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tb-icon">Icon</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger id="tb-icon">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAB_ICON_KEYS.map((k) => (
                        <SelectItem key={k} value={k}>
                          <span className="flex items-center gap-2">
                            <TabIcon name={k} className="size-4" /> {k.replace("-", " ")}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tb-access">Who can see it</Label>
                  <Dropdown
                    id="tb-access"
                    value={access}
                    onChange={(v) => setAccess(v as "all" | "managers")}
                    options={[
                      { value: "all", label: "Everyone (incl. employees)" },
                      { value: "managers", label: "Owner and admins only" },
                    ]}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid gap-2">
                  <Label>Type</Label>
                  {editing ? (
                    <Badge tone="outline">{kind === "data" ? "Data tab" : "Page"} (can&apos;t change)</Badge>
                  ) : (
                    <SegmentedControl
                      className="self-start justify-self-start"
                      aria-label="Tab type"
                      value={kind}
                      onValueChange={(v) => setKind(v as TabKind)}
                      items={[
                        { value: "data", label: "Data tab" },
                        { value: "page", label: "Info page" },
                      ]}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  Live
                  <Switch aria-label="Tab is live" checked={enabled} onCheckedChange={setEnabled} />
                </div>
              </div>
            </CardContent>
          </Card>

          {kind === "data" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Fields</CardTitle>
                  <CardDescription>Each field becomes a column and a form input. Users add, edit and delete records.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {fields.map((f, i) => (
                    <div key={f.uid} className="grid gap-3 rounded-xl border p-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
                        <Input aria-label="Field label" value={f.label} maxLength={40} placeholder="Field name" onChange={(e) => patchField(f.uid, { label: e.target.value })} />
                        <Dropdown value={f.type} onChange={(v) => patchField(f.uid, { type: v as FieldType })} options={FIELD_TYPES} />
                      </div>
                      {f.type === "select" && (
                        <Input aria-label="Dropdown options" value={f.options} placeholder="Options, separated by commas: Pending, Paid, Late" onChange={(e) => patchField(f.uid, { options: e.target.value })} />
                      )}
                      <div className="flex items-center justify-between gap-3">
                        {f.type === "checkbox" ? (
                          <span className="text-xs text-muted-foreground">Yes / No toggle</span>
                        ) : (
                          <label className="flex items-center gap-2 text-sm">
                            <Switch aria-label="Required" checked={f.required} onCheckedChange={(v) => patchField(f.uid, { required: v })} />
                            Required
                          </label>
                        )}
                        <div className="flex gap-1">
                          <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                            <ChevronUp />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === fields.length - 1} onClick={() => move(i, 1)}>
                            <ChevronDown />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" aria-label="Remove field" disabled={fields.length === 1} onClick={() => setFields((fs) => fs.filter((x) => x.uid !== f.uid))}>
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" disabled={fields.length >= 30} onClick={() => setFields((fs) => [...fs, { uid: uid(), label: "", type: "text", required: false, options: "" }])}>
                    <Plus /> Add field
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Numbers & chart</CardTitle>
                  <CardDescription>Optional totals and an animated chart for the tab.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Total / average of</Label>
                    <Dropdown value={summary} onChange={setSummary} options={[{ value: NONE, label: "None" }, ...numberFields.map((f) => ({ value: f.uid, label: label(f) }))]} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label>Chart</Label>
                      <Dropdown
                        value={chartType}
                        onChange={setChartType}
                        options={[
                          { value: NONE, label: "No chart" },
                          { value: "bar", label: "Bars" },
                          { value: "donut", label: "Donut" },
                          { value: "line", label: "Line (by date)" },
                        ]}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Group by</Label>
                      <Dropdown
                        value={chartGroup}
                        onChange={setChartGroup}
                        disabled={chartType === NONE}
                        options={[
                          { value: NONE, label: "Choose a field" },
                          ...groupFields.filter((f) => (chartType === "line" ? f.type === "date" : true)).map((f) => ({ value: f.uid, label: label(f) })),
                        ]}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Value</Label>
                      <Dropdown value={chartValue} onChange={setChartValue} disabled={chartType === NONE} options={[{ value: NONE, label: "Count rows" }, ...numberFields.map((f) => ({ value: f.uid, label: `Sum of ${label(f)}` }))]} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Page content</CardTitle>
                <CardDescription>Use “# Heading”, “## Subheading”, “- bullet” and **bold**.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Textarea aria-label="Page content" className="min-h-48" value={page.content} onChange={(e) => setPage((p) => ({ ...p, content: e.target.value }))} maxLength={8000} />
                <div className="grid gap-2">
                  <Label>Buttons / links</Label>
                  {page.links.map((l, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                      <Input aria-label="Link label" placeholder="Label" value={l.label} onChange={(e) => setPage((p) => ({ ...p, links: p.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
                      <Input aria-label="Link URL" placeholder="https://…" value={l.url} onChange={(e) => setPage((p) => ({ ...p, links: p.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) }))} />
                      <Button type="button" variant="ghost" size="icon" aria-label="Remove link" onClick={() => setPage((p) => ({ ...p, links: p.links.filter((_, j) => j !== i) }))}>
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" disabled={page.links.length >= 8} onClick={() => setPage((p) => ({ ...p, links: [...p.links, { label: "", url: "" }] }))}>
                    <Plus /> Add link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:sticky lg:top-20">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>This is exactly what the business will see. Try adding a record.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[75vh] overflow-y-auto">
              {checked.ok ? (
                <CustomTabView
                  key={JSON.stringify(checked.value)}
                  preview
                  tab={{ id: "preview", title: title || "Untitled tab", kind, config: checked.value as DataConfig | PageConfig }}
                  records={[]}
                />
              ) : (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{checked.error}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
