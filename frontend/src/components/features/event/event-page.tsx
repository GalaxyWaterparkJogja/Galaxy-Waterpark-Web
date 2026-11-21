import { getSafeEvents } from "@/services/content-service";
import type { EventCard } from "@/types/public-pages";
import { EventGrid } from "./event-grid";

export async function EventPage({
  items,
}: {
  items?: EventCard[];
} = {}) {
  return <EventGrid items={items ?? (await getSafeEvents())} />;
}
export default EventPage;
