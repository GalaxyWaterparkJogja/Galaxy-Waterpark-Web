"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { AppIcon } from "@/components/ui/icons";
import styles from "./back-to-top.module.css";

function subscribe(notify: () => void) {
  let frame = 0;
  function schedule() {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        notify();
      });
    }
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("pageshow", schedule);
  };
}

const getSnapshot = () =>
  typeof window !== "undefined" && window.scrollY >= window.innerHeight * 2;
const getServerSnapshot = () => false;

export function BackToTop({ label = "Kembali ke atas" }: { label?: string }) {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cancelFocus = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelFocus.current?.(), []);

  function goToTop() {
    cancelFocus.current?.();
    let frame = 0;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    function cleanup() {
      cancelAnimationFrame(frame);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      window.removeEventListener("scrollend", onScrollEnd);
    }
    function onScrollEnd() {
      cleanup();
      if (window.scrollY <= 1) {
        frame = requestAnimationFrame(() => {
          const focusTarget =
            document.getElementById("welcome-heading") ||
            document.querySelector<HTMLElement>("main h1") ||
            document.getElementById("main-content");
          if (focusTarget) {
            if (!focusTarget.hasAttribute("tabindex")) {
              focusTarget.setAttribute("tabindex", "-1");
            }
            focusTarget.focus({ preventScroll: true });
          }
        });
      }
    }
    cancelFocus.current = cleanup;
    const instant =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.addEventListener("scrollend", onScrollEnd, { once: true });
    // Safety fallback timer for browsers lacking onscrollend or interrupted scrolls
    fallbackTimer = setTimeout(onScrollEnd, instant ? 50 : 800);
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: instant ? "instant" : "smooth",
    });
    if (instant || window.scrollY <= 1) onScrollEnd();
  }

  return (
    <button
      type="button"
      className={styles.button}
      data-visible={visible}
      aria-label={label}
      title={label}
      aria-hidden={!visible ? true : undefined}
      tabIndex={visible ? 0 : -1}
      onClick={goToTop}
    >
      <AppIcon name="arrow-right" size={24} className={styles.arrow} />
    </button>
  );
}
