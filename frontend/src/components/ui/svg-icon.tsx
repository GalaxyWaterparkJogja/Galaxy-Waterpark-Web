import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export interface SvgIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  title?: string;
}

export function SvgIcon({
  size = 24,
  viewBox = "0 0 24 24",
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  className,
  title,
  children,
  role,
  ...props
}: SvgIconProps) {
  const isAriaHidden =
    props["aria-hidden"] !== undefined
      ? props["aria-hidden"]
      : !(title || props["aria-label"] || props["aria-labelledby"]);

  const computedRole =
    role ?? (title || props["aria-label"] ? "img" : undefined);

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      role={computedRole}
      aria-hidden={isAriaHidden}
      className={cn(className)}
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}
