import type { CSSProperties, ReactNode } from "react";
import styles from "./spinner.module.css";

export interface SpinnerProps {
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/** Decorative ring spinner; pair it with visible or screen-reader text. */
export function Spinner({ size = 20, className }: SpinnerProps) {
  const style = { "--spinner-size": `${size}px` } as CSSProperties;

  return (
    <span
      className={className ? `${styles.spinner} ${className}` : styles.spinner}
      style={style}
      aria-hidden="true"
    />
  );
}

export interface BusyOverlayProps {
  active: boolean;
  children: ReactNode;
}

/**
 * Covers its positioned parent with a translucent layer while `active`,
 * announcing `children` politely to assistive tech and swallowing clicks so
 * the underlying form cannot be submitted twice.
 */
export function BusyOverlay({ active, children }: BusyOverlayProps) {
  if (!active) return null;

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <Spinner size={32} />
      <span className={styles.overlayLabel}>{children}</span>
    </div>
  );
}
