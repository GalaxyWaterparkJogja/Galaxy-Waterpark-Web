"use client";

import Image from "next/image";
import { useState } from "react";
import { NullImage, type NullImageProps } from "./null-image";

export interface StoredImageProps {
  /** Resolved image URL, or null/undefined/"" when the record has no image. */
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Caption of the empty design (see `NullImage`). */
  emptyLabel?: NullImageProps["label"];
}

/**
 * Renders an uploaded image that fills its positioned parent, falling back to
 * the Figma empty-image design for records without an image or whose file
 * cannot be loaded, so no broken-image icon or raw `null` is ever shown.
 */
export function StoredImage({
  src,
  alt,
  className,
  emptyLabel,
}: StoredImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <NullImage label={emptyLabel} />;
  }

  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      fill
      unoptimized
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
