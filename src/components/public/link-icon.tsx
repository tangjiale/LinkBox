import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function LinkIcon({ title, iconUrl, className }: { title: string; iconUrl?: string | null; className?: string }) {
  if (iconUrl) {
    return (
      // 外部 favicon 域名不可预知，首版直接渲染原图并保持固定尺寸。
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=""
        className={cn("size-10 rounded-lg border border-slate-100 object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid size-10 place-items-center rounded-lg bg-gradient-to-br from-blue-50 to-emerald-50 text-sm font-semibold text-blue-700 ring-1 ring-slate-200",
        className,
      )}
    >
      {title.trim().slice(0, 1).toUpperCase() || <ExternalLink className="size-4" />}
    </div>
  );
}
