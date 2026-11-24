// Pure analytics helpers: safe to import from both server and client code.

export interface Tx {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
}

export interface DayPoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface CatTotal {
  category: string;
  total: number;
}

export interface Totals {
  income: number;
  expense: number;
  net: number;
}

export interface Analysis extends Totals {
  from: string;
  to: string;
  count: number;
  margin: number;
  daily: DayPoint[];
  buckets: DayPoint[];
  incomeByCategory: CatTotal[];
  expenseByCategory: CatTotal[];
  prev: Totals;
  change: { income: number | null; expense: number | null; net: number | null };
}

const DAY = 86_400_000;

export function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function todayIso() {
  return toIso(new Date());
}

export function addDays(iso: string, n: number) {
  return toIso(new Date(new Date(iso + "T00:00:00Z").getTime() + n * DAY));
}

export function daysBetween(from: string, to: string) {
  return Math.round(
    (new Date(to + "T00:00:00Z").getTime() -
      new Date(from + "T00:00:00Z").getTime()) /
      DAY,
  );
}

export function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function pct(cur: number, prev: number) {
  if (prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

function totalsFor(txs: Tx[], from: string, to: string): Totals {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (t.date < from || t.date > to) continue;
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, net: income - expense };
}

function rank(map: Map<string, number>): CatTotal[] {
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function analyze(txs: Tx[], from: string, to: string): Analysis {
  const length = Math.max(1, daysBetween(from, to) + 1);
  const points = new Map<string, DayPoint>();
  for (let i = 0; i < length; i++) {
    const date = addDays(from, i);
    points.set(date, { date, income: 0, expense: 0, net: 0 });
  }

  const inc = new Map<string, number>();
  const exp = new Map<string, number>();
  let count = 0;

  for (const t of txs) {
    if (t.date < from || t.date > to) continue;
    count++;
    const p = points.get(t.date);
    if (!p) continue;
    if (t.type === "income") {
      p.income += t.amount;
      inc.set(t.category, (inc.get(t.category) ?? 0) + t.amount);
    } else {
      p.expense += t.amount;
      exp.set(t.category, (exp.get(t.category) ?? 0) + t.amount);
    }
    p.net = p.income - p.expense;
  }

  const daily = [...points.values()];
  const bucketSize = length > 45 ? 7 : 1;
  const buckets: DayPoint[] = [];
  for (let i = 0; i < daily.length; i += bucketSize) {
    const slice = daily.slice(i, i + bucketSize);
    const income = slice.reduce((s, d) => s + d.income, 0);
    const expense = slice.reduce((s, d) => s + d.expense, 0);
    buckets.push({ date: slice[0].date, income, expense, net: income - expense });
  }

  const cur = totalsFor(txs, from, to);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(length - 1));
  const prev = totalsFor(txs, prevFrom, prevTo);

  return {
    from,
    to,
    count,
    ...cur,
    margin: cur.income === 0 ? 0 : (cur.net / cur.income) * 100,
    daily,
    buckets,
    incomeByCategory: rank(inc),
    expenseByCategory: rank(exp),
    prev,
    change: {
      income: pct(cur.income, prev.income),
      expense: pct(cur.expense, prev.expense),
      net: pct(cur.net, prev.net),
    },
  };
}

/** Previous full Monday–Sunday week. */
export function lastWeekRange(now = new Date()) {
  const today = toIso(now);
  const dow = (now.getUTCDay() + 6) % 7; // Monday = 0
  const thisMonday = addDays(today, -dow);
  return { from: addDays(thisMonday, -7), to: addDays(thisMonday, -1) };
}

/** Previous full calendar month. */
export function lastMonthRange(now = new Date()) {
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastDay = new Date(first.getTime() - DAY);
  const start = new Date(
    Date.UTC(lastDay.getUTCFullYear(), lastDay.getUTCMonth(), 1),
  );
  return { from: toIso(start), to: toIso(lastDay) };
}
