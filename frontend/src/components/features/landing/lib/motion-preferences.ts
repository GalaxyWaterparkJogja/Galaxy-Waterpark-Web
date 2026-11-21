export function motionPreferences() {
  const breakpoint = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-desktop-breakpoint")
    .trim();
  return {
    desktop: matchMedia(
      `(min-width: ${breakpoint || "1280px"}) and (hover: hover) and (pointer: fine)`,
    ),
  };
}

