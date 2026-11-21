"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { motion, useAnimationControls, type Variants } from "motion/react";
import { landingVisit } from "../lib/landing-visit";
import { motionPreferences } from "../lib/motion-preferences";
import styles from "./landing-reveal.module.css";

const variants: Variants = {
  hidden: { opacity: 0, y: "var(--landing-enter-y)" },
  visible: { opacity: 1, y: 0 },
};
const viewport = { once: true, amount: 0.15 } as const;
const easing = [0.25, 0.1, 0.25, 1] as const;
const serverDesktop = () => false;
const isDesktop = () => motionPreferences().desktop.matches;

function subscribeDesktop(notify: () => void) {
  const { desktop } = motionPreferences();
  desktop.addEventListener("change", notify);
  return () => desktop.removeEventListener("change", notify);
}

/** The hidden variant is server-rendered, so hydration never hides visible text. */
export function LandingReveal({
  children,
  revealId,
  kind = "card",
  index = 0,
  className = "",
}: {
  children: ReactNode;
  revealId: string;
  kind?: "hero" | "card";
  index?: number;
  className?: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, serverDesktop);

  function showImmediately() {
    controls.stop();
    controls.set("visible");
    landingVisit().seen.add(revealId);
  }

  useLayoutEffect(() => {
    const visit = landingVisit();
    // Back navigation and restored scroll must not replay already-passed content.
    if (visit.seen.has(revealId) || element.current!.getBoundingClientRect().bottom <= 0) {
      controls.set("visible");
      visit.seen.add(revealId);
    }
  }, [controls, revealId]);

  return (
    <motion.div
      ref={element}
      className={`${styles.reveal} ${kind === "hero" ? styles.hero : ""} ${className}`}
      data-landing-reveal={revealId}
      variants={variants}
      initial="hidden"
      animate={controls}
      whileInView="visible"
      viewport={viewport}
      transition={{
        duration: desktop ? (kind === "hero" ? 0.8 : 0.9) : 0.35,
        delay: desktop ? Math.min(index, 3) * 0.08 : 0,
        ease: easing,
      }}
      onViewportEnter={() => landingVisit().seen.add(revealId)}
      onFocusCapture={showImmediately}
    >
      {children}
    </motion.div>
  );
}
