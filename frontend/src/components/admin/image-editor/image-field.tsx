"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { PencilEditIcon } from "@/components/ui/icons";
import { NullImage } from "@/components/ui/null-image";
import { RequiredMark } from "@/components/ui/required-mark";
import { BusyOverlay } from "@/components/ui/spinner";
import type { ImageFrame } from "@/lib/image-frames";
import {
  ACCEPTED_SOURCE_INPUT,
  exportDirectImage,
  ImageProcessingError,
  validateSourceFile,
  type ProcessedImage,
} from "@/lib/image-processing";
import { ImageEditorDialog } from "./image-editor-dialog";
import styles from "./image-field.module.css";

export interface ImageFieldProps {
  id: string;
  /** Accessible name, e.g. "Foto katalog". */
  label: string;
  /** Placement the photo is composed for. */
  frame: ImageFrame;
  /** Processed (cropped + WebP) image waiting to be uploaded, if any. */
  value: ProcessedImage | null;
  onChange: (next: ProcessedImage | null) => void;
  /**
   * Stored image of the record being edited. `undefined` means the record is
   * being created; `null` or an empty string means it has no image yet.
   */
  currentUrl?: string | null;
  /** Only for columns that cannot be null (e.g. gallery photos). */
  required?: boolean;
  /**
   * When false, skips the fixed-ratio crop editor and compresses the chosen
   * image directly to WebP at its natural aspect ratio (e.g. masonry gallery).
   */
  allowCrop?: boolean;
  /** Optional heading shown inside the empty create dropzone. */
  promptTitle?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Image input used by every admin form. Choosing a photo opens the interactive
 * editor (or compresses directly to WebP when `allowCrop` is false); confirming
 * yields a WebP `File` ready to upload. Leaving the field untouched keeps the
 * stored image, and optional fields stay optional.
 */
export function ImageField({
  id,
  label,
  frame,
  value,
  onChange,
  currentUrl,
  required = false,
  allowCrop = true,
  promptTitle = "Tambahkan Foto",
  disabled = false,
  className,
}: ImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const directRequestRef = useRef(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      directRequestRef.current += 1;
    };
  }, []);

  const previewUrl = value?.previewUrl;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isCreating = currentUrl === undefined;
  const storedUrl = currentUrl && failedUrl !== currentUrl ? currentUrl : null;
  const shownUrl = previewUrl ?? storedUrl;
  const hasStoredImage = Boolean(currentUrl);
  const isBusy = disabled || isProcessing;

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      validateSourceFile(file);
    } catch (reason) {
      setError(
        reason instanceof ImageProcessingError
          ? reason.message
          : "Foto tidak dapat dibuka.",
      );
      return;
    }
    setError("");

    if (allowCrop) {
      setPendingFile(file);
      return;
    }

    const requestId = ++directRequestRef.current;
    setIsProcessing(true);
    try {
      const processed = await exportDirectImage(file, {
        maxEdge: frame.outputWidth,
      });
      if (directRequestRef.current !== requestId) {
        URL.revokeObjectURL(processed.previewUrl);
        return;
      }
      onChange(processed);
    } catch (reason) {
      if (directRequestRef.current !== requestId) return;
      setError(
        reason instanceof ImageProcessingError
          ? reason.message
          : "Foto gagal diproses ke WebP.",
      );
    } finally {
      if (directRequestRef.current === requestId) {
        setIsProcessing(false);
      }
    }
  };

  const actionLabel = shownUrl || hasStoredImage ? "Ganti foto" : "Tambahkan foto";
  const accessibleName = `${label}${required ? " (wajib diisi)" : " (opsional)"}`;


  return (
    <div className={className ? `${styles.field} ${className}` : styles.field}>
      <input
        ref={inputRef}
        id={id}
        className={styles.fileInput}
        type="file"
        accept={ACCEPTED_SOURCE_INPUT}
        onChange={(event) => void handleFile(event)}
        disabled={isBusy}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        className={styles.panel}
        data-has-image={shownUrl ? "true" : "false"}
        aria-busy={isProcessing}
      >
        {shownUrl ? (
          <Image
            key={shownUrl}
            src={shownUrl}
            alt={`Pratinjau ${label.toLowerCase()}`}
            fill
            unoptimized
            className={styles.image}
            onError={() => {
              if (!previewUrl && currentUrl) setFailedUrl(currentUrl);
            }}
          />
        ) : isCreating ? null : (
          <NullImage />
        )}

        {!shownUrl && isCreating ? (
          <button
            type="button"
            className={styles.dropzone}
            onClick={openPicker}
            disabled={isBusy}
            aria-label={`${actionLabel}: ${accessibleName}`}
          >
            <svg
              className={styles.addIcon}
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="2"
                width="36"
                height="36"
                rx="3"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                d="M20 10v20M10 20h20"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <strong className={styles.promptTitle}>
              {promptTitle}
              {required && <RequiredMark />}
            </strong>
            <span className={styles.promptHint}>
              JPG, PNG, WebP, atau AVIF{required ? "" : " (opsional)"}
            </span>
            <span className={styles.promptHint}>
              {allowCrop
                ? "Diatur dan dikompres otomatis ke WebP"
                : "Rasio asli dipertahankan, dikompres otomatis ke WebP"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={styles.editButton}
            onClick={openPicker}
            disabled={isBusy}
            title={actionLabel}
            aria-label={`${actionLabel}: ${accessibleName}`}
          >
            <PencilEditIcon size={20} />
          </button>
        )}

        <BusyOverlay active={isProcessing}>
          Mengompres foto ke WebP...
        </BusyOverlay>
      </div>

      {value && (
        <div className={styles.status}>
          <span>
            Foto baru siap diunggah ({value.width} &times; {value.height} px, WebP)
          </span>
          <button
            type="button"
            className={styles.revert}
            onClick={() => onChange(null)}
            disabled={isBusy}
          >
            {hasStoredImage ? "Batalkan, pakai foto lama" : "Hapus pilihan"}
          </button>
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {allowCrop && pendingFile && (
        <ImageEditorDialog
          file={pendingFile}
          frame={frame}
          title={`Atur ${label}`}
          onCancel={() => setPendingFile(null)}
          onConfirm={(result) => {
            setPendingFile(null);
            onChange(result);
          }}
        />
      )}
    </div>
  );
}
