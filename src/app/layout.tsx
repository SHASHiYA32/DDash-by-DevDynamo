import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Providers } from "@/components/providers";
import { ACCENT_IDS, ACCENT_KEY } from "@/lib/accent";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DDash — The business dashboard by DevDynamo",
    template: "%s · DDash",
  },
  description:
    "Track income and expenses, manage your team, and get automatic weekly and monthly reports. One beautiful dashboard for every business.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saved = (await cookies()).get(ACCENT_KEY)?.value;
  const accent = saved && ACCENT_IDS.includes(saved) ? saved : undefined;
  return (
    <html
      data-accent={accent}
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
