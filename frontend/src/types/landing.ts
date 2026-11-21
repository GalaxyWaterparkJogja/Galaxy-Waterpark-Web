export interface LandingHero {
  eyebrow: string;
  title: string;
  description: string;
  image_url: string;
  cta_label: string;
  cta_href: string;
  secondary_cta_label?: string;
  secondary_cta_href?: string;
}

export interface LandingLabels {
  categories: string;
  tickets: string;
  promos: string;
  events: string;
  reviews: string;
  weekday: string;
  weekend: string;
  rating_suffix: string;
  back_to_top: string;
}

export interface LandingSchedule {
  title: string;
  weekday_label: string;
  weekday_hours: string;
  weekend_label: string;
  weekend_hours: string;
  closed_label: string;
}

export interface LandingCategory {
  id: string;
  label: string;
  image_url: string;
  mobile_image_url?: string;
  href: string;
}

export interface LandingTicket {
  id: string;
  label: string;
  age: string;
  weekday: string;
  weekend: string;
}

export interface LandingPromotion {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  image_alt: string;
  href: string;
}

export interface LandingEvent {
  id: string;
  title: string;
  description: string;
  excerpt: string;
  image_url: string | null;
  image_alt: string;
  href: string;
}

export interface LandingAbout {
  title: string;
  paragraphs: { text: string; emphasis?: string }[];
  image_url: string;
  image_alt: string;
  backdrop_url: string;
}

export interface LandingAction {
  label: string;
  mobile_label?: string;
  href: string;
}

export interface LandingPartners {
  title: string;
  description: string;
  items: { id: string; name: string; image_url: string | null }[];
}

export interface LandingCarouselLabels {
  page: string;
  instructions: string;
  pause: string;
  resume: string;
}

export interface LandingReview {
  id: string;
  name: string;
  text: string;
  rating: number;
  raised_stars?: boolean;
  status?: "menunggu" | "dipublikasi" | "ditolak" | string;
}

export type LandingLocationIcon = "bus" | "clock" | "parking";

export interface LandingLocation {
  title: string;
  address: string;
  embed_url: string;
  map_label: string;
  href: string;
  features: {
    id: string;
    icon: LandingLocationIcon;
    title: string;
    description: string;
    mobile_title?: string;
    mobile_description?: string;
  }[];
}

export interface LandingContent {
  labels: LandingLabels;
  hero: LandingHero;
  schedule: LandingSchedule;
  categories: LandingCategory[];
  tickets: LandingTicket[];
  promos: LandingPromotion[];
  events: LandingEvent[];
  about: LandingAbout;
  partners: LandingPartners;
  reviews: LandingReview[];
  review_action: LandingAction;
  more_promos: LandingAction;
  more_events: LandingAction;
  carousel_labels: LandingCarouselLabels;
  location: LandingLocation;
}
