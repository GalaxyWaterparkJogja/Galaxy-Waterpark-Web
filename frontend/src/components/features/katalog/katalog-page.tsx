"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageReveal } from "@/components/ui/page-reveal";
import { NullImage, StoredImage } from "@/components/ui";
import {
  catalogGroups,
  type CatalogGroup,
  type CatalogItem,
} from "./catalog-data";
import {
  fetchAllPublicCatalogs,
  resolveCatalogItemsForGroup,
  type PublicCatalogRecordsMap,
} from "@/services/catalog-service";
import { formatIdrCurrency } from "@/lib/seo";
import styles from "./katalog.module.css";

function Artwork({ group, image, alt, detail = false }: {
  group: CatalogGroup; image: string | null; alt: string; detail?: boolean;
}) {
  if (!image) {
    return (
      <div className={detail ? styles.detailImage : styles.image}>
        <NullImage />
      </div>
    );
  }

  const isFixtureImage = image.startsWith("/images/figma/");
  if (!isFixtureImage) {
    return (
      <div className={detail ? styles.detailImage : styles.image}>
        <StoredImage src={image} alt={alt} />
      </div>
    );
  }

  const showMobileOverride =
    !detail && group.id !== "family" && Boolean(group.mobileImage);
  return (
    <picture className={`${detail ? styles.detailImage : styles.image} ${styles.picture}`} data-artwork={group.id}>
      {showMobileOverride && <source media="(max-width: 599px)" srcSet={group.mobileImage} />}
      <Image
        src={image}
        alt={alt}
        width={1200}
        height={900}
        sizes={
          detail
            ? "(min-width: 1024px) 57vw, 100vw"
            : "(min-width: 1024px) 411px, 45vw"
        }
      />
    </picture>
  );
}

