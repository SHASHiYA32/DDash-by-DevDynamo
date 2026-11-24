import pkg from "../../package.json";

export const BRAND = {
  name: "DDash",
  tagline: "The business dashboard that runs while you sleep.",
  company: "DevDynamo",
  companyUrl: "https://dev-dynamo-official.vercel.app",
};

export const APP_VERSION = pkg.version;
export const APP_RELEASE = "Nov 2026";

export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "LKR",
  "INR",
  "AUD",
  "CAD",
  "AED",
  "SGD",
  "JPY",
  "ZAR",
  "NZD",
] as const;

export const INDUSTRIES = [
  "Retail",
  "Restaurant & Cafe",
  "Services",
  "E-commerce",
  "Agency",
  "Manufacturing",
  "Healthcare",
  "Education",
  "Other",
] as const;

export const INCOME_CATEGORIES = ["Sales", "Services", "Subscriptions", "Other income"];
export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Rent",
  "Inventory",
  "Marketing",
  "Utilities",
  "Software",
  "Other expense",
];
