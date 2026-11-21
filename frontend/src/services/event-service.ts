import type { EventCard } from "@/types/public-pages";
import { fetchPublicEvents, toEventCard } from "./promo-event-service";

export async function getEvents(): Promise<EventCard[]> {
  return (await fetchPublicEvents()).map(toEventCard);
}
