import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppIcon, type IconName } from "./icons";
import styles from "./empty-state.module.css";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  iconName?: IconName;
  action?: EmptyStateAction | null;
  secondaryAction?: EmptyStateAction | null;
  className?: string;
}

export function EmptyState({
  title,
  description,
  iconName = "ticket",
  action = { label: "Kembali ke Beranda", href: "/" },
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={cn(styles.container, className)} role="status">
      <div className={styles.iconWrapper} aria-hidden="true">
        <AppIcon name={iconName} size={28} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {(action || secondaryAction) && (
        <div className={styles.actionGroup}>
          {action &&
            (action.href ? (
              <Link href={action.href} className={styles.actionButton}>
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className={styles.actionButton}
              >
                {action.label}
              </button>
            ))}
          {secondaryAction &&
            (secondaryAction.href ? (
              <Link href={secondaryAction.href} className={styles.secondaryButton}>
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className={styles.secondaryButton}
              >
                {secondaryAction.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
