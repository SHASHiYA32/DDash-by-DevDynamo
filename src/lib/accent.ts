// Accent colour themes. Client-safe (no server imports).

export const ACCENTS = [
  { id: "default", label: "Classic", swatch: "#c4f13a", ink: "#0a0a0a" },
  { id: "blue", label: "Blue", swatch: "#3b82f6", ink: "#ffffff" },
  { id: "red", label: "Red", swatch: "#ef4444", ink: "#ffffff" },
  { id: "orange", label: "Orange", swatch: "#f97316", ink: "#ffffff" },
  { id: "yellow", label: "Yellow", swatch: "#facc15", ink: "#0a0a0a" },
  { id: "green", label: "Green", swatch: "#22c55e", ink: "#ffffff" },
  { id: "teal", label: "Teal", swatch: "#14b8a6", ink: "#ffffff" },
  { id: "purple", label: "Purple", swatch: "#8b5cf6", ink: "#ffffff" },
  { id: "pink", label: "Pink", swatch: "#ec4899", ink: "#ffffff" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export const ACCENT_IDS: string[] = ACCENTS.map((a) => a.id);
export const ACCENT_KEY = "ddash-accent";

export function applyAccent(id: string) {
  document.documentElement.setAttribute("data-accent", id);
  // the server reads this cookie and renders data-accent on <html>, so there is no colour flash
  document.cookie = `${ACCENT_KEY}=${id}; path=/; max-age=31536000; samesite=lax`;
}
