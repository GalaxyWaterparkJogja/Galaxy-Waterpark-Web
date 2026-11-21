import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampOffset,
  clampZoom,
  containScale,
  coverScale,
  coverZoom,
  fillState,
  fitState,
  imageRect,
  maxZoom,
  normalizeState,
  panBy,
  resolveNaturalOutputSize,
  resolveOutputSize,
  webpFileName,
  zoomAround,
  type CompositionState,
  type Size,
} from "./image-composition.ts";

const portraitFrame: Size = { width: 168, height: 225 };
const landscapePhoto: Size = { width: 4000, height: 3000 };
const portraitPhoto: Size = { width: 3000, height: 4000 };
const landscapeFrame: Size = { width: 518, height: 409 };

const near = (actual: number, expected: number, epsilon = 1e-6) =>
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );

test("landscape photo zoomed out shows the whole image inside a portrait frame", () => {
  const rect = imageRect(fitState(), landscapePhoto, portraitFrame);

  near(rect.width, portraitFrame.width);
  near(rect.x, 0);
  assert.ok(rect.height < portraitFrame.height, "empty space remains above and below");
  near(rect.y, (portraitFrame.height - rect.height) / 2);
});

test("landscape photo zoomed in fills the portrait frame and crops the sides", () => {
  const rect = imageRect(
    fillState(landscapePhoto, portraitFrame),
    landscapePhoto,
    portraitFrame,
  );

  near(rect.height, portraitFrame.height);
  assert.ok(rect.width > portraitFrame.width, "horizontal overflow is cropped");
  assert.ok(rect.x < 0 && rect.x + rect.width > portraitFrame.width);
});

test("portrait photo in a landscape frame behaves the same way mirrored", () => {
  const fit = imageRect(fitState(), portraitPhoto, landscapeFrame);
  near(fit.height, landscapeFrame.height);
  assert.ok(fit.width < landscapeFrame.width);

  const fill = imageRect(
    fillState(portraitPhoto, landscapeFrame),
    portraitPhoto,
    landscapeFrame,
  );
  near(fill.width, landscapeFrame.width);
  assert.ok(fill.height > landscapeFrame.height);
});

test("zoom is bounded between 'whole image' and four times 'cover'", () => {
  const max = maxZoom(landscapePhoto, portraitFrame);

  assert.equal(clampZoom(0.2, landscapePhoto, portraitFrame), 1);
  assert.equal(clampZoom(1e9, landscapePhoto, portraitFrame), max);
  near(
    containScale(landscapePhoto, portraitFrame) * max,
    coverScale(landscapePhoto, portraitFrame) * 4,
  );
  assert.ok(coverZoom(landscapePhoto, portraitFrame) > 1);
});

test("a square image already matches a square frame at zoom 1", () => {
  const square: Size = { width: 800, height: 800 };
  const frame: Size = { width: 1, height: 1 };

  near(coverZoom(square, frame), 1);
  const rect = imageRect(fitState(), square, frame);
  near(rect.width, 1);
  near(rect.height, 1);
});

test("an image bigger than the frame can never expose empty space on that axis", () => {
  const filled = fillState(landscapePhoto, portraitFrame);
  const dragged = panBy(
    filled,
    { x: 100_000, y: -100_000 },
    landscapePhoto,
    portraitFrame,
  );
  const rect = imageRect(dragged, landscapePhoto, portraitFrame);

  assert.ok(rect.x <= 1e-9, "left edge never moves inside the frame");
  assert.ok(rect.x + rect.width >= portraitFrame.width - 1e-9);
  // Height equals the frame height, so the image cannot move vertically.
  near(rect.y, 0);
});

test("a smaller image stays fully inside the frame when repositioned", () => {
  const dragged = panBy(
    fitState(),
    { x: 50, y: 100_000 },
    landscapePhoto,
    portraitFrame,
  );
  const rect = imageRect(dragged, landscapePhoto, portraitFrame);

  near(rect.x, 0);
  assert.ok(rect.y >= -1e-9);
  assert.ok(rect.y + rect.height <= portraitFrame.height + 1e-9);
  near(rect.y + rect.height, portraitFrame.height);
});

test("clampOffset keeps offsets already in range untouched", () => {
  const state: CompositionState = {
    zoom: coverZoom(landscapePhoto, portraitFrame) * 1.5,
    offset: { x: 0.05, y: 0 },
  };
  const clamped = clampOffset(state.offset, state.zoom, landscapePhoto, portraitFrame);

  assert.deepEqual(clamped, state.offset);
});

