const imageRoot = "/images/figma/catalog";

export const catalogGroups = [
  {
    id: "family", title: "Keluarga", mobileTitle: "Keluarga",
    description: "Wahana seluncuran seru dengan berbagai ketinggian dan jalur berliku. Cocok untuk menguji adrenalin dan menambah keseruan bermain air bersama teman maupun keluarga.",
    excerpt: "Wahana seluncuran seru dengan berbagai ketinggian dan jalur berliku.",
    images: ["slide-yellow.png", "slide-green.png", "slide-red.png"],
    mobileImage: `${imageRoot}/slide-red.png`,
    itemName: "Perosotan", mobileItemName: "Slides",
    hasMobileRail: false,
    facts: [{label:"Ukuran Perosotan",value:"Tinggi (12 m) · Panjang (50 m)"},{label:"Tinggi minimum (pengunjung)",value:"120 cm"}],
  },
  {
    id: "sports-wellness", title: "Sport & Wellness", mobileTitle: "Olahraga & Fasilitas",
    description: "Area olahraga air representatif dengan standar ukuran memadai dan sirkulasi air yang baik. Cocok untuk melatih kebugaran fisik dan menjaga kesehatan tubuh bersama teman.",
    excerpt: "Area olahraga air representatif dengan standar ukuran memadai.",
    images: ["pool.png"], mobileImage: `${imageRoot}/pool-mobile.png`,
    itemName: "Olympic", mobileItemName: "Olympic",
    hasMobileRail: true,
    facts: [],
  },
  {
    id: "facilities", title: "Fasilitas", mobileTitle: "Fasilitas",
    description: "Fasilitas penunjang nyaman dengan berbagai pilihan ukuran dan perlengkapan bersih. Cocok untuk tempat beristirahat dan melengkapi kenyamanan bersantai bersama teman maupun keluarga.",
    excerpt: "Fasilitas penunjang nyaman dengan berbagai pilihan ukuran.",
    images: ["gazebo.png"], mobileImage: "/images/figma/facility-final.png",
    itemName: "Gazebo", mobileItemName: "Gazebo",
    hasMobileRail: false,
    facts: [],
  },
] as const;

export type CatalogGroup = typeof catalogGroups[number];
export interface CatalogItem {
  id: string;
  title: string;
  mobileTitle: string;
  image: string | null;
  description?: string | null;
  heightRequirement?: string | null;
  price?: number | null;
  durationMinutes?: number | null;
}
export function catalogItems(
  group: CatalogGroup,
  records?: ReadonlyArray<{
    id: number | string;
    name: string;
    image_url: string | null;
    description?: string | null;
    height_requirement?: string | null;
    price?: number | null;
    duration_minutes?: number | null;
  }>,
): CatalogItem[] {
  if (records) {
    return records.map((record) => ({
      id: String(record.id),
      title: record.name,
      mobileTitle: record.name,
      image: record.image_url || null,
      description: record.description,
      heightRequirement: record.height_requirement,
      price: record.price,
      durationMinutes: record.duration_minutes,
    }));
  }

  return Array.from({length: 9}, (_, index) => ({
    id: `${group.id}-${index + 1}`,
    title: `${group.itemName} ${index + 1}`,
    mobileTitle: `${group.mobileItemName} ${index + 1}`,
    image: `${imageRoot}/${group.images[index % group.images.length]}`,
  }));
}
