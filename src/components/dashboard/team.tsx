"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Switch } from "glisse";
import { Copy, ExternalLink, Plus, RefreshCw, ShieldCheck, ShieldOff, Trash2, UserCheck, UserX } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMounted } from "@/components/mounted";
import { api, notify, withToast } from "@/lib/client";
import { fmtLong } from "@/lib/analytics";
import { initials } from "@/lib/utils";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "employee";
  active: boolean;
  createdAt: string;
}

interface Props {
  members: Member[];
  /** -1 = unlimited */
  limit: number;
  planName: string;
  userId: string;
  userRole: "owner" | "admin" | "employee";
  slug: string;
  portalEnabled: boolean;
}

function randomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function Team({ members, limit, planName, userId, userRole, slug, portalEnabled }: Props) {
  const router = useRouter();
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const [saving, setSaving] = useState(false);
  const [portal, setPortal] = useState(portalEnabled);

  const unlimited = limit < 0;
  const full = !unlimited && members.length >= limit;
  const portalUrl = mounted ? `${window.location.origin}/b/${slug}` : `/b/${slug}`;

  function openDialog() {
    if (full) {
      notify.warning("Team is full", `Your ${planName} plan allows ${limit} members. Upgrade to add more.`);
      return;
    }
    setPassword(randomPassword());
    setOpen(true);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await withToast(() => api("/api/employees", "POST", { name, email, password, role }), {
      loading: "Creating account…",
      success: "Team member added",
      error: "Couldn't add member",
    });
    setSaving(false);
    if (r.ok) {
      try {
        await navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}\nLogin: ${portalUrl}`);
        notify.info("Login details copied", "Share them with your employee securely.");
      } catch {
        /* clipboard unavailable: the details are still visible in the dialog */
      }
      setOpen(false);
      setName("");
      setEmail("");
      router.refresh();
    }
  }

  async function patch(id: string, body: { role?: "admin" | "employee"; active?: boolean }, success: string) {
    const r = await withToast(() => api("/api/employees", "PATCH", { id, ...body }), {
      loading: "Updating…",
      success,
      error: "Couldn't update",
    });
    if (r.ok) router.refresh();
  }

  async function remove(m: Member) {
    const r = await withToast(() => api(`/api/employees?id=${m.id}`, "DELETE"), {
      loading: "Removing…",
      success: `${m.name} removed`,
      error: "Couldn't remove",
    });
    if (r.ok) router.refresh();
  }

  async function togglePortal(next: boolean) {
    setPortal(next);
    const r = await withToast(() => api("/api/business", "PATCH", { employeePortal: next }), {
      loading: "Saving…",
      success: next ? "Employee login is on" : "Employee login is off",
      error: "Couldn't update",
    });
    if (!r.ok) setPortal(!next);
    else router.refresh();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      notify.success("Link copied", "Send it to your employees.");
    } catch {
      notify.error("Couldn't copy", portalUrl);
    }
  }

  const pct = unlimited ? 0 : Math.min(100, (members.length / limit) * 100);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">Give your employees their own login.</p>
        </div>
        <Button onClick={openDialog}>
          <Plus /> Add team member
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Seats</CardTitle>
            <CardDescription>{planName} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">
              {members.length}
              <span className="text-base font-normal text-muted-foreground">
                {unlimited ? " · unlimited" : ` / ${limit}`}
              </span>
            </div>
            {!unlimited && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Employee login page</CardTitle>
                <CardDescription className="mt-1.5">
                  A branded sign-in page just for your team. Turn it off to block all employee access.
                </CardDescription>
              </div>
              <Switch aria-label="Employee login" checked={portal} onCheckedChange={togglePortal} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={portalUrl} aria-label="Employee login link" className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyLink}>
                  <Copy /> Copy
                </Button>
                <Button variant="outline" size="icon" asChild aria-label="Open login page">
                  <a href={`/b/${slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <ul className="divide-y">
          {members.map((m) => {
            const self = m.id === userId;
            const protectedRow = m.role === "owner" || self || (m.role === "admin" && userRole !== "owner");
            const items = [];
            if (userRole === "owner") {
              items.push(
                m.role === "admin"
                  ? { label: "Make employee", icon: <ShieldOff size={16} />, onSelect: () => patch(m.id, { role: "employee" }, "Role updated") }
                  : { label: "Make admin", icon: <ShieldCheck size={16} />, onSelect: () => patch(m.id, { role: "admin" }, "Role updated") },
              );
            }
            items.push(
              m.active
                ? { label: "Deactivate", icon: <UserX size={16} />, onSelect: () => patch(m.id, { active: false }, "Account deactivated") }
                : { label: "Reactivate", icon: <UserCheck size={16} />, onSelect: () => patch(m.id, { active: true }, "Account reactivated") },
            );

            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                  {initials(m.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{m.name}</span>
                    {self && <Badge tone="outline">You</Badge>}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.email} · joined {fmtLong(m.createdAt.slice(0, 10))}
                  </div>
                </div>
                {!m.active && <Badge tone="danger">Inactive</Badge>}
                <Badge tone={m.role === "owner" ? "brand" : "default"} className="capitalize">
                  {m.role}
                </Badge>
                {protectedRow ? (
                  <span className="w-10" />
                ) : (
                  <Menu
                    aria-label={`Actions for ${m.name}`}
                    align="end"
                    items={[
                      ...items,
                      "separator",
                      { label: "Remove", icon: <Trash2 size={16} />, destructive: true, onSelect: () => remove(m) },
                    ]}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>
              They sign in with this email and password. Login details are copied when you save.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={add} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="m-name">Full name</Label>
              <Input id="m-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-email">Email</Label>
              <Input id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="m-pass">Temporary password</Label>
              <div className="flex gap-2">
                <Input
                  id="m-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="font-mono"
                />
                <Button type="button" variant="outline" size="icon" aria-label="Generate password" onClick={() => setPassword(randomPassword())}>
                  <RefreshCw />
                </Button>
              </div>
            </div>
            {userRole === "owner" && (
              <div className="grid gap-2">
                <Label htmlFor="m-role">Role</Label>
                <Dropdown
                  id="m-role"
                  value={role}
                  onChange={(v) => setRole(v as "employee" | "admin")}
                  options={[
                    { value: "employee", label: "Employee: overview and own transactions" },
                    { value: "admin", label: "Admin: also team, reports, settings" },
                  ]}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                Create account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
