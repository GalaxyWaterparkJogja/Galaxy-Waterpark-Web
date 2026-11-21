import Image from "next/image";
import Link from "next/link";
import type { SiteContact, SiteContent } from "@/types/site";
import styles from "./app-footer.module.css";

type ContactIcon = "location" | "instagram" | "whatsapp";
const iconSize = {
  location: { width: 24.4692, height: 24.4692 },
  instagram: { width: 24, height: 24 },
  whatsapp: { width: 20.3707, height: 20.4688 },
};

function ContactItem({
  contact,
  icon,
}: {
  contact: SiteContact;
  icon: ContactIcon;
}) {
  const content = (
    <>
      <span className={styles.contactIcon}>
        <span className={icon === "whatsapp" ? styles.whatsappIcon : undefined}>
          <Image
            src={`/images/figma/layout/${icon}.svg`}
            alt=""
            {...iconSize[icon]}
          />
        </span>
      </span>
      <span className={styles.contactText}>{contact.label}</span>
    </>
  );
  const href = contact.href?.trim();
  if (!href)
    return (
      <div
        className={styles.contactItem}
        role="group"
        aria-label={contact.accessible_label || contact.label || undefined}
      >
        {content}
      </div>
    );
  const external = /^https?:\/\//.test(href);
  return (
    <Link
      href={href}
      className={styles.contactItem}
      aria-label={contact.accessible_label || contact.label || undefined}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {content}
    </Link>
  );
}

type Props = Pick<SiteContent, "brand" | "navigation" | "footer" | "contacts">;

export function AppFooter({ brand, navigation, footer, contacts }: Props) {
  return (
    <footer id="footer" className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <h2>{brand.name}</h2>
          <p className={styles.description}>{brand.description}</p>
        </div>
        <nav className={styles.navigation} aria-label={footer.navigation_label}>
          {navigation.map((item) => (
            <Link key={item.pathname} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.divider} role="separator" />
        <address className={styles.contacts} aria-label={footer.contacts_label}>
          {contacts?.location ? (
            <ContactItem contact={contacts.location} icon="location" />
          ) : null}
          {contacts?.instagram ? (
            <ContactItem contact={contacts.instagram} icon="instagram" />
          ) : null}
          {contacts?.whatsapp ? (
            <ContactItem contact={contacts.whatsapp} icon="whatsapp" />
          ) : null}
        </address>
        <p className={styles.copyright}>{footer.copyright}</p>
      </div>
    </footer>
  );
}
