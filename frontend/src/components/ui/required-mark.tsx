import styles from "./required-mark.module.css";

/**
 * Asterisk shown beside the label of a field the application requires
 * (non-nullable column or an explicit `required` validation rule). Optional
 * fields must not use it.
 */
export function RequiredMark() {
  return (
    <>
      <span className={styles.mark} aria-hidden="true">
        *
      </span>
      <span className={styles.srOnly}> (wajib diisi)</span>
    </>
  );
}
