"use client";

import { useRef, type ReactNode } from "react";
import { motion, type Variants } from "motion/react";
import styles from "./page-reveal.module.css";

const variants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const easing = [0.25, 0.1, 0.25, 1] as const;

export function PageReveal({
  children,
  index = 0,
  className = "",
  stagger = true,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
  stagger?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={element}
      className={`${styles.cardReveal} ${className}`}
      variants={variants}
      initial="hidden"
      animate="visible"
      whileInView="visible"
      viewport={{ once: true, amount: 0 }}
      transition={{
        duration: 0.4,
        delay: stagger ? Math.min(index, 6) * 0.05 : 0,
        ease: easing,
      }}
    >
      {children}
    </motion.div>
  );
}
