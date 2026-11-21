"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/ui/icons";
import type { SiteContent } from "@/types/site";
import { SiteBrand } from "./site-brand";
import { useHeroHeader } from "./use-hero-header";
import styles from "./app-header.module.css";

type Props = Pick<SiteContent, "brand" | "navigation" | "header">;

export function AppHeader({ brand, navigation, header: labels }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const transparent = useHeroHeader(headerRef, pathname ?? "");

  const returnFocusRef = useRef(true);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      returnFocusRef.current = false;
      setIsOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    function handlePopState() {
      returnFocusRef.current = false;
      setIsOpen(false);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const navigation = navigationRef.current;
    const trigger = triggerRef.current;
    if (!isOpen || !navigation || !trigger) return;

    returnFocusRef.current = true;
    navigation.querySelector<HTMLButtonElement>("button")?.focus();

    // Isolate each ancestor's siblings without making the drawer inert itself.
    // The backdrop stays interactive so clicking it can still close the menu.
    const previousInert = new Map<HTMLElement, boolean>();
    let branch: HTMLElement = navigation;
    while (branch !== document.body && branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (
          sibling instanceof HTMLElement &&
          sibling !== branch &&
          sibling !== backdropRef.current
        ) {
          previousInert.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
    }

    // Read the breakpoint token so CSS and drawer behavior share one value.
    const breakpoint =
      getComputedStyle(trigger)
        .getPropertyValue("--navigation-breakpoint")
        .trim() || "1024px";
    const desktop = window.matchMedia(`(min-width: ${breakpoint})`);
    const closeOnDesktop = () => {
      if (desktop.matches) {
        returnFocusRef.current = false;
        setIsOpen(false);
      }
    };
    closeOnDesktop();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        returnFocusRef.current = true;
        setIsOpen(false);
      }
      if (event.key === "Tab") {
        const items =
          navigationRef.current?.querySelectorAll<HTMLElement>(
            "button, a[href]",
          );
        if (!items?.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      previousInert.forEach((inert, element) => {
        element.inert = inert;
      });
      window.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", closeOnDesktop);
      if (returnFocusRef.current && navigation.isConnected) {
        // The trigger is hidden when resizing to inline desktop navigation.
        const target = trigger.getClientRects().length
          ? trigger
          : navigation.querySelector<HTMLAnchorElement>(
              'a[aria-current="page"], a[href]',
            );
        target?.focus();
      }
    };
  }, [isOpen]);

  function closeMenu() {
    returnFocusRef.current = true;
    setIsOpen(false);
  }

  function closeMenuOnNavigate() {
    returnFocusRef.current = false;
    setIsOpen(false);
  }

  return (
    <header
      ref={headerRef}
      className={styles.header}
      data-page={pathname === "/" ? "landing" : "content"}
      data-appearance={transparent ? "transparent" : "solid"}
      data-mobile-menu={isOpen ? "open" : undefined}
    >
      <noscript>
        <style>{`header[data-appearance="transparent"] { background: var(--color-text-brand); }`}</style>
      </noscript>
      <div className={styles.headerInner}>
        <SiteBrand brand={brand} />

        <nav
          ref={navigationRef}
          id={menuId}
          className={`${styles.desktopNav} ${isOpen ? styles.drawerPanel : ""}`}
          role={isOpen ? "dialog" : undefined}
          aria-modal={isOpen ? true : undefined}
          aria-label={labels.navigation_label}
        >
          <div className={styles.drawerHeader}>
            <span className={styles.drawerTitle}>{labels.menu_title}</span>
            <button
              type="button"
              className={styles.drawerCloseButton}
              aria-label={labels.close_label}
              onClick={closeMenu}
            >
              <AppIcon name="close" size={20} />
            </button>
          </div>
          <div className={styles.navigationLinks}>
            {navigation.map((item) => {
              const active =
                item.pathname === "/"
                  ? pathname === "/"
                  : pathname === item.pathname ||
                    Boolean(pathname?.startsWith(`${item.pathname}/`));
              return (
                <Link
                  key={item.pathname}
                  href={item.href}
                  className={styles.navigationLink}
                  aria-current={active ? "page" : undefined}
                  onClick={closeMenuOnNavigate}
                >
                  <span className={styles.navigationLabel}>{item.label}</span>
                  <AppIcon
                    name="chevron-right"
                    size={16}
                    className={styles.navigationArrow}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        <button
          ref={triggerRef}
          type="button"
          className={styles.menuButton}
          aria-label={isOpen ? labels.close_label : labels.open_label}
          aria-expanded={isOpen}
          aria-controls={menuId}
          onClick={() => setIsOpen((previous) => !previous)}
        >
          <Image
            src={pathname === "/" ? "/images/figma/layout/menu.svg" : "/images/figma/layout/menu-content.svg"}
            alt=""
            width={22.6667}
            height={22.6666}
          />
        </button>
      </div>
      {isOpen && (
        <div
          ref={backdropRef}
          className={styles.drawerBackdrop}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
