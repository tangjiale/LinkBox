import type { LucideIcon } from "lucide-react";

export function StatCard({ title, value, icon: Icon, hint }: { title: string; value: number; icon: LucideIcon; hint: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
