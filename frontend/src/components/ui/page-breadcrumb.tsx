import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./page-breadcrumb.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  includeJsonLd?: boolean;
  showBackArrow?: boolean;
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://galaxywaterpark.id"
).replace(/\/+$/, "");

export function PageBreadcrumb({
  items,
  className = "",
  includeJsonLd = false,
  showBackArrow,
}: PageBreadcrumbProps) {
  if (!items || items.length === 0) return null;

  const jsonLd = includeJsonLd
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => {
          const itemUrl = item.href
            ? item.href.startsWith("http")
              ? item.href
              : `${SITE_URL}${item.href.startsWith("/") ? "" : "/"}${item.href}`
            : undefined;

          return {
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            ...(itemUrl ? { item: itemUrl } : {}),
          };
        }),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <nav aria-label="Breadcrumb" className={cn(styles.nav, className)}>
        <ol className={styles.list}>
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;
            const hasBackIntent =
              item.label.toLowerCase().includes("kembali") ||
              item.label.toLowerCase().includes("back");
            const renderArrow =
              isFirst && (showBackArrow ?? hasBackIntent) && Boolean(item.href);

            return (
              <li key={`${item.label}-${index}`} className={styles.item}>
                {!isFirst && (
                  <span className={styles.separator} aria-hidden="true">
                    /
                  </span>
                )}
                {isLast ? (
                  <span className={styles.current} aria-current="page">
                    {item.label}
                  </span>
                ) : renderArrow && item.href ? (
                  <Link href={item.href} className={styles.backLink}>
                    <svg
                      className={styles.backArrow}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                    <span>{item.label}</span>
                  </Link>
                ) : item.href ? (
                  <Link href={item.href} className={styles.link}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={styles.link}>{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
