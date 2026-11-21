import Link from "next/link";
import type { LandingAction } from "@/types/landing";
import { DesignAsset } from "./design-asset";

export const sectionTitleClassName =
  "font-bold text-(--color-text-primary) text-(length:--type-section-size) leading-(--type-section-leading) desktop:text-(length:--type-section-desktop-size) desktop:leading-(--type-section-desktop-leading) desktop:tracking-(--type-section-desktop-tracking) tablet:text-(length:--type-section-tablet-size) tablet:leading-(--type-section-tablet-leading)";

export function SectionHeading({
  id,
  title,
  action,
  centered = false,
}: {
  id: string;
  title: string;
  action?: LandingAction;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex items-center tablet:gap-6 ${centered ? "justify-center desktop:justify-start" : "justify-between"}`}
    >
      <h2 id={id} className={sectionTitleClassName}>
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="flex min-h-[44px] items-center gap-2 text-[13px] font-semibold tracking-tight text-(--color-text-primary) transition-opacity hover:opacity-80 tablet:min-h-11 tablet:w-auto tablet:shrink-0 tablet:gap-3.5 tablet:text-[18px] tablet:leading-[26px] tablet:font-bold desktop:w-[250px] desktop:justify-between desktop:text-[22px] desktop:leading-[30px]"
        >
          <span>{action.label}</span>
          <DesignAsset name="more" />
        </Link>
      )}
    </div>
  );
}
