import { getSafeLandingContent } from "@/services/content-service";
import type { LandingContent } from "@/types/landing";
import { LandingSections } from "./landing-sections";
import { LandingMotion } from "./components/landing-motion";

export async function LandingPage({
  content: preloadedContent,
}: {
  content?: LandingContent;
} = {}) {
  const content = preloadedContent ?? (await getSafeLandingContent());

  return (
    <LandingMotion>
      <LandingSections content={content} />
    </LandingMotion>
  );
}
