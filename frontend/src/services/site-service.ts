import siteFixture from "@/fixtures/site.json";
import type { SiteContent } from "@/types/site";

/** Shared content contract for the site shell; keep business data out of JSX. */
export function getSiteContent(): SiteContent {
  return structuredClone(siteFixture satisfies SiteContent);
}
