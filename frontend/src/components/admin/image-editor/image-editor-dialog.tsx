"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Spinner } from "@/components/ui/spinner";
import {
  fillState,
  fitState,
  maxZoom,
  panBy,
  resolveOutputSize,
  zoomAround,
  type CompositionState,
  type Point,
  type Size,
} from "@/lib/image-composition";
import type { ImageFrame } from "@/lib/image-frames";
import {
  decodeImage,
  drawComposition,
  exportComposition,
  ImageProcessingError,
  type DecodedImage,
  type ProcessedImage,
} from "@/lib/image-processing";
import styles from "./image-editor-dialog.module.css";

export interface ImageEditorDialogProps {
  /** Source photo picked by the administrator. */
  file: File;
  /** Placement the image is composed for (aspect ratio of the public card). */
  frame: ImageFrame;
  title?: string;
  onConfirm: (result: ProcessedImage) => void;
  onCancel: () => void;
}

type Status = "loading" | "ready" | "processing" | "failed";

const ZOOM_STEP = 1.25;
const KEY_STEP = 10;
const KEY_STEP_LARGE = 40;
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => setTimeout(resolve, 0));
  });
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof ImageProcessingError ? reason.message : fallback;
}

/**
 * Interactive crop/zoom editor shown between choosing a photo and uploading it.
 *
 * The preview canvas and the exported WebP are drawn by the same function
 * (`drawComposition`) from the same state, so the stored file is exactly the
 * composition the administrator approved: zoomed-out photos keep the whole
 * image on the fixed neutral background, zoomed-in photos are cropped by the
 * frame.
 */
