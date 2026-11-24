"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sileo";
import "sileo/styles.css";

/** Every notification in DDash is a Sileo toast: black on light, white on dark. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <Toaster
      position="top-center"
      offset={{ top: 16 }}
      options={{
        fill: dark ? "#fafafa" : "#0a0a0a",
        roundness: 16,
        styles: dark
          ? {
              title: "text-black!",
              description: "text-black/65!",
              badge: "bg-black/10!",
              button: "bg-black/10! text-black! hover:bg-black/15!",
            }
          : {
              title: "text-white!",
              description: "text-white/70!",
              badge: "bg-white/15!",
              button: "bg-white/15! text-white! hover:bg-white/25!",
            },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute={["class", "data-theme"]} defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
