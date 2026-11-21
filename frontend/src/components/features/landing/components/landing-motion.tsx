"use client";

import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { landingVisit } from "../lib/landing-visit";
import styles from "./landing-motion.module.css";
export function LandingMotion({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    const visit = landingVisit();
    window.addEventListener("pagehide", visit.persist);
    return () => {
      visit.persist();
      window.removeEventListener("pagehide", visit.persist);
    };
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <div data-landing-motion className={styles.root}>
        <noscript>
          <style>{`[data-landing-reveal] { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        {children}
      </div>
    </MotionConfig>
  );
}
