import type { PromotionCard } from "@/types/public-pages";
import { fetchPublicPromotions, toPromotionCard } from "./promo-event-service";

export async function getPromotions(): Promise<PromotionCard[]> {
  return (await fetchPublicPromotions()).map(toPromotionCard);
}
