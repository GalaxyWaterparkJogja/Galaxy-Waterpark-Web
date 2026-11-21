import {
  imageRect,
  resolveNaturalOutputSize,
  resolveOutputSize,
  webpFileName,
  type CompositionState,
  type Size,
} from "./image-composition";
import { NEUTRAL_IMAGE_BACKGROUND, type ImageFrame } from "./image-frames";

/** Formats the browser can decode and we accept as an editor source. */
export const ACCEPTED_SOURCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const ACCEPTED_SOURCE_INPUT = ACCEPTED_SOURCE_TYPES.join(",");

/** Exported WebP quality; visually lossless for photos at card sizes. */
export const WEBP_QUALITY = 0.86;

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

export interface DecodedImage extends Size {
  source: CanvasImageSource;
  /** Releases decoder memory; always call it when the editor closes. */
  dispose: () => void;
}

export interface ProcessedImage {
  file: File;
  /** Object URL of the processed WebP; revoke with `URL.revokeObjectURL`. */
  previewUrl: string;
  width: number;
  height: number;
}

export function validateSourceFile(file: File): void {
  if (!(ACCEPTED_SOURCE_TYPES as readonly string[]).includes(file.type)) {
    throw new ImageProcessingError(
      "Format tidak didukung. Gunakan foto JPG, PNG, WebP, GIF, atau AVIF.",
    );
  }
  if (file.size === 0) {
    throw new ImageProcessingError("File foto kosong atau rusak.");
  }
}

/**
 * Decodes the file in the browser. `createImageBitmap` applies the EXIF
 * orientation so phone photos are not rotated; an `<img>` is the fallback for
 * engines without full `createImageBitmap` options support.
 */
export async function decodeImage(file: File): Promise<DecodedImage> {
  validateSourceFile(file);

  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          dispose: () => bitmap.close(),
        };
      }
      bitmap.close();
    }
  } catch {
    // Fall through to the <img> decoder below.
  }

  const url = URL.createObjectURL(file);
  try {
    const element = new Image();
    element.decoding = "async";
    element.src = url;
    await element.decode();

    if (element.naturalWidth === 0 || element.naturalHeight === 0) {
      throw new Error("empty image");
    }
    return {
      source: element,
      width: element.naturalWidth,
      height: element.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new ImageProcessingError(
      "Foto tidak dapat dibaca. File mungkin rusak atau bukan gambar yang valid.",
    );
  }
}

/**
 * Draws the composition onto `ctx` inside a `frame`-sized area: neutral
 * background first, then the image. Anything outside the frame is clipped by
 * the canvas itself. The editor preview and the export both call this.
 */
export function drawComposition(
  ctx: CanvasRenderingContext2D,
  decoded: DecodedImage,
  state: CompositionState,
  frame: Size,
  background: string = NEUTRAL_IMAGE_BACKGROUND,
): void {
  const rect = imageRect(state, decoded, frame);

  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, frame.width, frame.height);
  ctx.beginPath();
  ctx.rect(0, 0, frame.width, frame.height);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded.source, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

function canvasToWebP(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new ImageProcessingError("Gambar gagal dikompres."));
        } else if (blob.type !== "image/webp") {
          // Browsers that cannot encode WebP silently return PNG.
          reject(
            new ImageProcessingError(
              "Browser ini tidak mendukung ekspor WebP. Gunakan Chrome, Edge, atau Firefox terbaru.",
            ),
          );
        } else {
          resolve(blob);
        }
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

/**
 * Renders the chosen composition at export resolution and encodes it as WebP.
 * The returned file already contains the crop, zoom and neutral background.
 */
export async function exportComposition(
  decoded: DecodedImage,
  state: CompositionState,
  frame: ImageFrame,
  originalName: string,
): Promise<ProcessedImage> {
  const frameSize: Size = { width: frame.width, height: frame.height };
  const output = resolveOutputSize(frameSize, state, decoded, {
    maxWidth: frame.outputWidth,
  });

  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageProcessingError("Canvas tidak tersedia di browser ini.");
  }

  // Same composition, expressed in output pixels.
  drawComposition(ctx, decoded, state, output);

  const blob = await canvasToWebP(canvas);
  const file = new File([blob], webpFileName(originalName), {
    type: "image/webp",
    lastModified: Date.now(),
  });

  return {
    file,
    previewUrl: URL.createObjectURL(file),
    width: output.width,
    height: output.height,
  };
}

/**
 * Decodes and compresses an image directly to WebP while preserving its
 * natural aspect ratio (no cropping or letterboxing), used by multi-ratio
 * placements such as the documentation gallery.
 */
export async function exportDirectImage(
  sourceFile: File,
  { maxEdge = 1600 }: { maxEdge?: number } = {},
): Promise<ProcessedImage> {
  const decoded = await decodeImage(sourceFile);
  try {
    const output = resolveNaturalOutputSize(decoded, maxEdge);

    const canvas = document.createElement("canvas");
    canvas.width = output.width;
    canvas.height = output.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new ImageProcessingError("Canvas tidak tersedia di browser ini.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.source, 0, 0, output.width, output.height);

    const blob = await canvasToWebP(canvas);
    const file = new File([blob], webpFileName(sourceFile.name), {
      type: "image/webp",
      lastModified: Date.now(),
    });

    return {
      file,
      previewUrl: URL.createObjectURL(file),
      width: output.width,
      height: output.height,
    };
  } finally {
    decoded.dispose();
  }
}
