import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"     // CTA verde acción Megalider (#038C3E -> hover #067335)
  | "secondary"   // Fondo claro con borde
  | "outline"     // Borde verde esmeralda
  | "soft"        // Fondo menta suave (#A7D9BD/20) con texto esmeralda
  | "danger"      // Alerta / eliminación (rose)
  | "ghost";      // Transparente con hover sutil

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#038C3E] hover:bg-[#067335] text-white shadow-sm shadow-[#038C3E]/30 active:scale-[0.98]",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs active:scale-[0.98]",
  outline:
    "bg-transparent hover:bg-[#A7D9BD]/15 text-[#067335] border border-[#53A677]/60 active:scale-[0.98]",
  soft:
    "bg-[#A7D9BD]/25 hover:bg-[#A7D9BD]/40 text-[#067335] border border-[#53A677]/30 active:scale-[0.98]",
  danger:
    "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-[0.98]",
  ghost:
    "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5 font-semibold",
  md: "text-xs sm:text-sm px-4 py-2 rounded-xl gap-2 font-semibold",
  lg: "text-sm sm:text-base px-5 py-2.5 rounded-xl gap-2.5 font-bold",
  icon: "p-2 rounded-xl shrink-0 flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none font-sans disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