function Card({
  group,
  item,
  compact = false,
}: {
  group: CatalogGroup;
  item: CatalogItem;
  compact?: boolean;
}) {
  return (
    <Link
      className={`${styles.card} ${compact ? styles.compact : ""}`}
      href={`/katalog/${group.id}/${item.id}`}
    >
      <div className={styles.cardMedia}>
        <Artwork group={group} image={item.image} alt={item.title} />
      </div>
      <div className={`${styles.body} ${styles.cardOverlay}`}>
        <h3>
          <span className={styles.desktopText}>{item.title}</span>
          <span className={styles.mobileText}>{item.mobileTitle}</span>
        </h3>
        {!compact && (
          <p>
            <span className={styles.desktopText}>
              {item.description?.trim() || group.description}
            </span>
            <span className={styles.mobileText}>
              {(item.description?.trim() || group.excerpt).replace(/\.+$/, "")}
              <strong>...selengkapnya</strong>
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}

function BackIcon() {
  return <>
    <Image className={styles.backMobile} src="/images/figma/catalog/back-mobile.svg" alt="" width={26.35} height={26.35}/>
    <Image className={styles.backDesktop} src="/images/figma/catalog/back.svg" alt="" width={50.17} height={50.17}/>
  </>;
}

export function KatalogPage({
  categoryId,
  itemId,
  initialCatalogRecords,
}: {
  categoryId?: string;
  itemId?: string;
  initialCatalogRecords?: PublicCatalogRecordsMap;
} = {}) {
  const hasServerRecords = Boolean(
    initialCatalogRecords && Object.keys(initialCatalogRecords).length > 0,
  );
  const [catalogRecords, setCatalogRecords] = useState<PublicCatalogRecordsMap>(
    initialCatalogRecords ?? {},
  );

  useEffect(() => {
    if (hasServerRecords) return;
    let active = true;
    void fetchAllPublicCatalogs()
      .then((records) => {
        if (!active || Object.keys(records).length === 0) return;
        setCatalogRecords(records);
      })
      .catch(() => {
        // Static catalog data remains available if the API is unavailable.
      });
    return () => {
      active = false;
    };
  }, [hasServerRecords]);

  const router = useRouter();
  const group = catalogGroups.find((entry) => entry.id === categoryId);
  const item =
    group &&
    resolveCatalogItemsForGroup(group, catalogRecords).find(
      (entry) => entry.id === itemId,
    );
  const heading = useRef<HTMLHeadingElement>(null);

  // Bonus compatibility: redirect legacy #category or #category/item hashes to clean SEO routes.
  useEffect(() => {
    if (!categoryId && window.location.hash) {
      const rawHash = window.location.hash.slice(1).trim();
      const [hashCategory, hashItem] = rawHash.split("/");
      const matchedGroup = catalogGroups.find((g) => g.id === hashCategory);
      if (matchedGroup) {
        const matchedItem = hashItem
          ? resolveCatalogItemsForGroup(matchedGroup, catalogRecords).find(
              (i) => i.id === hashItem,
            )
          : undefined;
        router.replace(
          matchedItem
            ? `/katalog/${matchedGroup.id}/${matchedItem.id}`
            : `/katalog/${matchedGroup.id}`,
        );
      }
    }
  }, [categoryId, catalogRecords, router]);

  useEffect(() => {
    if ((categoryId || itemId) && heading.current) {
      heading.current.focus({ preventScroll: true });
    }
  }, [categoryId, itemId]);

  if (group && item) {
    const allItems = resolveCatalogItemsForGroup(group, catalogRecords);
    const relatedIndices = allItems
      .map((_, index) => index)
      .filter((index) => allItems[index].id !== item.id)
      .slice(0, 3);

    const dynamicFacts: Array<{ label: string; value: string }> = [];
    if (item.heightRequirement?.trim()) {
      dynamicFacts.push({
        label: "Tinggi minimum (pengunjung)",
        value: item.heightRequirement.trim(),
      });
    }
    if (typeof item.price === "number" && item.price > 0) {
      dynamicFacts.push({
        label: "Tarif layanan",
        value: formatIdrCurrency(item.price),
      });
    }
    if (typeof item.durationMinutes === "number" && item.durationMinutes > 0) {
      dynamicFacts.push({
        label: "Durasi sesi",
        value: `${item.durationMinutes} menit`,
      });
    }
    const factsToShow =
      dynamicFacts.length > 0
        ? dynamicFacts
        : catalogRecords[group.id]
          ? []
          : group.facts;

    return <div className={styles.page} data-content-page>
      <div className={styles.frame}><Link className={styles.back} href={`/katalog/${group.id}`} aria-label={`Kembali ke ${group.title}`}><BackIcon/><span>Kembali</span></Link></div>
      <article className={`${styles.detail} ${styles.detailTop}`}>
        <Artwork group={group} image={item.image} alt={item.title} detail />
        <div className={`${styles.detailBody} ${styles.detailCard}`}>
          <h1 ref={heading} tabIndex={-1}><span className={styles.desktopText}>{item.title}</span><span className={styles.mobileText}>{item.mobileTitle}</span></h1>
          <p>{item.description?.trim() || group.description}</p>
          {factsToShow.length > 0 && <dl className={styles.facts}>{factsToShow.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
        </div>
      </article>
      <section className={`${styles.related} ${styles.similarSection} ${styles.frame}`} aria-labelledby="related-heading">
        <h2 id="related-heading">Kategori Serupa</h2>
        <div className={styles.preview}>
          {relatedIndices.map((index) => (
            <Card key={index} group={group} item={allItems[index]} compact />
          ))}
          <Link href={`/katalog/${group.id}`} className={styles.moreCard}>
            <Image src="/images/figma/landing/event-arrow-mobile.svg" alt="" width={20} height={20} />
            <span>Lihat Selengkapnya</span>
          </Link>
        </div>
      </section>
    </div>;
  }

  return <div className={`${styles.page} ${styles.frame}`} data-content-page>
    <h1 className="sr-only">Wahana & Fasilitas</h1>
    {group ? (
      <section aria-labelledby="category-heading" className={styles.expanded}>
        <Link className={styles.back} href="/katalog" aria-label="Kembali ke semua kategori">
          <BackIcon />
          <h2 ref={heading} tabIndex={-1} id="category-heading">
            <span className={styles.desktopText}>{group.title}</span>
            <span className={styles.mobileText}>{group.mobileTitle}</span>
          </h2>
        </Link>
        <div className={styles.grid}>
          {resolveCatalogItemsForGroup(group, catalogRecords).map((entry, index) => (
            <PageReveal key={entry.id} index={index}>
              <Card group={group} item={entry} />
            </PageReveal>
          ))}
        </div>
      </section>
    ) : (
      catalogGroups.map((category, catIndex) => {
        const catItems = resolveCatalogItemsForGroup(category, catalogRecords);
        return (
          <PageReveal key={category.id} index={catIndex} className={styles.categoryReveal}>
            <section className={styles.category} aria-labelledby={`${category.id}-heading`}>
              <div className={styles.heading}>
                <h2 id={`${category.id}-heading`}>
                  <Link href={`/katalog/${category.id}`} aria-label={`Lihat semua ${category.title}`}>
                    <span className={styles.desktopText}>{category.title}</span>
                    <span className={styles.mobileText}>{category.mobileTitle}</span>
                  </Link>
                </h2>
                <Link className={styles.more} href={`/katalog/${category.id}`} aria-label={`Lihat semua ${category.title}`}>
                  Lihat Selengkapnya{" "}
                  <Image src="/images/figma/landing/more-arrow-desktop.svg" alt="" width={26.33} height={20.67} />
                </Link>
              </div>
              <div
                className={styles.preview}
                aria-label={category.mobileTitle}
              >
                {catItems.slice(0, 3).map((item) => (
                  <Card key={item.id} group={category} item={item} />
                ))}
                <Link href={`/katalog/${category.id}`} className={styles.moreCard}>
                  <Image src="/images/figma/landing/event-arrow-mobile.svg" alt="" width={20} height={20} />
                  <span>Lihat Selengkapnya</span>
                </Link>
              </div>
            </section>
          </PageReveal>
        );
      })
    )}
  </div>;
}

export default KatalogPage;
