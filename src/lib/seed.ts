import "server-only";
import { addDays, todayIso } from "./analytics";

export interface DemoRow {
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ~100 days of believable demo transactions so charts are not empty. */
export function demoTransactions(seed: string): DemoRow[] {
  const rand = mulberry32(seed.charCodeAt(0) * 977 + 13);
  const out: DemoRow[] = [];
  const today = todayIso();
  const push = (
    type: "income" | "expense",
    amount: number,
    category: string,
    date: string,
    note = "",
  ) =>
    out.push({
      type,
      amount: Math.round(amount * 100) / 100,
      category,
      note,
      date,
    });

  for (let i = 100; i >= 0; i--) {
    const date = addDays(today, -i);
    const dow = new Date(date + "T00:00:00Z").getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const growth = 1 + (100 - i) * 0.004;

    const sales = (weekend ? 900 : 650) * growth * (0.65 + rand() * 0.7);
    push("income", sales, "Sales", date, "Daily sales");
    if (rand() > 0.55) {
      push("income", (180 + rand() * 520) * growth, "Services", date);
    }
    if (dow === 1) {
      push("income", 300 + rand() * 120, "Subscriptions", date, "Weekly plans");
    }
    if (rand() > 0.5) {
      push("expense", 90 + rand() * 260, "Inventory", date, "Stock top-up");
    }
    if (rand() > 0.82) {
      push("expense", 60 + rand() * 180, "Marketing", date, "Ads");
    }
    const dom = Number(date.slice(8, 10));
    if (dom === 1) push("expense", 1800, "Rent", date, "Monthly rent");
    if (dom === 5) push("expense", 3400 + rand() * 300, "Salaries", date, "Payroll");
    if (dom === 12) push("expense", 220 + rand() * 60, "Utilities", date);
    if (dom === 15) push("expense", 149, "Software", date, "Tools & licences");
  }
  return out;
}
