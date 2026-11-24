"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { Bell, BellOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/client";
import type { AppNotification } from "@/lib/db";

const SEEN_KEY = "ddash-notif-toasted";
const POLL_MS = 45_000;

function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
function saveSeen(s: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-100)));
  } catch {
    /* private mode */
  }
}

/** Bell with an inbox. New messages from the developers also pop up as Sileo toasts. */
export function NotificationCenter() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const unread = items.filter((i) => !i.read).length;

  const markRead = useCallback(async (ids: string[] | "all") => {
    setItems((cur) => cur.map((i) => (ids === "all" || ids.includes(i.id) ? { ...i, read: true } : i)));
    await api("/api/notifications", "POST", ids === "all" ? { all: true } : { ids });
  }, []);

  const run = useCallback(
    (n: AppNotification) => {
      if (!n.actionUrl) return;
      markRead([n.id]);
      if (n.actionUrl.startsWith("/")) router.push(n.actionUrl);
      else window.open(n.actionUrl, "_blank", "noopener,noreferrer");
      setOpen(false);
    },
    [markRead, router],
  );

  const poll = useCallback(async () => {
    const r = await api<{ items: AppNotification[] }>("/api/notifications", "GET");
    if (!r.ok || !r.data.items) return;
    const list = r.data.items;
    setItems(list);
    if (!seen.current) seen.current = loadSeen();
    const fresh = list.filter((n) => !n.read && !seen.current!.has(n.id)).slice(0, 3);
    for (const n of [...fresh].reverse()) {
      seen.current.add(n.id);
      sileo.info({
        title: n.title,
        description: n.body || undefined,
        duration: 10_000,
        button: n.actionUrl && n.actionLabel ? { title: n.actionLabel, onClick: () => run(n) } : undefined,
      });
    }
    if (fresh.length) saveSeen(seen.current);
  }, [run]);

  useEffect(() => {
    const first = setTimeout(poll, 0);
    const t = setInterval(poll, POLL_MS);
    const onFocus = () => poll();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [poll]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative">
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => markRead("all")}>
            Mark all read
          </Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="grid place-items-center gap-2 px-4 py-10 text-sm text-muted-foreground">
              <BellOff className="size-5" /> You&apos;re all caught up.
            </div>
          ) : (
            items.map((n) => (
              <div key={n.id} className="border-b px-4 py-3 last:border-0">
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{n.title}</div>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      {n.actionUrl && n.actionLabel && (
                        <Button size="sm" variant="outline" onClick={() => run(n)}>
                          {n.actionLabel}
                          {!n.actionUrl.startsWith("/") && <ExternalLink />}
                        </Button>
                      )}
                      <span className="text-xs text-muted-foreground">{ago(n.createdAt)}</span>
                      {!n.read && (
                        <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => markRead([n.id])}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
