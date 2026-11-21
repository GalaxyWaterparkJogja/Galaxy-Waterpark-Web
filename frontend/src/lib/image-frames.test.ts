import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { IMAGE_FRAMES, NEUTRAL_IMAGE_BACKGROUND } from "./image-frames.ts";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

test("every frame ratio is declared by the public component it is derived from", () => {
  for (const frame of Object.values(IMAGE_FRAMES)) {
    if (!("file" in frame.source)) continue;

    const css = readFileSync(resolve(frontendRoot, frame.source.file), "utf8");
    assert.ok(
      css.includes(frame.source.declaration),
      `${frame.id}: "${frame.source.declaration}" not found in ${frame.source.file}`,
    );
  }
});

test("frame dimensions are positive and exports stay a sensible size", () => {
  for (const frame of Object.values(IMAGE_FRAMES)) {
    assert.ok(frame.width > 0 && frame.height > 0, frame.id);
    assert.ok(frame.outputWidth >= 320 && frame.outputWidth <= 2048, frame.id);
  }
});

test("the neutral background is the Figma Neutral/200 token used by the stylesheet", () => {
  assert.equal(NEUTRAL_IMAGE_BACKGROUND, "#E2E8F0");

  const tokens = readFileSync(
    resolve(frontendRoot, "src/styles/tokens.css"),
    "utf8",
  );
  assert.match(tokens, /--color-surface-muted:\s*#e2e8f0/i);
});
