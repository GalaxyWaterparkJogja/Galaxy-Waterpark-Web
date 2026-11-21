/**
 * Image placements managed from the admin panel.
 *
 * Each preset mirrors the aspect ratio of the public component that renders
 * the stored image, so the editor frame matches what visitors will see. The
 * `source` entry names the stylesheet declaration the ratio comes from;
 * `image-frames.test.ts` fails if either side drifts.
 */

/** Neutral/200 from the Figma design (node 1003:2681); same value as `--color-surface-muted`. */
export const NEUTRAL_IMAGE_BACKGROUND = "#E2E8F0";

export interface ImageFrame {
  id: "catalog" | "promo" | "event" | "gallery" | "partner" | "about";
  /** Human readable name shown in the editor. */
  label: string;
  /** Aspect ratio of the frame, as the public component declares it. */
  width: number;
  height: number;
  /** Largest exported width in pixels (about 2x the largest rendered size). */
  outputWidth: number;
  /** Draws a circular guide because the public component masks the image. */
  shape?: "circle";
  source:
    | {
        file: string;
        declaration: string;
      }
    | {
        /** Figma node the ratio was measured from (no fixed ratio in CSS). */
        figma: string;
      };
}

export const IMAGE_FRAMES = {
  catalog: {
    id: "catalog",
    label: "Kartu katalog",
    width: 168,
    height: 225,
    outputWidth: 840,
    source: {
      file: "src/components/features/katalog/katalog.module.css",
      declaration: "aspect-ratio: 168 / 225;",
    },
  },
  promo: {
    id: "promo",
    label: "Kartu promo",
    width: 174,
    height: 216.336,
    outputWidth: 960,
    source: {
      file: "src/components/features/promo/promo.module.css",
      declaration: "aspect-ratio: 174 / 216.336;",
    },
  },
  event: {
    id: "event",
    label: "Kartu event",
    width: 174,
    height: 213.309,
    outputWidth: 960,
    source: {
      file: "src/components/features/event/event.module.css",
      declaration: "aspect-ratio: 174 / 213.309;",
    },
  },
  gallery: {
    id: "gallery",
    label: "Kartu galeri",
    // The public gallery grid renders photos at their natural ratio
    // (`.photoImg { height: auto }`), so the composition frame follows the
    // gallery card in the Figma "Dokumentasi" frame (518 x 409).
    width: 518,
    height: 409,
    outputWidth: 1400,
    source: { figma: "341:2544" },
  },
  partner: {
    id: "partner",
    label: "Logo mitra",
    width: 1,
    height: 1,
    outputWidth: 512,
    shape: "circle",
    source: {
      file: "src/components/features/landing/sections/partners/partners.module.css",
      // `.logo` is a square with `border-radius: var(--radius-round)`.
      declaration: "border-radius: var(--radius-round);",
    },
  },
  about: {
    id: "about",
    label: "Foto Tentang Kami",
    width: 414,
    height: 285,
    outputWidth: 1400,
    source: {
      file: "src/components/features/landing/sections/about/about.module.css",
      declaration: "aspect-ratio: 414 / 285;",
    },
  },
} as const satisfies Record<string, ImageFrame>;

export type ImageFrameId = keyof typeof IMAGE_FRAMES;
