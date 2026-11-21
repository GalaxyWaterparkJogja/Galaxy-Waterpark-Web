import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export interface CarouselArrowIconProps extends SVGProps<SVGSVGElement> {
  direction?: "left" | "right" | "prev" | "next";
  size?: number | string;
}

export function CarouselArrowIcon({
  direction = "right",
  size = 24,
  className,
  role,
  ...props
}: CarouselArrowIconProps) {
  const isLeft = direction === "left" || direction === "prev";
  const isAriaHidden =
    props["aria-hidden"] !== undefined
      ? props["aria-hidden"]
      : !(props["aria-label"] || props["aria-labelledby"]);

  const computedRole =
    role ?? (props["aria-label"] ? "img" : undefined);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={computedRole}
      aria-hidden={isAriaHidden}
      className={cn(className)}
      {...props}
    >
      {isLeft ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}
