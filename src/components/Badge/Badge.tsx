import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import styles from "./Badge.module.css";

interface BadgeProps {
  variant?: "default" | "award" | "muted";
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Small uppercase pill, shared with the dexo.games look. */
export function Badge({ variant = "default", icon, className, children }: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[variant], className)}>
      {icon}
      {children}
    </span>
  );
}