export function ImageEditorDialog({
  file,
  frame,
  title = "Atur Foto",
  onConfirm,
  onCancel,
}: ImageEditorDialogProps) {
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [composition, setComposition] = useState<CompositionState>(fitState);
  const [viewSize, setViewSize] = useState<Size>({ width: 0, height: 0 });

  const dialogRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinchDistance = useRef<number | null>(null);

  const titleId = useId();
  const helpId = useId();
  const sliderId = useId();

  const isBusy = status === "processing";

  // Decode the photo once per file and release decoder memory on close.
  useEffect(() => {
    let cancelled = false;
    let result: DecodedImage | null = null;

    decodeImage(file)
      .then((image) => {
        if (cancelled) {
          image.dispose();
          return;
        }
        result = image;
        setDecoded(image);
        setComposition(fitState());
        setStatus("ready");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(errorMessage(reason, "Foto tidak dapat dibaca."));
        setStatus("failed");
      });

    return () => {
      cancelled = true;
      result?.dispose();
    };
  }, [file]);

  // Track the rendered frame size (it is CSS-sized from the aspect ratio).
  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [status]);

  // Live preview: same draw routine as the export.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !decoded || viewSize.width === 0) return;

    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(viewSize.width * ratio);
    const height = Math.round(viewSize.height * ratio);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawComposition(context, decoded, composition, viewSize);
  }, [decoded, composition, viewSize]);

  // Wheel zoom needs a non-passive listener to stop the page from scrolling.
  useEffect(() => {
    const element = frameRef.current;
    if (!element || !decoded || status !== "ready") return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0015));
      setComposition((current) =>
        zoomAround(current, current.zoom * factor, anchor, decoded, {
          width: rect.width,
          height: rect.height,
        }),
      );
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [decoded, status]);

  // Modal behaviour: focus, scroll lock, Escape and Tab containment.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Capture phase: keep page-level Escape handlers (e.g. closing a form) from firing too.
        event.stopImmediatePropagation();
        event.preventDefault();
        if (!isBusy) onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isBusy, onCancel]);

  const interactive = status === "ready" && decoded !== null && viewSize.width > 0;

  const localPoint = (event: { clientX: number; clientY: number }): Point => {
    const rect = frameRef.current?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  };

  const zoomFromCentre = (factor: number) => {
    if (!decoded) return;
    setComposition((current) =>
      zoomAround(
        current,
        current.zoom * factor,
        { x: viewSize.width / 2, y: viewSize.height / 2 },
        decoded,
        viewSize,
      ),
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, localPoint(event));

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous || !decoded) return;

    const current = localPoint(event);
    pointers.current.set(event.pointerId, current);

    if (pointers.current.size === 1) {
      const delta = { x: current.x - previous.x, y: current.y - previous.y };
      setComposition((state) => panBy(state, delta, decoded, viewSize));
    } else if (pointers.current.size === 2 && pinchDistance.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = distance / pinchDistance.current;
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pinchDistance.current = distance;
      setComposition((state) =>
        zoomAround(state, state.zoom * factor, midpoint, decoded, viewSize),
      );
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchDistance.current = null;
  };

  const handleFrameKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !decoded) return;

    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };

    if (event.key in moves) {
      event.preventDefault();
      const delta = moves[event.key];
      setComposition((state) => panBy(state, delta, decoded, viewSize));
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomFromCentre(ZOOM_STEP);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomFromCentre(1 / ZOOM_STEP);
    } else if (event.key === "0") {
      event.preventDefault();
      setComposition(fitState());
    }
  };

  const handleConfirm = async () => {
    if (!decoded || status !== "ready") return;

    setStatus("processing");
    setError("");
    await nextPaint();

    try {
      onConfirm(await exportComposition(decoded, composition, frame, file.name));
    } catch (reason) {
      setError(
        errorMessage(reason, "Gambar gagal diproses. Coba lagi atau pilih foto lain."),
      );
      setStatus("ready");
    }
  };

  const frameSize: Size = { width: frame.width, height: frame.height };
  const zoomLimit = decoded ? maxZoom(decoded, frameSize) : 4;
  const sliderValue = Math.log(composition.zoom) / Math.log(zoomLimit);
  const output = decoded
    ? resolveOutputSize(frameSize, composition, decoded, {
        maxWidth: frame.outputWidth,
      })
    : null;

  const frameStyle = {
    "--frame-ratio": String(frame.width / frame.height),
  } as CSSProperties;

  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={isBusy}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <p className={styles.subtitle}>
              Bingkai mengikuti ukuran tampilan di situs: {frame.label}.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Tutup editor foto"
          >
            &times;
          </button>
        </header>

        {status === "loading" && (
          <div className={styles.placeholder} role="status">
            <Spinner size={28} />
            <span>Memuat foto...</span>
          </div>
        )}

        {status === "failed" && (
          <div className={styles.placeholder}>
            <p className={styles.error} role="alert">
              {error}
            </p>
          </div>
        )}

        {decoded && (status === "ready" || status === "processing") && (
          <>
            <div className={styles.stage}>
              <div
                ref={frameRef}
                className={styles.frame}
                style={frameStyle}
                role="group"
                aria-label={`Pratinjau bingkai ${frame.label}`}
                aria-describedby={helpId}
                tabIndex={0}
                data-testid="image-editor-frame"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onKeyDown={handleFrameKeyDown}
              >
                <canvas
                  ref={canvasRef}
                  className={styles.canvas}
                  data-testid="image-editor-canvas"
                />
                {frame.shape === "circle" && (
                  <span className={styles.circleGuide} aria-hidden="true" />
                )}
              </div>
              <p id={helpId} className={styles.help}>
                Seret untuk menggeser, gulir atau cubit untuk zoom. Bagian di luar bingkai
                dipotong; ruang kosong diisi warna netral.
              </p>
            </div>

            <div className={styles.controls}>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => zoomFromCentre(1 / ZOOM_STEP)}
                disabled={!interactive || isBusy}
                aria-label="Perkecil"
              >
                &minus;
              </button>
              <label className={styles.sliderLabel} htmlFor={sliderId}>
                <span className={styles.srOnly}>Zoom</span>
                <input
                  id={sliderId}
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={sliderValue}
                  disabled={!interactive || isBusy}
                  aria-valuetext={`${Math.round(composition.zoom * 100)} persen`}
                  onChange={(event) => {
                    if (!decoded) return;
                    const next = Math.exp(Number(event.target.value) * Math.log(zoomLimit));
                    setComposition((current) =>
                      zoomAround(
                        current,
                        next,
                        { x: viewSize.width / 2, y: viewSize.height / 2 },
                        decoded,
                        viewSize,
                      ),
                    );
                  }}
                />
              </label>
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => zoomFromCentre(ZOOM_STEP)}
                disabled={!interactive || isBusy}
                aria-label="Perbesar"
              >
                +
              </button>
              <output className={styles.zoomValue} aria-hidden="true">
                {Math.round(composition.zoom * 100)}%
              </output>
            </div>

            <div className={styles.presets}>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setComposition(fitState())}
                disabled={!interactive || isBusy}
              >
                Tampilkan seluruh foto
              </button>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setComposition(fillState(decoded, frameSize))}
                disabled={!interactive || isBusy}
              >
                Isi bingkai
              </button>
            </div>

            {output && (
              <p className={styles.meta}>
                Asli {decoded.width} &times; {decoded.height} px &rarr; hasil {output.width}{" "}
                &times; {output.height} px, WebP
              </p>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </>
        )}

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isBusy}
          >
            Batal
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={() => void handleConfirm()}
            disabled={!interactive || isBusy}
          >
            {isBusy ? (
              <>
                <Spinner size={16} /> Memproses...
              </>
            ) : (
              "Gunakan Foto"
            )}
          </button>
        </footer>

        {isBusy && (
          <div className={styles.processing} role="status" aria-live="polite">
            <Spinner size={36} />
            <span>Memproses dan mengompres gambar ke WebP...</span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
