"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";
import { AppFooter } from "./app-footer";
import { AppIcon } from "@/components/ui/icons";
import styles from "./layout.module.css";
import { getSiteContent } from "@/services/site-service";
import { fetchPublicProfile } from "@/services/landing-service";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [dynamicWhatsapp, setDynamicWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) return;
    void fetchPublicProfile().then((profile) => {
      setDynamicWhatsapp(profile?.whatsapp_number?.trim() || null);
    });
  }, [isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  const content = getSiteContent();
  const fixtureWhatsapp = content.contacts?.whatsapp;
  const normalizedWhatsapp = dynamicWhatsapp?.replace(/\D/g, "");
  const whatsappHref: string | null = normalizedWhatsapp
    ? `https://wa.me/${normalizedWhatsapp.startsWith("0") ? `62${normalizedWhatsapp.slice(1)}` : normalizedWhatsapp.replace(/^\+/, "")}`
    : fixtureWhatsapp?.href?.trim() || null;
  const whatsapp = dynamicWhatsapp
    ? {
        ...fixtureWhatsapp,
        label: dynamicWhatsapp,
        href: whatsappHref,
        accessible_label: `Hubungi Galaxy Waterpark melalui WhatsApp ${dynamicWhatsapp}`,
      }
    : fixtureWhatsapp;

  return (
    <div className={styles.siteWrapper}>
      <a href="#main-content" className={styles.skipLink}>
        {content.skip_label}
      </a>
      <AppHeader
        brand={content.brand}
        navigation={content.navigation}
        header={content.header}
      />
      <main id="main-content" className={styles.main}>
        {children}
      </main>
      <AppFooter
        brand={content.brand}
        navigation={content.navigation}
        footer={content.footer}
        contacts={{
          ...content.contacts,
          whatsapp,
        }}
      />

      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappFloat || styles.floatingChat}
          aria-label={whatsapp?.accessible_label || whatsapp?.label || "WhatsApp"}
        >
          <AppIcon name="chat-round-dots" size={38} />
        </a>
      ) : null}
    </div>
  );
}
