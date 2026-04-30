"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Category, LinkItem, Tag } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LinkIcon } from "@/components/public/link-icon";

type LinkForm = {
  title: string;
  url: string;
  description: string;
  iconUrl: string;
  categoryId: string;
  tagIds: string[];
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

function createEmptyForm(categories: Category[]): LinkForm {
  return {
    title: "",
    url: "https://",
    description: "",
    iconUrl: "",
    categoryId: categories[0]?.id ?? "",
    tagIds: [],
    isFeatured: false,
    isActive: true,
    sortOrder: 0,
  };
}

export function LinkManager({ links, categories, tags }: { links: LinkItem[]; categories: Category[]; tags: Tag[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<LinkForm>(() => createEmptyForm(categories));

  const filteredLinks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return links.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.title, item.url, item.description, item.category?.name, ...item.tags.map((tag) => tag.name)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
      return matchesKeyword && matchesCategory;
    });
  }, [categoryFilter, links, query]);

  function edit(link: LinkItem) {
    setEditingId(link.id);
    setForm({
      title: link.title,
      url: link.url,
      description: link.description ?? "",
      iconUrl: link.iconUrl ?? "",
      categoryId: link.categoryId,
      tagIds: link.tags.map((tag) => tag.id),
      isFeatured: link.isFeatured,
      isActive: link.isActive,
      sortOrder: link.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(createEmptyForm(categories));
    setMessage("");
  }

  function toggleTag(tagId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      tagIds: checked ? [...current.tagIds, tagId] : current.tagIds.filter((id) => id !== tagId),
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(editingId ? `/api/links/${editingId}` : "/api/links", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "保存失败");
      return;
    }
    window.location.reload();
  }

  async function remove(link: LinkItem) {
    if (!window.confirm(`确认删除链接「${link.title}」吗？`)) return;
    const response = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "删除失败");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">链接管理</h1>
        <p className="mt-1 text-sm text-slate-500">维护公开页展示的网站链接、分类、标签、热门和启停状态。</p>
      </div>

      <form className="grid gap-5 rounded-xl border border-line bg-white p-5 shadow-sm xl:grid-cols-2" onSubmit={submit}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="网站名称">
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Field>
            <Field label="分类">
              <Select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="URL">
            <Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
          </Field>
          <Field label="图标 URL（可选）">
            <Input value={form.iconUrl} onChange={(event) => setForm({ ...form, iconUrl: event.target.value })} placeholder="留空时自动生成首字母图标" />
          </Field>
          <Field label="描述">
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
        </div>

        <div className="space-y-4">
          <Field label="标签">
            <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-slate-50 p-3">
              {tags.map((tag) => (
                <label key={tag.id} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                  <input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={(event) => toggleTag(tag.id, event.target.checked)} />
                  <span style={{ color: tag.color }}>{tag.name}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="排序">
              <Input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
            </Field>
            <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isFeatured} onChange={(event) => setForm({ ...form, isFeatured: event.target.checked })} />
              热门推荐
            </label>
            <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              启用展示
            </label>
          </div>
          {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
          <div className="flex gap-2">
            <Button>{editingId ? "保存链接" : "新增链接"}</Button>
            {editingId ? (
              <Button type="button" variant="secondary" onClick={reset}>
                取消
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      <section className="rounded-xl border border-line bg-white shadow-sm">
        <div className="grid gap-3 border-b border-line px-5 py-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索链接、URL、标签..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">全部分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">网站</th>
                <th className="px-5 py-3">分类</th>
                <th className="px-5 py-3">标签</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLinks.map((link) => (
                <tr key={link.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <LinkIcon title={link.title} iconUrl={link.iconUrl} />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{link.title}</div>
                        <div className="mt-1 max-w-md truncate text-xs text-slate-500">{link.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{link.category ? <Badge>{link.category.name}</Badge> : null}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {link.tags.map((tag) => (
                        <Badge key={tag.id} style={{ background: `${tag.color}12`, color: tag.color }}>
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <Badge className={link.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                        {link.isActive ? "启用" : "停用"}
                      </Badge>
                      {link.isFeatured ? <Badge className="bg-amber-50 text-amber-700">热门</Badge> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{link.sortOrder}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => edit(link)}>
                        编辑
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(link)}>
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
