// Shared (client + server) definitions for developer-built custom tabs.

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox";

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // select only
}

export interface ChartConfig {
  type: "bar" | "donut" | "line";
  /** field to group by (select / text / date) */
  groupBy: string;
  /** number field to sum, or null to count rows */
  value: string | null;
}

export interface DataConfig {
  fields: Field[];
  /** number field shown as Total / Average cards, or null */
  summaryField: string | null;
  chart: ChartConfig | null;
}

export interface PageConfig {
  content: string;
  links: { label: string; url: string }[];
}

export type TabKind = "data" | "page";
export type TabConfig = DataConfig | PageConfig;

export const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Yes / No" },
];

export const TAB_ICON_KEYS = [
  "layout-grid",
  "clipboard-list",
  "package",
  "shopping-cart",
  "truck",
  "calendar",
  "users",
  "wallet",
  "star",
  "heart",
  "tag",
  "map-pin",
  "phone",
  "file-text",
  "wrench",
  "graduation-cap",
  "utensils",
  "car",
  "bar-chart",
  "bell",
] as const;

export function keyFromLabel(label: string) {
  const k = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  return /^[a-z]/.test(k) ? k : `f_${k || "field"}`;
}

export function slugFromTitle(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tab"
  );
}

const RESERVED = new Set(["custom", "settings", "reports", "transactions", "employees", "t"]);
export const isReservedSlug = (s: string) => RESERVED.has(s);

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Validates and cleans a tab config coming from the developer builder. */
export function normalizeConfig(kind: TabKind, raw: unknown): Result<TabConfig> {
  const r = (raw ?? {}) as Record<string, unknown>;

  if (kind === "page") {
    const content = String(r.content ?? "").slice(0, 8000);
    const links: PageConfig["links"] = [];
    for (const l of Array.isArray(r.links) ? r.links.slice(0, 8) : []) {
      const label = String((l as { label?: unknown })?.label ?? "").trim().slice(0, 60);
      const url = String((l as { url?: unknown })?.url ?? "").trim();
      if (!label && !url) continue;
      if (!label || !/^https?:\/\/\S+$/i.test(url)) return fail("Each link needs a label and a full http(s) URL");
      links.push({ label, url });
    }
    if (!content.trim() && links.length === 0) return fail("Add some content or at least one link");
    return { ok: true, value: { content, links } };
  }

  const rawFields = Array.isArray(r.fields) ? r.fields : [];
  if (rawFields.length === 0) return fail("Add at least one field");
  if (rawFields.length > 30) return fail("A tab can have at most 30 fields");

  const used = new Set<string>();
  const fields: Field[] = [];
  for (const f of rawFields) {
    const o = f as Partial<Field>;
    const label = String(o.label ?? "").trim().slice(0, 40);
    if (!label) return fail("Every field needs a label");
    const type = FIELD_TYPES.find((t) => t.value === o.type)?.value;
    if (!type) return fail(`Pick a type for “${label}”`);
    let key = o.key && /^[a-z][a-z0-9_]{0,29}$/.test(o.key) ? o.key : keyFromLabel(label);
    for (let n = 2; used.has(key); n++) key = `${keyFromLabel(label).slice(0, 26)}_${n}`;
    used.add(key);
    const field: Field = { key, label, type, required: !!o.required && type !== "checkbox" };
    if (type === "select") {
      const options = [...new Set((o.options ?? []).map((x) => String(x).trim().slice(0, 40)).filter(Boolean))].slice(0, 30);
      if (options.length === 0) return fail(`“${label}” needs at least one dropdown option`);
      field.options = options;
    }
    fields.push(field);
  }

  const byKey = new Map(fields.map((f) => [f.key, f]));
  const summaryRaw = r.summaryField ? String(r.summaryField) : null;
  if (summaryRaw && byKey.get(summaryRaw)?.type !== "number") return fail("The summary field must be a number field");

  let chart: ChartConfig | null = null;
  const c = r.chart as Partial<ChartConfig> | null | undefined;
  if (c && c.groupBy) {
    const g = byKey.get(String(c.groupBy));
    if (!g || !["select", "text", "date"].includes(g.type)) return fail("Charts can group by a dropdown, text or date field");
    const value = c.value ? String(c.value) : null;
    if (value && byKey.get(value)?.type !== "number") return fail("Chart values must be a number field");
    const type = c.type === "donut" || c.type === "line" ? c.type : "bar";
    if (type === "line" && g.type !== "date") return fail("Line charts need a date field to group by");
    chart = { type, groupBy: g.key, value };
  }

  return { ok: true, value: { fields, summaryField: summaryRaw, chart } };
}

/** Validates a record submitted against a tab's fields. Returns cleaned data. */
export function validateRecord(fields: Field[], input: unknown): Result<Record<string, string | number | boolean>> {
  const src = (input ?? {}) as Record<string, unknown>;
  const out: Record<string, string | number | boolean> = {};
  for (const f of fields) {
    const v = src[f.key];
    const empty = v === undefined || v === null || v === "";
    if (f.type === "checkbox") {
      out[f.key] = v === true || v === "true";
      continue;
    }
    if (empty) {
      if (f.required) return fail(`${f.label} is required`);
      continue;
    }
    switch (f.type) {
      case "text":
        out[f.key] = String(v).trim().slice(0, 200);
        break;
      case "textarea":
        out[f.key] = String(v).trim().slice(0, 2000);
        break;
      case "number": {
        const n = Number(v);
        if (!Number.isFinite(n) || Math.abs(n) > 1e12) return fail(`${f.label} must be a number`);
        out[f.key] = n;
        break;
      }
      case "date":
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return fail(`${f.label} must be a valid date`);
        out[f.key] = String(v);
        break;
      case "select":
        if (!f.options?.includes(String(v))) return fail(`Choose a valid option for ${f.label}`);
        out[f.key] = String(v);
        break;
    }
  }
  return { ok: true, value: out };
}

export interface ChartPoint {
  label: string;
  value: number;
}

type RecordData = Record<string, string | number | boolean>;

/** Groups rows for a tab chart: sums a number field per group, or counts rows. */
export function buildChartData(fields: Field[], rows: RecordData[], chart: ChartConfig): ChartPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const g = r[chart.groupBy];
    if (g === undefined || g === "") continue;
    const add = chart.value ? Number(r[chart.value] ?? 0) : 1;
    map.set(String(g), (map.get(String(g)) ?? 0) + (Number.isFinite(add) ? add : 0));
  }
  const pts = [...map].map(([label, value]) => ({ label, value }));
  const isDate = fields.find((f) => f.key === chart.groupBy)?.type === "date";
  pts.sort((a, b) => (isDate ? a.label.localeCompare(b.label) : b.value - a.value));
  return pts.slice(0, 40);
}
