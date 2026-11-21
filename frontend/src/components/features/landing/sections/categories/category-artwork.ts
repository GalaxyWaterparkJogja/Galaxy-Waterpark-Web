import type { CSSProperties } from "react";

type Artwork = {
  mobile: [width: string, height: string, left: string, top: string];
  desktop: [width: string, height: string, left: string, top: string];
  inset?: string;
  bottom?: string;
};

// Crops describe the supplied photos, independently of category IDs and ordering.
const artwork: Record<string, Artwork> = {
  "/images/figma/family-desktop.png": {
    mobile: ["155.65%", "165.12%", "0", "-20.62%"],
    desktop: ["198.89%", "114.99%", "-23.38%", "-6.77%"],
  },
  "/images/figma/pool-desktop.png": {
    mobile: ["100%", "141.58%", "0", "-28.87%"],
    desktop: ["277.11%", "106.30%", "-141.11%", "-1.94%"],
    inset: "11px",
  },
  "/images/figma/facility-final.png": {
    mobile: ["202.62%", "190.71%", "-65.17%", "-53.97%"],
    desktop: ["395.04%", "151.18%", "-151.98%", "-29.15%"],
    inset: "17px",
    bottom: "26px",
  },
};

export function categoryArtworkStyle(src: string): CSSProperties {
  if (!Object.hasOwn(artwork, src)) return {};
  const entry = artwork[src];
  const properties: Record<string, string> = {};
  for (const mode of ["mobile", "desktop"] as const) {
    for (const [index, key] of ["width", "height", "left", "top"].entries()) {
      properties[`--artwork-${mode}-${key}`] = entry[mode][index];
    }
  }
  if (entry.inset) properties["--artwork-card-inset"] = entry.inset;
  if (entry.bottom) properties["--artwork-card-bottom"] = entry.bottom;
  return properties as CSSProperties;
}
