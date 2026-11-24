"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true on the client after hydration, false on the server and during hydration. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}
