import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0F172A] text-white shadow-sm hover:bg-[#111c34] focus-visible:ring-[#3B82F6]",
  secondary:
    "bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-slate-50 focus-visible:ring-[#3B82F6]",
  outline:
    "bg-transparent text-[#0F172A] border border-[#E2E8F0] hover:bg-slate-50 focus-visible:ring-[#3B82F6]",
  ghost:
    "bg-transparent text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A] focus-visible:ring-[#3B82F6]",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "h-11 px-4 text-sm",
  sm: "h-8 px-3 text-xs rounded-md",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
