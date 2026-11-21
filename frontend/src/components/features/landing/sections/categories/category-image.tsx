"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./categories.module.css";

/** Keep category artwork available if an optimized image request fails. */
export function CategoryImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <Image
      className={styles.image}
      src={src}
      alt=""
      fill
      sizes="(min-width: 600px) 33vw, 100vw"
      unoptimized={failed}
      onError={() => setFailed(true)}
    />
  );
}
