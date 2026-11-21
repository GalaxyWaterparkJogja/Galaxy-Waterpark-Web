import { getSafePromotions } from "@/services/content-service";
import type { PromotionCard } from "@/types/public-pages";
import { PromoGrid } from "./promo-grid";

export async function PromoPage({
  items,
}: {
  items?: PromotionCard[];
} = {}) {
  return <PromoGrid items={items ?? (await getSafePromotions())} />;
}
export default PromoPage;
