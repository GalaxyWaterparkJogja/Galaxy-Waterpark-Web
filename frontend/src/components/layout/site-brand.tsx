"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteBrand as SiteBrandContent } from "@/types/site";
import styles from "./site-brand.module.css";

export function SiteBrand({ brand }: { brand: SiteBrandContent }) {
  const pathname = usePathname();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (pathname === "/") {
      event.preventDefault();
      const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: instant ? "instant" : "smooth",
      });
    }
  }

  return (
    <Link
      href={brand.href}
      className={styles.link}
      aria-label={brand.home_label}
      onClick={handleClick}
    >
      <span className={styles.mark}>
        <Image
          className={styles.image}
          src={brand.logo.src}
          alt=""
          width={brand.logo.width}
          height={brand.logo.height}
          sizes="(min-width: 1024px) 90px, 60px"
          loading="eager"
        />
      </span>
    </Link>
  );
}
