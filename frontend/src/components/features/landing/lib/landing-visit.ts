const stateKey = "galaxyLandingVisit";
const storagePrefix = "galaxy:landing:revealed:";
const visits = new Map<string, Set<string>>();

/** Keep reveal memory per history entry without replacing router-owned state. */
export function landingVisit() {
  const existing = window.history.state?.[stateKey];
  const id =
    typeof existing === "string"
      ? existing
      : (crypto.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  let seen = visits.get(id);
  if (!seen) {
    seen = new Set<string>();
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    if (navigation?.type === "back_forward") {
      try {
        const stored: unknown = JSON.parse(
          sessionStorage.getItem(storagePrefix + id) ?? "[]",
        );
        if (Array.isArray(stored)) {
          seen = new Set(
            stored.filter(
              (value): value is string => typeof value === "string",
            ),
          );
        }
      } catch {
        // Storage is optional; blocked storage must never hide page content.
      }
    }
    visits.set(id, seen);
    if (visits.size > 20) visits.delete(visits.keys().next().value!);
  }
  try {
    window.history.replaceState(
      { ...window.history.state, [stateKey]: id },
      "",
    );
  } catch {
    // A restricted history implementation still gets a readable landing page.
  }
  const revealed = seen;
  return {
    seen: revealed,
    persist() {
      try {
        sessionStorage.setItem(
          storagePrefix + id,
          JSON.stringify([...revealed]),
        );
      } catch {
        // In-memory history restoration remains available without storage.
      }
    },
  };
}
