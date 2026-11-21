"use client";

import { useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  window.addEventListener("hashchange", notify);
  window.addEventListener("popstate", notify);
  return () => {
    window.removeEventListener("hashchange", notify);
    window.removeEventListener("popstate", notify);
  };
}

/** Hash views preserve direct links and native Back/Forward navigation. */
export function useHashView() {
  return useSyncExternalStore(subscribe, () => window.location.hash.slice(1), () => "");
}
