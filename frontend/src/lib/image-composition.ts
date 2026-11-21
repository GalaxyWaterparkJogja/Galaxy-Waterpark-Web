/**
 * Pure geometry for the admin image editor.
 *
 * The editor preview and the exported WebP are produced from the very same
 * `ImageRect` computed here, so what the administrator sees in the frame is
 * exactly what gets uploaded. This module deliberately has no imports and no
 * DOM access so it can be unit-tested with `node --test`.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point, Size {}

/**
 * Editor state.
 *
 * - `zoom` is relative to the "contain" scale: `1` shows the whole image
 *   inside the frame, larger values zoom in.
 * - `offset` is the shift of the image centre from the frame centre, expressed
 *   as a fraction of the frame size so the same composition can be rendered at
 *   any resolution (preview or export).
 */
export interface CompositionState {
  zoom: number;
  offset: Point;
}

/** Zoom factor (relative to "contain") reachable on top of the "cover" scale. */
const EXTRA_ZOOM_BEYOND_COVER = 4;

export function containScale(image: Size, frame: Size): number {
  return Math.min(frame.width / image.width, frame.height / image.height);
}

export function coverScale(image: Size, frame: Size): number {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

export const MIN_ZOOM = 1;

/** Largest zoom: four times the scale that makes the image cover the frame. */
export function maxZoom(image: Size, frame: Size): number {
  return (
    (coverScale(image, frame) * EXTRA_ZOOM_BEYOND_COVER) /
    containScale(image, frame)
  );
}

/** Zoom value at which the image just covers the frame (no empty space). */
export function coverZoom(image: Size, frame: Size): number {
  return coverScale(image, frame) / containScale(image, frame);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampZoom(zoom: number, image: Size, frame: Size): number {
  return clamp(zoom, MIN_ZOOM, maxZoom(image, frame));
}

/** Frame pixels per image pixel for the given zoom. */
export function scaleFor(zoom: number, image: Size, frame: Size): number {
  return containScale(image, frame) * zoom;
}

/**
 * Keeps the image from being lost outside the frame.
 *
 * On each axis the image centre may move by at most half the difference
 * between the displayed image size and the frame size: an image larger than
 * the frame always keeps covering it on that axis, while a smaller one stays
 * fully inside the frame (the rest is filled with the neutral background).
 */
export function clampOffset(
  offset: Point,
  zoom: number,
  image: Size,
  frame: Size,
): Point {
  const scale = scaleFor(zoom, image, frame);
  const limitX = Math.abs(image.width * scale - frame.width) / 2 / frame.width;
  const limitY =
    Math.abs(image.height * scale - frame.height) / 2 / frame.height;

  return {
    x: clamp(offset.x, -limitX, limitX),
    y: clamp(offset.y, -limitY, limitY),
  };
}

export function normalizeState(
  state: CompositionState,
  image: Size,
  frame: Size,
): CompositionState {
  const zoom = clampZoom(state.zoom, image, frame);
  return { zoom, offset: clampOffset(state.offset, zoom, image, frame) };
}

/** Initial composition: the whole image visible and centred. */
export function fitState(): CompositionState {
  return { zoom: MIN_ZOOM, offset: { x: 0, y: 0 } };
}

/** Composition where the image fills the frame, cropping any overflow. */
export function fillState(image: Size, frame: Size): CompositionState {
  return { zoom: coverZoom(image, frame), offset: { x: 0, y: 0 } };
}

/** Where the image is drawn, in frame coordinates (frame top-left is 0,0). */
export function imageRect(
  state: CompositionState,
  image: Size,
  frame: Size,
): Rect {
  const scale = scaleFor(state.zoom, image, frame);
  const width = image.width * scale;
  const height = image.height * scale;

  return {
    x: frame.width / 2 + state.offset.x * frame.width - width / 2,
    y: frame.height / 2 + state.offset.y * frame.height - height / 2,
    width,
    height,
  };
}

/**
 * Zooms while keeping the image point under `anchor` (frame coordinates)
 * stationary, so wheel/pinch zoom feels anchored to the pointer.
 */
export function zoomAround(
  state: CompositionState,
  nextZoom: number,
  anchor: Point,
  image: Size,
  frame: Size,
): CompositionState {
  const zoom = clampZoom(nextZoom, image, frame);
  const before = imageRect(state, image, frame);
  const ratio = zoom / state.zoom;

  // Image-space point currently under the anchor, then re-solve the offset so
  // it stays under the anchor after the scale change.
  const nextWidth = before.width * ratio;
  const nextHeight = before.height * ratio;
  const nextX = anchor.x - (anchor.x - before.x) * ratio;
  const nextY = anchor.y - (anchor.y - before.y) * ratio;

  return {
    zoom,
    offset: clampOffset(
      {
        x: (nextX + nextWidth / 2 - frame.width / 2) / frame.width,
        y: (nextY + nextHeight / 2 - frame.height / 2) / frame.height,
      },
      zoom,
      image,
      frame,
    ),
  };
}

/** Moves the image by a delta given in frame pixels. */
export function panBy(
  state: CompositionState,
  delta: Point,
  image: Size,
  frame: Size,
): CompositionState {
  return {
    zoom: state.zoom,
    offset: clampOffset(
      {
        x: state.offset.x + delta.x / frame.width,
        y: state.offset.y + delta.y / frame.height,
      },
      state.zoom,
      image,
      frame,
    ),
  };
}

export interface OutputSizeOptions {
  /** Largest exported width in pixels. */
  maxWidth: number;
  /** Smallest exported width in pixels. */
  minWidth?: number;
}

/**
 * Exported pixel size for a frame.
 *
 * The width never exceeds `maxWidth` and never exceeds the number of source
 * pixels that actually span the frame (no pointless upscaling), but is kept
 * above `minWidth` so tiny sources still produce a usable card image.
 */
export function resolveOutputSize(
  frame: Size,
  state: CompositionState,
  image: Size,
  { maxWidth, minWidth = 320 }: OutputSizeOptions,
): Size {
  const scale = scaleFor(state.zoom, image, frame);
  const sourcePixelsAcrossFrame = frame.width / scale;
  const width = Math.round(
    clamp(sourcePixelsAcrossFrame, Math.min(minWidth, maxWidth), maxWidth),
  );

  return {
    width,
    height: Math.max(1, Math.round((width * frame.height) / frame.width)),
  };
}

/**
 * Exported pixel size preserving the source image's natural aspect ratio
 * without cropping or upscaling, capping the longest edge at `maxEdge`.
 */
export function resolveNaturalOutputSize(image: Size, maxEdge: number): Size {
  const longest = Math.max(image.width, image.height);
  if (longest <= maxEdge) {
    return {
      width: Math.max(1, Math.round(image.width)),
      height: Math.max(1, Math.round(image.height)),
    };
  }

  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(image.width * scale)),
    height: Math.max(1, Math.round(image.height * scale)),
  };
}

/** WebP file name derived from the original upload name. */
export function webpFileName(originalName: string): string {
  const base = originalName
    .replace(/\.[^./\\]+$/, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "image"}.webp`;
}
