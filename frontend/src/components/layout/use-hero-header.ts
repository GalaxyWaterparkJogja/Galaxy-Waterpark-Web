"use client";

import { useCallback, useSyncExternalStore, type RefObject } from "react";

/** Header appearance follows hero geometry, independently of drawer state. */
export function useHeroHeader(
  header: RefObject<HTMLElement | null>,
  pathname: string,
) {
  function getSnapshot() {
    if (pathname !== "/") return false;
    const hero = document.getElementById("beranda");
    return Boolean(
      hero && hero.getBoundingClientRect().bottom > (header.current?.offsetHeight ?? 0),
    );
  }

  const subscribe = useCallback((notify: () => void) => {
    const element = header.current;
    if (pathname !== "/" || !element) return () => {};

    let intersection: IntersectionObserver | undefined;
    let mutationObserver: MutationObserver | undefined;
    let hero = document.getElementById("beranda");

    function observeHero(target: HTMLElement) {
      intersection?.disconnect();
      intersection = new IntersectionObserver(notify, {
        rootMargin: `-${element!.offsetHeight}px 0px 0px 0px`,
        threshold: 0,
      });
      intersection.observe(target);
      notify();
    }

    function checkHero() {
      hero = document.getElementById("beranda");
      if (hero) {
        mutationObserver?.disconnect();
        mutationObserver = undefined;
        observeHero(hero);
      }
    }

    if (hero) {
      observeHero(hero);
    } else {
      mutationObserver = new MutationObserver(checkHero);
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    const resize = new ResizeObserver(() => {
      if (hero) observeHero(hero);
    });
    resize.observe(element);

    window.addEventListener("pageshow", notify);
    return () => {
      mutationObserver?.disconnect();
      intersection?.disconnect();
      resize.disconnect();
      window.removeEventListener("pageshow", notify);
    };
  }, [header, pathname]);

  const getServerSnapshot = useCallback(() => pathname === "/", [pathname]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
