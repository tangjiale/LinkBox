"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderTree, Link2, Tags } from "lucide-react";
import { SiteMark } from "@/components/public/site-mark";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/admin", label: "概览", icon: BarChart3 },
  { href: "/admin/categories", label: "分类管理", icon: FolderTree },
  { href: "/admin/links", label: "链接管理", icon: Link2 },
  { href: "/admin/tags", label: "标签管理", icon: Tags },
];

export function AdminFrame({ children, username }: { children: React.ReactNode; username: string }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:block">
        <SiteMark />
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navClass(pathname, item.href)}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-white/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="lg:hidden">
              <SiteMark />
            </div>
            <div className="hidden text-sm text-slate-500 lg:block">管理后台</div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 sm:inline-flex">
                {username}
              </span>
              <LogoutButton />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navClass(pathname, item.href, true)}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function navClass(pathname: string, href: string, compact = false) {
  const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
  const base = compact
    ? "inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition"
    : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition";

  if (active) {
    return `${base} border-blue-100 bg-blue-50 text-primary`;
  }
  return `${base} border-line bg-white text-slate-600 hover:bg-blue-50 hover:text-primary`;
}
