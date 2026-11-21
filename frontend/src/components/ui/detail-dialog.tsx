"use client";

import { useEffect, useId, useRef, type ReactNode, type KeyboardEventHandler } from "react";
import { cn } from "@/lib/utils";
import { AppIcon } from "./icons";
import styles from "./detail-dialog.module.css";

export function DetailDialog({
  open,
  title,
  onClose,
  children,
  className = "",
  onKeyDown,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  onKeyDown?: KeyboardEventHandler<HTMLDialogElement>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const handleClose = () => {
    const el = dialog.current;
    if (el && typeof el.close === "function" && el.open) {
      el.close();
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      if (element.open) {
        if (typeof element.close === "function") element.close();
        else element.open = false;
      }
      return;
    }
    if (!element.open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.open = true;
    }
    return () => {
      if (element.open) {
        if (typeof element.close === "function") element.close();
        else element.open = false;
      }
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className={cn(styles.dialog, className)}
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      onClose={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        // Guard against synthetic/keyboard click events where clientX/clientY are 0
        if (event.clientX === 0 && event.clientY === 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const clickedOutside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (clickedOutside) handleClose();
      }}
    >
      <h2 id={titleId} className="sr-only">
        {title}
      </h2>
      <div className={styles.closeBar}>
        <button
          type="button"
          className={styles.close}
          aria-label="Tutup detail"
          onClick={handleClose}
        >
          <AppIcon name="close" size={20} />
        </button>
      </div>
      {open && children}
    </dialog>
  );
}
