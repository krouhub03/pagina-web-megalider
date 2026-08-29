import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "emerald"
  | "mint"
  | "amber"
  | "blue"
  | "rose"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  emerald: "bg-emerald-50 text-[#067335] border-emerald-200/80",
  mint: "bg-[#A7D9BD]/25 text-[#067335] border-[#53A677]/30",
  amber: "bg-amber-50 text-amber-700 border-amber-200/80",
  blue: "bg-blue-50 text-blue-700 border-blue-200/80",
  rose: "bg-rose-50 text-rose-700 border-rose-200/80",
  neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
};

const dotColors: Record<BadgeVariant, string> = {
  emerald: "bg-[#038C3E]",
  mint: "bg-[#53A677]",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  rose: "bg-rose-500",
  neutral: "bg-slate-400",
};

export function Badge({
  className,
  variant = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
