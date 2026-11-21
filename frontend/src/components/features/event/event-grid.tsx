"use client";

import Image from "next/image";
import { useState } from "react";
import { StoredImage } from "@/components/ui";
import { DetailDialog } from "@/components/ui/detail-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageReveal } from "@/components/ui/page-reveal";
import type { EventCard } from "@/types/public-pages";
import styles from "./event.module.css";

export function EventGrid({ items }: { items: EventCard[] }) {
  const [selected, setSelected] = useState<EventCard|null>(null);
  return <section className={styles.page} data-content-page aria-labelledby="event-heading">
    <h1 id="event-heading" className={styles.heading}>Event Terkini</h1>
    {items.length ? <div className={styles.grid}>
      {items.map((item,index) => (
        <PageReveal key={item.id} index={index}>
          <button type="button" className={`${styles.card} ${item.mobile_only ? styles.mobileOnly : ""}`} onClick={()=>setSelected(item)} aria-label={`Lihat detail ${item.title}, event ${index+1}`} aria-haspopup="dialog">
            <div className={styles.image}><StoredImage src={item.image_url} alt={item.image_alt} /></div>
            <div className={styles.body}><h2>{item.title}</h2><p className={styles.full}>{item.description}</p><p className={styles.excerpt}>{item.excerpt}</p><span className={styles.arrow}><Image src="/images/figma/landing/event-arrow-desktop.svg" alt="" width={21.6664} height={17.4098}/></span></div>
          </button>
        </PageReveal>
      ))}
    </div> : <EmptyState
      title="Belum Ada Event Terkini"
      description="Jadwal event atau festival berikutnya akan segera diumumkan. Ikuti pengumuman terbaru kami."
      iconName="clock"
      action={{ label: "Lihat Semua Wahana", href: "/katalog" }}
    />}
    <DetailDialog open={Boolean(selected)} title={selected?.title??"Detail event"} onClose={()=>setSelected(null)}>
      {selected && <article className={styles.detail}>
        <div className={styles.detailImage}><StoredImage src={selected.image_url} alt={selected.image_alt} /></div>
        <div className={styles.detailBody}><h3>{selected.title}</h3><p>{selected.description}</p></div>
      </article>}
    </DetailDialog>
  </section>;
}
