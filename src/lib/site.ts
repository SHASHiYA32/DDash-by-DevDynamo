import { PLANS } from "@/lib/plans";

/** Canonical public address. Set NEXT_PUBLIC_SITE_URL in Vercel when you add a custom domain. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ddash-by-devdynamo.vercel.app").replace(/\/$/, "");

export const SITE = {
  name: "DDash",
  title: "DDash: Business Dashboard & Reports Software for Small Business",
  description:
    "DDash is a simple business dashboard for small businesses: track income and expenses with live charts, give employees their own login, and get automatic weekly and monthly reports. Free to start.",
  keywords: [
    "business dashboard",
    "small business dashboard",
    "business management software",
    "income and expense tracker",
    "automatic business reports",
    "weekly and monthly reports",
    "employee login",
    "sales tracking",
    "profit and loss dashboard",
    "business analytics",
    "SaaS dashboard",
    "DDash",
    "DevDynamo",
  ],
};

export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    publisher: { "@type": "Organization", name: "DevDynamo", url: "https://dev-dynamo-official.vercel.app" },
    offers: Object.values(PLANS).map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.priceMonthly,
      priceCurrency: "USD",
      url: `${SITE_URL}/register?plan=${p.id}`,
    })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
