import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400",
        "focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400",
        "focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-slate-900 outline-none transition",
        "focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]",
        className,
      )}
      {...props}
    />
  );
}
