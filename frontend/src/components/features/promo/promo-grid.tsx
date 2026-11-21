"use client";

import { useState } from "react";
import { StoredImage } from "@/components/ui";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageReveal } from "@/components/ui/page-reveal";
import type { PromotionCard } from "@/types/public-pages";
import styles from "./promo.module.css";

export function PromoGrid({ items }: { items: PromotionCard[] }) {
  const [selected, setSelected] = useState<PromotionCard | null>(null);
  return <section className={styles.page} data-content-page aria-labelledby="promo-heading">
    <h1 id="promo-heading" className={styles.heading}>Promo Terbaru</h1>
    {items.length ? <div className={styles.grid}>
      {items.map((item,index) => (
        <PageReveal key={item.id} index={index}>
          <button type="button" className={`${styles.card} ${item.desktop_only ? styles.desktopOnly : ""}`} onClick={()=>setSelected(item)} aria-label={`Lihat detail ${item.title}, promo ${index+1}`} aria-haspopup="dialog">
            <div className={styles.image}><StoredImage src={item.image_url} alt={item.image_alt} /></div>
            <div className={styles.body}>
              <h2>
                {item.mobile_benefit ? (
                  <>
                    <span className={styles.desktopCopy}>{item.benefit}</span>
                    <span className={styles.mobileCopy}>{item.mobile_benefit}</span>
                  </>
                ) : (
                  item.benefit
                )}
              </h2>
              <p>
                {item.mobile_benefit_description ? (
                  <>
                    <span className={styles.desktopCopy}>{item.benefit_description}</span>
                    <span className={styles.mobileCopy}>{item.mobile_benefit_description}</span>
                  </>
                ) : (
                  item.benefit_description
                )}
              </p>
            </div>
          </button>
        </PageReveal>
      ))}
    </div> : <EmptyState
      title="Belum Ada Promo Terbaru"
      description="Saat ini belum ada penawaran promo aktif. Kunjungi kembali secara berkala untuk mendapatkan penawaran spesial berikutnya."
      iconName="ticket"
      action={{ label: "Jelajahi Wahana", href: "/katalog" }}
    />}
    <DetailDialog open={Boolean(selected)} title={selected?.title??"Detail promo"} onClose={()=>setSelected(null)}>
      {selected && <article className={styles.detail}>
        <div className={styles.detailImage}><StoredImage src={selected.image_url} alt={selected.image_alt} /></div>
        <div className={styles.detailBody}><h3>{selected.title}</h3><p className={styles.subtitle}>{selected.subtitle}</p><p>{selected.description}</p><p className={styles.benefit}><strong>{selected.benefit}</strong><br/>{selected.benefit_description}</p></div>
      </article>}
    </DetailDialog>
  </section>;
}
