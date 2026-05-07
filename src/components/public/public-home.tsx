"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Bot,
  Clock3,
  Code2,
  Flame,
  Globe2,
  Grid2X2,
  Heart,
  Moon,
  Search,
  Star,
  Sun,
  Zap,
} from "lucide-react";
import type { LinkItem, PublicData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkIcon } from "./link-icon";
import { SiteMark } from "./site-mark";
import { cn } from "@/lib/utils/cn";

type FilterMode = "all" | "featured" | "recent" | string;

const categoryIconMap = [Bot, Code2, Heart, Zap, BookOpen, Globe2];

export function PublicHome({ data }: { data: PublicData }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showAllCards, setShowAllCards] = useState(false);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const categoryCounts = useMemo(() => {
    return new Map(data.categories.map((category) => [category.id, data.links.filter((link) => link.categoryId === category.id).length]));
  }, [data.categories, data.links]);

  const filteredLinks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const links = data.links.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.title, item.url, item.description, item.category?.name, ...item.tags.map((tag) => tag.name)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesFilter =
        filter === "all" ||
        (filter === "featured" && item.isFeatured) ||
        (filter === "recent" && true) ||
        item.categoryId === filter;

      return matchesKeyword && matchesFilter;
    });

    if (filter === "recent") {
      return [...links].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    }

    return links;
  }, [data.links, filter, query]);

  const cardItems = showAllCards ? filteredLinks : filteredLinks.slice(0, 8);
  const recent = [...filteredLinks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, showAllRecent ? 20 : 6);

  function applyFilter(nextFilter: FilterMode) {
    setFilter(nextFilter);
    setShowAllCards(false);
    setShowAllRecent(false);
  }

  function resetFilters() {
    setQuery("");
    applyFilter("all");
  }

  return (
    <div className={cn("min-h-screen bg-[#f7f9fc] text-slate-950", darkMode && "bg-slate-950 text-slate-100")}>
      <header className={cn("sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur", darkMode && "border-slate-800 bg-slate-950/95")}>
        <div className="mx-auto flex h-[60px] max-w-[1440px] items-center justify-between px-5">
          <SiteMark compact />
          <nav className={cn("hidden h-full items-center gap-8 text-sm font-medium text-slate-600 md:flex", darkMode && "text-slate-300")}>
            <TopNav active={filter === "all" && !query} darkMode={darkMode} onClick={resetFilters}>
              首页
            </TopNav>
            <TopNav active={data.categories.some((category) => category.id === filter)} darkMode={darkMode} onClick={() => applyFilter(data.categories[0]?.id ?? "all")}>
              分类
            </TopNav>
            <TopNav active={filter === "featured"} darkMode={darkMode} onClick={() => applyFilter("featured")}>
              热门
            </TopNav>
            <TopNav active={filter === "recent"} darkMode={darkMode} onClick={() => applyFilter("recent")}>
              最近收录
            </TopNav>
          </nav>
          <div className="flex items-center gap-3">
            <button
              className={cn(
                "hidden size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 md:grid",
                darkMode && "text-slate-300 hover:bg-slate-800",
              )}
              title={darkMode ? "切换浅色模式" : "切换深色模式"}
              aria-label={darkMode ? "切换浅色模式" : "切换深色模式"}
              onClick={() => setDarkMode((current) => !current)}
            >
              {darkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-0 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className={cn("border-r border-slate-200 bg-white lg:min-h-[calc(100vh-60px)]", darkMode && "border-slate-800 bg-slate-900")}>
          <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:sticky lg:top-[60px] lg:block lg:space-y-2 lg:overflow-visible lg:py-4">
            <CategoryNavItem active={filter === "all"} darkMode={darkMode} icon={Grid2X2} label="全部分类" onClick={resetFilters} />
            {data.categories.map((category, index) => (
              <CategoryNavItem
                key={category.id}
                active={filter === category.id}
                darkMode={darkMode}
                icon={categoryIconMap[index % categoryIconMap.length]}
                label={category.name}
                onClick={() => applyFilter(category.id)}
              />
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-5 py-8">
          <section className={cn("rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-[0_18px_48px_rgba(15,23,42,0.04)] md:px-8 md:py-10", darkMode && "border-slate-800 bg-slate-900 shadow-none")}>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className={cn("text-3xl font-semibold tracking-tight text-slate-950 md:text-[34px] md:leading-tight", darkMode && "text-white")}>
                发现优质网站，从 <span className="text-primary">链接盒子</span> 开始
              </h1>
              <p className={cn("mt-3 text-sm leading-6 text-slate-500 md:text-base", darkMode && "text-slate-400")}>精选优质网站资源，分类整理，快速查找，高效访问</p>

              <div className="mx-auto mt-7 flex max-w-[650px] gap-3">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className={cn("h-12 rounded-lg pl-11", darkMode && "border-slate-700 bg-slate-950 text-slate-100")}
                    placeholder="搜索网站、工具、资源..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <Button className="h-12 min-w-20 rounded-lg" onClick={() => applyFilter("all")}>
                  搜索
                </Button>
              </div>

              <div className={cn("mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500", darkMode && "text-slate-400")}>
                <span>热门搜索：</span>
                {["AI写作", "设计素材", "开发工具", "数据可视化", "在线转换"].map((item) => (
                  <button
                    key={item}
                    className={cn("rounded-md bg-slate-100 px-2.5 py-1 transition hover:bg-blue-50 hover:text-primary", darkMode && "bg-slate-800 hover:bg-slate-700")}
                    onClick={() => {
                      setQuery(item);
                      applyFilter("all");
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("mt-8 rounded-xl border border-slate-200 bg-white p-4", darkMode && "border-slate-800 bg-slate-950")}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={cn("text-base font-semibold text-slate-950", darkMode && "text-white")}>精选分类</h2>
                <button className="text-xs font-medium text-primary" onClick={resetFilters}>
                  查看全部
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {data.categories.map((category, index) => {
                  const Icon = categoryIconMap[index % categoryIconMap.length];
                  return (
                    <button
                      key={category.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm",
                        filter === category.id && "border-blue-300 bg-blue-50",
                        darkMode && "border-slate-800 bg-slate-900 hover:border-blue-500",
                        darkMode && filter === category.id && "border-blue-500 bg-blue-950/40",
                      )}
                      onClick={() => applyFilter(category.id)}
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm font-semibold text-slate-900", darkMode && "text-slate-100")}>{category.name}</span>
                        <span className={cn("mt-0.5 block text-xs text-slate-400", darkMode && "text-slate-500")}>{categoryCounts.get(category.id) ?? 0} 个站点</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={cn("mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]", darkMode && "border-slate-800 bg-slate-900 shadow-none")}>
            <SectionHeader
              darkMode={darkMode}
              icon={<Flame className="size-4 fill-red-500 text-red-500" />}
              title={sectionTitle(filter)}
              action={showAllCards ? "收起" : "查看全部"}
              onAction={() => setShowAllCards((current) => !current)}
            />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {cardItems.map((item) => (
                <LinkCard key={item.id} item={item} darkMode={darkMode} />
              ))}
            </div>
            {cardItems.length === 0 ? <EmptyState darkMode={darkMode} /> : null}
          </section>

          <section className={cn("mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]", darkMode && "border-slate-800 bg-slate-900 shadow-none")}>
            <SectionHeader
              darkMode={darkMode}
              icon={<Clock3 className="size-4 text-sky-500" />}
              title="最近收录"
              action={showAllRecent ? "收起" : "查看全部"}
              onAction={() => setShowAllRecent((current) => !current)}
            />
            <RecentTable items={recent} darkMode={darkMode} />
          </section>
        </main>
      </div>
    </div>
  );
}

function TopNav({ active, children, darkMode, onClick }: { active: boolean; children: React.ReactNode; darkMode: boolean; onClick: () => void }) {
  return (
    <button className={cn("relative h-full transition hover:text-primary", active && "text-primary", darkMode && !active && "text-slate-300")} onClick={onClick}>
      {children}
      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" /> : null}
    </button>
  );
}

function CategoryNavItem({
  active,
  darkMode,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  darkMode: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-sm font-medium transition lg:w-full",
        active ? "bg-primary text-white shadow-sm shadow-blue-500/20" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
        darkMode && !active && "text-slate-300 hover:bg-slate-800 hover:text-white",
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function SectionHeader({
  icon,
  title,
  action,
  darkMode,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  action: string;
  darkMode: boolean;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={cn("flex items-center gap-2 text-base font-semibold text-slate-950", darkMode && "text-white")}>
        {icon}
        {title}
      </h2>
      <button className="text-xs font-medium text-primary" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}

function sectionTitle(filter: FilterMode) {
  if (filter === "featured") return "热门链接";
  if (filter === "recent") return "最近收录";
  return "热门链接";
}

function LinkCard({ item, darkMode }: { item: LinkItem; darkMode: boolean }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`访问 ${item.title}`}
      className={cn(
        "group block rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-950/5 focus-visible:focus-ring",
        darkMode && "border-slate-800 bg-slate-950 hover:border-blue-500 hover:shadow-none",
      )}
    >
      <div className="flex items-start gap-3">
        <LinkIcon title={item.title} iconUrl={item.iconUrl} className="size-12 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={cn("truncate text-sm font-semibold text-slate-950", darkMode && "text-slate-100")}>{item.title}</h3>
            <Star className={cn("size-4 shrink-0 text-slate-300", item.isFeatured && "fill-amber-400 text-amber-400")} />
          </div>
          <p className={cn("mt-1 line-clamp-1 text-xs text-slate-400", darkMode && "text-slate-500")}>{item.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.tags.slice(0, 2).map((tag) => (
          <Badge key={tag.id} className="border-transparent px-2 py-0.5" style={{ background: `${tag.color}12`, color: tag.color }}>
            {tag.name}
          </Badge>
        ))}
      </div>
    </a>
  );
}

function RecentTable({ items, darkMode }: { items: LinkItem[]; darkMode: boolean }) {
  return (
    <div className={cn("mt-4 overflow-x-auto rounded-xl border border-slate-200", darkMode && "border-slate-800")}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className={cn("bg-slate-50 text-xs font-medium text-slate-500", darkMode && "bg-slate-950 text-slate-400")}>
          <tr>
            <th className="px-4 py-3">网站名称</th>
            <th className="px-4 py-3">简介</th>
            <th className="px-4 py-3">分类</th>
            <th className="px-4 py-3">标签</th>
            <th className="px-4 py-3">收录时间</th>
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className={cn("divide-y divide-slate-200 bg-white", darkMode && "divide-slate-800 bg-slate-900")}>
          {items.map((item) => (
            <tr key={item.id} className={cn("transition hover:bg-slate-50/80", darkMode && "hover:bg-slate-800/80")}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <LinkIcon title={item.title} iconUrl={item.iconUrl} className="size-8 rounded-lg" />
                  <span className={cn("font-medium text-slate-900", darkMode && "text-slate-100")}>{item.title}</span>
                </div>
              </td>
              <td className={cn("max-w-[260px] truncate px-4 py-3 text-slate-500", darkMode && "text-slate-400")}>{item.description}</td>
              <td className="px-4 py-3">{item.category ? <Badge className="bg-emerald-50 text-emerald-700">{item.category.name}</Badge> : null}</td>
              <td className="px-4 py-3">
                <div className="flex gap-1.5">
                  {item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag.id}>{tag.name}</Badge>
                  ))}
                </div>
              </td>
              <td className={cn("px-4 py-3 text-slate-500", darkMode && "text-slate-400")}>{formatDate(item.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-7 items-center rounded-md border border-blue-100 px-2.5 text-xs font-medium text-primary hover:bg-blue-50"
                >
                  访问
                </a>
              </td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className={cn("px-4 py-8 text-center text-sm text-slate-500", darkMode && "text-slate-400")}>
                没有匹配的网站链接
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ darkMode }: { darkMode: boolean }) {
  return <div className={cn("mt-4 rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500", darkMode && "border-slate-800 text-slate-400")}>没有匹配的网站链接</div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