test("normalizeState repairs out-of-range state after a frame or image change", () => {
  const repaired = normalizeState(
    { zoom: 99, offset: { x: 50, y: 50 } },
    landscapePhoto,
    portraitFrame,
  );

  assert.equal(repaired.zoom, maxZoom(landscapePhoto, portraitFrame));
  assert.ok(Math.abs(repaired.offset.x) < 50);
});

test("zooming around a point keeps the image pixel under that point fixed", () => {
  const start = fillState(landscapePhoto, portraitFrame);
  const anchor = { x: 40, y: 150 };
  const before = imageRect(start, landscapePhoto, portraitFrame);
  // Fraction of the image under the anchor before zooming.
  const u = (anchor.x - before.x) / before.width;
  const v = (anchor.y - before.y) / before.height;

  const next = zoomAround(
    start,
    start.zoom * 1.4,
    anchor,
    landscapePhoto,
    portraitFrame,
  );
  const after = imageRect(next, landscapePhoto, portraitFrame);

  assert.ok(next.zoom > start.zoom);
  near(after.x + u * after.width, anchor.x, 1e-6);
  near(after.y + v * after.height, anchor.y, 1e-6);
});

test("zooming out to the minimum recentres a landscape image on the frame", () => {
  const zoomedIn = zoomAround(
    fillState(landscapePhoto, portraitFrame),
    maxZoom(landscapePhoto, portraitFrame),
    { x: 10, y: 10 },
    landscapePhoto,
    portraitFrame,
  );
  const zoomedOut = zoomAround(zoomedIn, 0, { x: 10, y: 10 }, landscapePhoto, portraitFrame);
  const rect = imageRect(zoomedOut, landscapePhoto, portraitFrame);

  assert.equal(zoomedOut.zoom, 1);
  near(rect.x, 0);
  near(rect.width, portraitFrame.width);
});

test("the same state yields the same composition at any output resolution", () => {
  const state: CompositionState = {
    zoom: coverZoom(landscapePhoto, portraitFrame) * 1.3,
    offset: { x: 0.08, y: 0 },
  };
  const preview = imageRect(state, landscapePhoto, portraitFrame);
  const exportFrame: Size = { width: 840, height: 1125 };
  const exported = imageRect(state, landscapePhoto, exportFrame);
  const factor = exportFrame.width / portraitFrame.width;

  near(exported.x, preview.x * factor, 1e-6);
  near(exported.y, preview.y * factor, 1e-6);
  near(exported.width, preview.width * factor, 1e-6);
  near(exported.height, preview.height * factor, 1e-6);
});

test("output size keeps the frame ratio and never upscales past the source", () => {
  const large = resolveOutputSize(portraitFrame, fitState(), landscapePhoto, {
    maxWidth: 840,
  });
  assert.equal(large.width, 840);
  near(large.width / large.height, portraitFrame.width / portraitFrame.height, 0.002);

  // 500 source px across the frame: export 500 px wide, not 840.
  const small: Size = { width: 500, height: 375 };
  const exported = resolveOutputSize(portraitFrame, fitState(), small, {
    maxWidth: 840,
  });
  assert.equal(exported.width, 500);

  // Tiny sources are still lifted to the minimum usable width.
  const tiny: Size = { width: 100, height: 75 };
  assert.equal(
    resolveOutputSize(portraitFrame, fitState(), tiny, { maxWidth: 840 }).width,
    320,
  );
});

test("resolveNaturalOutputSize preserves arbitrary aspect ratios and caps longest edge without upscaling", () => {
  const wide = resolveNaturalOutputSize({ width: 3200, height: 1600 }, 1400);
  assert.deepEqual(wide, { width: 1400, height: 700 });

  const tall = resolveNaturalOutputSize({ width: 1200, height: 2400 }, 1400);
  assert.deepEqual(tall, { width: 700, height: 1400 });

  const square = resolveNaturalOutputSize({ width: 2000, height: 2000 }, 1400);
  assert.deepEqual(square, { width: 1400, height: 1400 });

  const small = resolveNaturalOutputSize({ width: 640, height: 960 }, 1400);
  assert.deepEqual(small, { width: 640, height: 960 });
});

test("webpFileName produces a safe .webp name", () => {
  assert.equal(webpFileName("Foto Kolam (1).JPG"), "Foto-Kolam-1.webp");
  assert.equal(webpFileName("../../etc/passwd.png"), "etc-passwd.webp");
  assert.equal(webpFileName("...."), "image.webp");
  assert.equal(webpFileName("logo.final.png"), "logo-final.webp");
});
