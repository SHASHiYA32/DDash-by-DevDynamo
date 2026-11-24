"use client";

import { sileo } from "sileo";

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean;
  error?: string;
  data: T;
}

export async function api<T = Record<string, unknown>>(
  url: string,
  method: "POST" | "PATCH" | "DELETE" | "GET" = "POST",
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json.ok !== false, error: json.error, data: json as T };
  } catch {
    return { ok: false, error: "Network error. Check your connection.", data: {} as T };
  }
}

/** Thin wrapper so every alert in the app goes through Sileo. */
export const notify = {
  success: (title: string, description?: string) =>
    sileo.success({ title, description }),
  error: (title: string, description?: string) =>
    sileo.error({ title, description }),
  info: (title: string, description?: string) =>
    sileo.info({ title, description }),
  warning: (title: string, description?: string) =>
    sileo.warning({ title, description }),
};

/** Runs an API call with loading → success / error toasts. Resolves to the result. */
export async function withToast<T>(
  run: () => Promise<ApiResult<T>>,
  msgs: { loading: string; success: string; error?: string },
): Promise<ApiResult<T>> {
  const promise = run().then((r) => {
    if (!r.ok) throw new Error(r.error ?? msgs.error ?? "Something went wrong");
    return r;
  });
  sileo.promise(promise, {
    loading: { title: msgs.loading },
    success: { title: msgs.success },
    error: (e) => ({
      title: msgs.error ?? "Something went wrong",
      description: e instanceof Error ? e.message : undefined,
    }),
  });
  return promise.catch(
    (e) => ({ ok: false, error: e instanceof Error ? e.message : "Error", data: {} as T }),
  );
}
