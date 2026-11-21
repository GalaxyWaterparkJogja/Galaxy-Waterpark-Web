"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./hero.module.css";

const fallbackImage = "/images/figma/hero-final.png";

export function HeroImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = failed ? fallbackImage : src.trim() || fallbackImage;

  return <Image
    className={`${styles.image} pointer-events-none z-0`}
    src={imageSrc}
    alt=""
    fill
    preload
    sizes="100vw"
    unoptimized={failed || /^https?:\/\//i.test(imageSrc)}
    onError={() => setFailed(true)}
  />;
}
