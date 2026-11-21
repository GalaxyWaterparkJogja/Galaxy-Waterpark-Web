"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type Options = {
  navigation: "pages" | "slides";
  itemCount: number;
  loop?: boolean;
  initialPage?: number;
};

function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "instant";
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";
}

/** Layout belongs to CSS; navigation measures the rendered slides and snap alignment. */
export function useScrollCarousel({
  navigation,
  itemCount,
  loop = false,
  initialPage = 0,
}: Options) {
  const track = useRef<HTMLDivElement>(null);
  const selected = useRef(0);
  const physicalSelected = useRef(0);
  const positions = useRef<number[]>([]);
  const settleRef = useRef<() => void>(() => {});
  const [state, setState] = useState({
    active: 0,
    pages: 1,
    scrollable: false,
  });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let initialized = false;
    let previousInitialIndex = -1;
    let frame: number | null = null;

    function update() {
      if (!element || positions.current.length === 0) return;
      const max = Math.max(0, element.scrollWidth - element.clientWidth);
      const nearest = positions.current.reduce(
        (best, position, index, values) =>
          Math.abs(position - element.scrollLeft) <
          Math.abs(values[best] - element.scrollLeft)
            ? index
            : best,
        0,
      );
      const active = itemCount && loop ? nearest % itemCount : nearest;
      selected.current = active;
      physicalSelected.current = nearest;
      const next = {
        active,
        pages: positions.current.length,
        scrollable: max > 1,
      };
      setState((previous) =>
        previous.active === next.active &&
        previous.pages === next.pages &&
        previous.scrollable === next.scrollable
          ? previous
          : next,
      );
    }

    function measure() {
      if (!element) return;
      const children = Array.from(element.children) as HTMLElement[];
      const visible = children.filter(
        (child) => child.getBoundingClientRect().width > 0,
      );
      const max = Math.max(0, element.scrollWidth - element.clientWidth);
      const style = getComputedStyle(element);
      if (navigation === "pages") {
        const width =
          visible[0]?.getBoundingClientRect().width ?? element.clientWidth;
        const gap = parseFloat(style.columnGap) || 0;
        const pages =
          max > 1 ? Math.ceil(max / Math.max(1, width + gap)) + 1 : 1;
        positions.current = Array.from({ length: pages }, (_, index) =>
          pages > 1 ? (max * index) / (pages - 1) : 0,
        );
        if (!initialized) {
          element.scrollTo({
            left: positions.current[Math.max(0, Math.min(pages - 1, initialPage))] ?? 0,
            behavior: "instant",
          });
        }
      } else {
        const origin =
          element.getBoundingClientRect().left + element.clientLeft;
        positions.current = children.map((child) => {
          const align = getComputedStyle(child).scrollSnapAlign;
          const inset =
            align === "end"
              ? element.clientWidth -
                child.clientWidth -
                (parseFloat(style.scrollPaddingRight) || 0)
              : align === "center"
                ? (element.clientWidth - child.clientWidth) / 2
                : 0;
          return Math.max(
            0,
            Math.min(
              max,
              child.getBoundingClientRect().left -
                origin +
                element.scrollLeft -
                inset,
            ),
          );
        });
        const initialIndex =
          parseInt(style.getPropertyValue("--carousel-initial-index"), 10) || 0;
        if (!initialized || initialIndex !== previousInitialIndex) {
          selected.current = Math.min(initialIndex, Math.max(0, itemCount - 1));
        }
        const physicalIndex = selected.current + (loop ? itemCount : 0);
        element.scrollTo({
          left: positions.current[physicalIndex] ?? 0,
          behavior: "instant",
        });
        previousInitialIndex = initialIndex;
      }
      initialized = true;
      update();
    }

    function settle() {
      if (!element || !loop || !itemCount) return;
      // Move a scrolled outer copy back to the equivalent middle copy.
      const middle = positions.current[itemCount + selected.current];
      if (middle !== undefined && Math.abs(element.scrollLeft - middle) > 1) {
        element.scrollTo({ left: middle, behavior: "instant" });
      }
    }
    settleRef.current = settle;

    let scrollEndTimer: ReturnType<typeof setTimeout> | null = null;
    const supportsScrollEnd = typeof window !== "undefined" && "onscrollend" in window;

    function handleScrollEnd() {
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
        scrollEndTimer = null;
      }
      settle();
    }

    function onScroll() {
      if (frame === null) {
        frame = requestAnimationFrame(() => {
          frame = null;
          update();
        });
      }
      if (loop) {
        if (scrollEndTimer) clearTimeout(scrollEndTimer);
        // Fallback for browsers without onscrollend (older Safari/iOS/WebViews)
        // and safety timer for interrupted scrolls when onscrollend is supported.
        scrollEndTimer = setTimeout(handleScrollEnd, supportsScrollEnd ? 350 : 150);
      }
    }

    const observer = new ResizeObserver(measure);
    function observeChildren() {
      observer.disconnect();
      observer.observe(element!);
      for (const child of element!.children) observer.observe(child);
      measure();
    }
    const mutations = new MutationObserver(observeChildren);
    mutations.observe(element, { childList: true });
    observeChildren();
    element.addEventListener("scroll", onScroll, { passive: true });
    element.addEventListener("scrollend", handleScrollEnd);
    measure();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      observer.disconnect();
      mutations.disconnect();
      element.removeEventListener("scroll", onScroll);
      element.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [navigation, itemCount, loop, initialPage]);

  function goTo(index: number) {
    const count =
      navigation === "slides" ? itemCount : positions.current.length;
    if (!count) return;
    let physicalIndex = Math.max(0, Math.min(count - 1, index));
    if (loop) {
      const step = index - selected.current;
      physicalIndex = physicalSelected.current + step;
      if (
        physicalIndex < 0 ||
        physicalIndex >= positions.current.length ||
        positions.current[physicalIndex] ===
          positions.current[physicalSelected.current]
      ) {
        // Rebase an exhausted outer copy without changing its visible offset.
        const middle = itemCount + selected.current;
        const middlePos = positions.current[middle] ?? 0;
        const currentPos =
          positions.current[physicalSelected.current] ?? middlePos;
        const offset = middlePos - currentPos;
        if (track.current && offset !== 0) {
          track.current.scrollTo({
            left: track.current.scrollLeft + offset,
            behavior: "instant",
          });
        }
        physicalIndex = middle + step;
      }
    }
    const targetLeft = positions.current[physicalIndex] ?? 0;
    const currentLeft = track.current?.scrollLeft ?? 0;
    track.current?.scrollTo({
      left: targetLeft,
      behavior: scrollBehavior(),
    });
    // Safety: if target scroll position equals current scroll position (distance ~ 0),
    // scroll and scrollend events won't fire. Ensure settle is called directly.
    if (loop && Math.abs(targetLeft - currentLeft) <= 1) {
      settleRef.current();
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !state.scrollable) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(selected.current + (event.key === "ArrowRight" ? 1 : -1));
    }
  }

  return { track, ...state, goTo, onKeyDown };
}
