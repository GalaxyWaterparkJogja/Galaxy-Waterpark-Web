import Image from "next/image";

type Asset = { file: string; width: number; height: number };
const assets = {
  more: {
    desktop: { file: "more-arrow-desktop", width: 26.3289, height: 20.6667 },
    mobile: { file: "event-arrow-mobile", width: 14.6667, height: 14.6667 },
  },
  event: {
    desktop: { file: "event-arrow-desktop", width: 21.6664, height: 17.4098 },
  },
  star: {
    desktop: { file: "rating-star-desktop", width: 39.6, height: 39.6 },
    mobile: { file: "rating-star-mobile", width: 22, height: 22 },
  },
  half: {
    desktop: { file: "rating-half-desktop", width: 39.6, height: 39.6 },
    mobile: { file: "rating-half-mobile", width: 22, height: 22 },
  },
  emptyStar: {
    desktop: { file: "rating-empty-desktop", width: 39.6, height: 39.6 },
    mobile: { file: "rating-empty-mobile", width: 22, height: 22 },
  },
  bus: {
    desktop: { file: "visit-bus-desktop", width: 19.0463, height: 23 },
    mobile: { file: "visit-bus-mobile", width: 16.9301, height: 20.0001 },
  },
  clock: {
    desktop: { file: "visit-clock-desktop", width: 21, height: 24.5 },
    mobile: { file: "visit-clock-mobile", width: 19, height: 22.1667 },
  },
  parking: {
    desktop: { file: "visit-parking-desktop", width: 29.4938, height: 22 },
    mobile: { file: "visit-parking-mobile", width: 23.995, height: 18 },
  },
} satisfies Record<string, { desktop: Asset; mobile?: Asset }>;

export type DesignAssetName = keyof typeof assets;

export function DesignAsset({ name }: { name: DesignAssetName }) {
  const asset: { desktop: Asset; mobile?: Asset } = assets[name];
  return (
    <span
      aria-hidden="true"
      className="inline-grid shrink-0 place-items-center"
    >
      {asset.mobile && (
        <Image
          className="desktop:hidden tablet:hidden"
          src={`/images/figma/landing/${asset.mobile.file}.svg`}
          alt=""
          width={asset.mobile.width}
          height={asset.mobile.height}
        />
      )}
      <Image
        className="hidden desktop:block tablet:block"
        src={`/images/figma/landing/${asset.desktop.file}.svg`}
        alt=""
        width={asset.desktop.width}
        height={asset.desktop.height}
      />
    </span>
  );
}
