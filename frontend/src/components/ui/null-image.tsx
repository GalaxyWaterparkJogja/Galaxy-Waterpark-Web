import styles from "./null-image.module.css";

export interface NullImageProps {
  /** Text under the glyph. Pass an empty string to hide it (tiny thumbnails). */
  label?: string;
  className?: string;
}

/**
 * Design for an entity without an image (Figma node 1003:2681): Neutral/200
 * background, "image not supported" glyph and the caption in Neutral/400.
 * It fills its positioned parent, so give the parent the card's aspect ratio.
 */
export function NullImage({
  label = "Gambar Tidak Tersedia",
  className,
}: NullImageProps) {
  return (
    <div
      className={className ? `${styles.root} ${className}` : styles.root}
      role="img"
      aria-label="Gambar tidak tersedia"
    >
      <svg
        className={styles.icon}
        viewBox="0 0 71.742 71.742"
        fill="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M63.3506 63.3425L61.019 61.0109L53.8149 53.8068L40.0943 40.0861L10.7398 10.7317L8.40823 8.4001C8.13168 8.12299 7.8032 7.90314 7.44158 7.75313C7.07996 7.60313 6.69231 7.52592 6.30081 7.52592C5.90931 7.52592 5.52166 7.60313 5.16004 7.75313C4.79842 7.90314 4.46994 8.12299 4.19339 8.4001C2.99769 9.56591 2.99769 11.4491 4.1635 12.6149L8.97619 17.4276V56.796C8.97619 60.0842 11.6665 62.7745 14.9547 62.7745H54.3231L59.1358 67.5872C60.3016 68.753 62.1848 68.753 63.3506 67.5872C64.5164 66.4214 64.5164 64.5083 63.3506 63.3425ZM18.0037 53.8068C16.7482 53.8068 16.0607 52.372 16.8379 51.3855L24.2811 41.8199C24.4189 41.6435 24.5946 41.5003 24.7951 41.4009C24.9957 41.3015 25.216 41.2484 25.4398 41.2456C25.6636 41.2427 25.8852 41.2901 26.0882 41.3844C26.2912 41.4786 26.4705 41.6172 26.6128 41.79L32.8902 49.3528L36.3876 44.839L45.3553 53.8068H18.0037ZM62.7827 54.315L17.4358 8.96806H56.8042C60.0923 8.96806 62.7827 11.6584 62.7827 14.9466V54.315Z"
        />
      </svg>
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  );
}
