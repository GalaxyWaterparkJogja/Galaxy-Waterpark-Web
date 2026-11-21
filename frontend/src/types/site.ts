export interface SiteNavigationItem {
  label: string;
  href: string;
  pathname: string;
}

export interface SiteBrand {
  name: string;
  description: string;
  href: string;
  home_label: string;
  logo: { src: string; width: number; height: number };
}

export interface SiteContact {
  label: string;
  href: string | null;
  accessible_label: string;
}

export interface SiteContent {
  brand: SiteBrand;
  navigation: SiteNavigationItem[];
  header: {
    navigation_label: string;
    open_label: string;
    close_label: string;
    menu_title: string;
  };
  footer: {
    navigation_label: string;
    contacts_label: string;
    copyright: string;
  };
  contacts: {
    location: SiteContact;
    instagram: SiteContact;
    whatsapp: SiteContact | null;
  };
  skip_label: string;
}
