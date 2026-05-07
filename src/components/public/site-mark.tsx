import { Box } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { APP_VERSION_LABEL } from "@/lib/version";

export function SiteMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("grid place-items-center rounded-lg bg-primary text-white shadow-sm shadow-blue-500/20", compact ? "size-8" : "size-9")}>
        <Box className={compact ? "size-4.5" : "size-5"} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <div className={cn("font-semibold tracking-tight text-slate-950", compact ? "text-[15px]" : "text-base")}>链接盒子</div>
          <span
            className={cn(
              "rounded-full border border-blue-100 bg-blue-50 font-medium text-primary",
              compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
            )}
          >
            {APP_VERSION_LABEL}
          </span>
        </div>
        {compact ? null : <div className="text-xs text-slate-500">LinkBox</div>}
      </div>
    </div>
  );
}
