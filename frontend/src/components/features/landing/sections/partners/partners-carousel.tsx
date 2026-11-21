"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";
import { StoredImage } from "@/components/ui";
import type { LandingCarouselLabels, LandingPartners } from "@/types/landing";
import styles from "./partners.module.css";

function getColumns() {
  return matchMedia("(min-width: 1280px)").matches ? 4
    : matchMedia("(min-width: 1024px)").matches ? 3 : 0;
}
function subscribeColumns(notify: () => void) {
  const queries = [matchMedia("(min-width: 1024px)"), matchMedia("(min-width: 1280px)")];
  queries.forEach(query => query.addEventListener("change", notify));
  return () => queries.forEach(query => query.removeEventListener("change", notify));
}
const getServerColumns = () => 0;

export function PartnersCarousel({ items, labels }: {
  items: LandingPartners["items"];
  labels: LandingCarouselLabels;
}) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const columns = useSyncExternalStore(subscribeColumns, getColumns, getServerColumns);
  const scrollable = columns > 0 && items.length > columns;
  const [viewport, api] = useEmblaCarousel({
    active: items.length > 4,
    loop: true,
    align: "start",
    dragFree: true,
    breakpoints: {
      "(max-width: 1279px)": { active: items.length > 3 },
      "(max-width: 1023px)": { active: false },
      "(prefers-reduced-motion: reduce)": { duration: 0 },
    },
  }, [AutoScroll({ speed: 0.5, startDelay: 1200, playOnInit: false, stopOnMouseEnter: false })]);

  useEffect(() => {
    if (!api) return;
    const root = api.rootNode();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let dragging = false;

    function sync() {
      const autoScroll = api!.plugins()?.autoScroll;
      if (!autoScroll) return;
      if (!visible || reduced.matches || document.hidden || dragging ||
          !api!.internalEngine().options.active || root.contains(document.activeElement)) {
        autoScroll.stop();
      } else {
        autoScroll.play();
      }
    }
    function down() { dragging = true; sync(); }
    function up() { dragging = false; sync(); }
    function blur() { queueMicrotask(sync); }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(root);
    api.on("pointerDown", down).on("pointerUp", up).on("reInit", sync);
    root.addEventListener("focusin", sync);
    root.addEventListener("focusout", blur);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      api.plugins()?.autoScroll?.stop();
      api.off("pointerDown", down).off("pointerUp", up).off("reInit", sync);
      root.removeEventListener("focusin", sync);
      root.removeEventListener("focusout", blur);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [api]);

  return (
    <div className={styles.carousel}>
      <div
        ref={viewport}
        className={styles.viewport}
        role={scrollable ? "region" : undefined}
        aria-roledescription={scrollable ? "carousel" : undefined}
        aria-label={scrollable ? labels.instructions : undefined}
        tabIndex={scrollable ? 0 : undefined}
        onKeyDown={(event) => {
          if (!scrollable || event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            const jump = matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (event.key === "ArrowRight") api?.scrollNext(jump);
            else api?.scrollPrev(jump);
          }
        }}
      >
      <ul
        id={listId}
        className={`${styles.list} ${expanded ? "" : styles.collapsed}`}
        data-single={items.length === 1 ? "true" : undefined}
        data-fit-3={items.length <= 3 ? "true" : undefined}
        data-fit-4={items.length <= 4 ? "true" : undefined}
      >
      {items.map((item) => (
        <li key={item.id} className={styles.partner} data-name-length={Array.from(item.name.trim()).length > 20 ? "long" : "short"}>
          <div className={styles.logo}>
            <StoredImage src={item.image_url} alt="" emptyLabel="" />
          </div>
          <p>{item.name}</p>
        </li>
      ))}
      </ul>
      </div>
      {items.length > 8 && <button
        type="button"
        className={styles.moreButton}
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded(value => !value)}
      >
        {expanded ? "Lihat lebih sedikit" : "Lihat selengkapnya"}
        <span className={expanded ? styles.chevronUp : styles.chevronDown} aria-hidden="true" />
      </button>}
    </div>
  );
}
