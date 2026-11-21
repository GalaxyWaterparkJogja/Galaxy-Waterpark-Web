export interface PromotionCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  benefit: string;
  benefit_description: string;
  mobile_benefit?: string;
  mobile_benefit_description?: string;
  image_url: string | null;
  image_alt: string;
  desktop_only?: boolean;
}

export interface EventCard {
  id: string;
  title: string;
  description: string;
  excerpt: string;
  image_url: string | null;
  image_alt: string;
  mobile_only?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface GalleryPhoto {
  id: string;
  image_url: string | null;
  alt: string;
  aspect_ratio?: string;
  width?: number;
  height?: number;
}

export interface CatalogFact {
  label: string;
  value: string;
}

export interface CatalogGroupData {
  id: string;
  title: string;
  mobileTitle: string;
  description: string;
  excerpt: string;
  images: readonly string[] | string[];
  mobileImage: string;
  itemName: string;
  mobileItemName: string;
  hasMobileRail?: boolean;
  facts: readonly CatalogFact[] | CatalogFact[];
}

export interface CatalogItemData {
  id: string;
  title: string;
  mobileTitle: string;
  image: string | null;
  description?: string | null;
  heightRequirement?: string | null;
  price?: number | null;
  durationMinutes?: number | null;
}
