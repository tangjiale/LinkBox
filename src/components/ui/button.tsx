import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ asChild, className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:focus-ring",
        size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
        variant === "primary" && "bg-primary text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700",
        variant === "secondary" && "border border-line bg-white text-slate-800 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100",
        className,
      )}
      {...props}
    />
  );
}
