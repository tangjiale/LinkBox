import { FolderTree, Link2, Star, Tags } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { getAdminSummary } from "@/lib/db/queries";

export default function AdminHomePage() {
  const summary = getAdminSummary();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">概览</h1>
        <p className="mt-1 text-sm text-slate-500">快速查看链接盒子的内容规模和最近维护状态。</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="链接总数" value={summary.linksCount} icon={Link2} hint={`${summary.activeLinksCount} 个正在展示`} />
        <StatCard title="分类总数" value={summary.categoriesCount} icon={FolderTree} hint="公开页按分类聚合展示" />
        <StatCard title="标签总数" value={summary.tagsCount} icon={Tags} hint="支持多标签关联链接" />
        <StatCard title="热门推荐" value={summary.featuredLinksCount} icon={Star} hint="会进入热门链接区域" />
      </section>
      <section className="rounded-xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold text-slate-950">最近链接</h2>
        </div>
        <div className="divide-y divide-line">
          {summary.recentLinks.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="font-medium text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-500">{item.url}</div>
              </div>
              <div className="flex items-center gap-2">
                {item.category ? <Badge>{item.category.name}</Badge> : null}
                <Badge className={item.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                  {item.isActive ? "启用" : "停用"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
