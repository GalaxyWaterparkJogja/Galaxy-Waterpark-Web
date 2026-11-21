"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export interface FallbackImageProps extends Omit<ImageProps, "onError"> {
  fallbackSrc?: string;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const DEFAULT_FALLBACK = "/images/figma/catalog/placeholder.svg";
const INLINE_FALLBACK =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' fill='%23f0f9ff'%3E%3Crect width='400' height='300' fill='%23f0f9ff'/%3E%3Cpath d='M0 220 Q 100 190, 200 220 T 400 220 L 400 300 L 0 300 Z' fill='%23bae6fd'/%3E%3C/svg%3E";

export function FallbackImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  ...props
}: FallbackImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [hasError, setHasError] = useState(!src);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  // Synchronously adjust state during render when src changes
  // (React 19 pattern: avoids cascading render and effect execution)
  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(!src);
    setFallbackFailed(false);
  }

  const effectiveSrc = fallbackFailed
    ? INLINE_FALLBACK
    : hasError
      ? fallbackSrc
      : src || fallbackSrc;

  return (
    <Image
      {...props}
      src={effectiveSrc}
      alt={alt}
      onError={(event) => {
        if (!hasError) {
          setHasError(true);
          onError?.(event);
        } else if (!fallbackFailed) {
          setFallbackFailed(true);
        }
      }}
    />
  );
}
