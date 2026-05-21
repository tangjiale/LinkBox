"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, ChevronLeft, ChevronRight, FolderTree, Plus, Search, Sparkles, Star, Tags, Trash2, X } from "lucide-react";
import type { Category, LinkItem, Tag } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LinkIcon } from "@/components/public/link-icon";
import { getFetchErrorMessage, parseApiResponse } from "@/lib/api/client";
import { StatCard } from "./stat-card";

const PAGE_SIZE = 10;

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

type SortDirection = "asc" | "desc";

function toLinkForm(link: LinkItem): LinkForm {
  return {
    title: link.title,
    url: link.url,
    description: link.description ?? "",
    iconUrl: link.iconUrl ?? "",
    categoryId: link.categoryId,
    tagIds: link.tags.map((tag) => tag.id),
    isFeatured: link.isFeatured,
    isActive: link.isActive,
    sortOrder: link.sortOrder,
  };
}

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
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<"category" | "tag" | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<LinkForm>(() => createEmptyForm(categories));
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingIcon, setResolvingIcon] = useState(false);
  const [titleSort, setTitleSort] = useState<SortDirection | null>(null);

  const filteredLinks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const result = links.filter((item) => {
      const matchesKeyword =
        !keyword ||
        [item.title, item.url, item.description, item.category?.name, ...item.tags.map((tag) => tag.name)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(item.categoryId);
      const matchesTag = tagFilter.length === 0 || item.tags.some((tag) => tagFilter.includes(tag.id));
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesFeatured = featuredFilter === "all" || (featuredFilter === "featured" ? item.isFeatured : !item.isFeatured);
      return matchesKeyword && matchesCategory && matchesTag && matchesStatus && matchesFeatured;
    });

    return result.sort((left, right) => {
      if (titleSort) {
        const titleCompare = left.title.localeCompare(right.title, "zh-CN", { numeric: true, sensitivity: "base" });
        if (titleCompare !== 0) return titleSort === "asc" ? titleCompare : -titleCompare;
      }

      const createdCompare = right.createdAt.localeCompare(left.createdAt);
      if (createdCompare !== 0) return createdCompare;

      return left.title.localeCompare(right.title, "zh-CN", { numeric: true, sensitivity: "base" });
    });
  }, [categoryFilter, featuredFilter, links, query, statusFilter, tagFilter, titleSort]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLinks = filteredLinks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pagedIds = pagedLinks.map((link) => link.id);
  const selectedCount = selectedIds.length;
  const currentPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.includes(id));
  const currentPagePartiallySelected = pagedIds.some((id) => selectedIds.includes(id)) && !currentPageSelected;
  const pageStart = filteredLinks.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredLinks.length);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
    setSelectedIds([]);
  }

  function updateCategoryFilter(value: string[]) {
    setCategoryFilter(value);
    setPage(1);
    setSelectedIds([]);
  }

  function updateTagFilter(value: string[]) {
    setTagFilter(value);
    setPage(1);
    setSelectedIds([]);
  }

  function updateStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
    setSelectedIds([]);
  }

  function updateFeaturedFilter(value: string) {
    setFeaturedFilter(value);
    setPage(1);
    setSelectedIds([]);
  }

  function toggleTitleSort() {
    setTitleSort((current) => (current === "asc" ? "desc" : "asc"));
    setPage(1);
    setSelectedIds([]);
  }

  function toggleCurrentPage(checked: boolean) {
    setSelectedIds((current) => {
      if (checked) return Array.from(new Set([...current, ...pagedIds]));
      return current.filter((id) => !pagedIds.includes(id));
    });
  }

  function toggleLink(linkId: string, checked: boolean) {
    setSelectedIds((current) => (checked ? Array.from(new Set([...current, linkId])) : current.filter((id) => id !== linkId)));
  }

  function openCreate() {
    setEditingId(null);
    setForm(createEmptyForm(categories));
    setMessage("");
    setFormOpen(true);
  }

  function edit(link: LinkItem) {
    setEditingId(link.id);
    setForm(toLinkForm(link));
    setMessage("");
    setFormOpen(true);
  }

  function reset() {
    setEditingId(null);
    setForm(createEmptyForm(categories));
    setMessage("");
    setFormOpen(false);
  }

  async function resolveIcon() {
    if (resolvingIcon) return;
    const url = form.url.trim();
    if (!url || url === "https://") {
      setMessage("请先填写网站 URL");
      return;
    }

    setResolvingIcon(true);
    setMessage("");
    try {
      const response = await fetch(`/api/favicon?url=${encodeURIComponent(url)}`);
      const data = (await parseApiResponse(response)) as { error?: string; iconUrl?: string };
      if (!response.ok || !data.iconUrl) {
        setMessage(data.error || "没有读取到可用的网站图标");
        return;
      }
      setForm((current) => ({ ...current, iconUrl: data.iconUrl ?? "" }));
    } catch (error) {
      setMessage(getFetchErrorMessage(error));
    } finally {
      setResolvingIcon(false);
    }
  }

  function toggleTag(tagId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      tagIds: checked ? [...current.tagIds, tagId] : current.tagIds.filter((id) => id !== tagId),
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/links/${editingId}` : "/api/links", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        setMessage(data.error || "保存失败");
        return;
      }
      window.location.reload();
    } catch (error) {
      setMessage(getFetchErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(link: LinkItem) {
    if (!window.confirm(`确认删除链接「${link.title}」吗？`)) return;
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/links/${link.id}`, { method: "DELETE" });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        setMessage(data.error || "删除失败");
        return;
      }
      window.location.reload();
    } catch (error) {
      setMessage(getFetchErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeSelected() {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`确认删除选中的 ${selectedIds.length} 个链接吗？`)) return;
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const responses = await Promise.all(selectedIds.map((id) => fetch(`/api/links/${id}`, { method: "DELETE" })));
      const failed = responses.find((response) => !response.ok);
      if (failed) {
        const data = await parseApiResponse(failed);
        setMessage(data.error || "批量删除失败");
        return;
      }
      window.location.reload();
    } catch (error) {
      setMessage(getFetchErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLinkStatus(link: LinkItem) {
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...toLinkForm(link), isActive: !link.isActive }),
      });
      const data = await parseApiResponse(response);
      if (!response.ok) {
        setMessage(data.error || "状态更新失败");
        return;
      }
      window.location.reload();
    } catch (error) {
      setMessage(getFetchErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">链接管理</h1>
        <p className="mt-1 text-sm text-slate-500">维护公开页展示的网站链接、分类、标签、热门和启停状态。</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="链接总数" value={links.length} icon={Search} hint={`${links.filter((item) => item.isActive).length} 个正在展示`} />
        <StatCard title="分类总数" value={categories.length} icon={FolderTree} hint="用于公开页主导航筛选" />
        <StatCard title="标签总数" value={tags.length} icon={Tags} hint="支持一个链接关联多个标签" />
        <StatCard title="热门推荐" value={links.filter((item) => item.isFeatured).length} icon={Star} hint="进入公开页热门区域" />
      </section>

      <section className="rounded-xl border border-line bg-white shadow-sm">
        <div className="grid gap-3 border-b border-line px-5 py-4 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_170px_130px_150px] 2xl:grid-cols-[minmax(240px,1fr)_180px_180px_140px_160px_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="搜索链接、URL、标签..." value={query} onChange={(event) => updateQuery(event.target.value)} />
          </div>
          <MultiFilter
            emptyLabel="全部分类"
            label="分类"
            open={openFilter === "category"}
            options={categories.map((category) => ({ label: category.name, value: category.id }))}
            value={categoryFilter}
            onChange={updateCategoryFilter}
            onOpenChange={(open) => setOpenFilter(open ? "category" : null)}
          />
          <MultiFilter
            emptyLabel="全部标签"
            label="标签"
            open={openFilter === "tag"}
            options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
            value={tagFilter}
            onChange={updateTagFilter}
            onOpenChange={(open) => setOpenFilter(open ? "tag" : null)}
          />
          <Select value={statusFilter} onChange={(event) => updateStatusFilter(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="active">启用</option>
            <option value="inactive">停用</option>
          </Select>
          <Select value={featuredFilter} onChange={(event) => updateFeaturedFilter(event.target.value)}>
            <option value="all">全部推荐</option>
            <option value="featured">热门推荐</option>
            <option value="normal">非热门</option>
          </Select>
          <Button type="button" className="shrink-0" onClick={openCreate}>
            <Plus className="size-4" />
            新增链接
          </Button>
          <Button type="button" variant="danger" className="shrink-0" disabled={submitting || selectedCount === 0} onClick={removeSelected}>
            <Trash2 className="size-4" />
            批量删除{selectedCount > 0 ? `(${selectedCount})` : ""}
          </Button>
        </div>
        {message ? <p className="border-b border-line bg-red-50 px-5 py-3 text-sm text-red-700">{message}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-5 py-3">
                  <input
                    aria-label="选择当前页链接"
                    checked={currentPageSelected}
                    ref={(node) => {
                      if (node) node.indeterminate = currentPagePartiallySelected;
                    }}
                    type="checkbox"
                    onChange={(event) => toggleCurrentPage(event.target.checked)}
                  />
                </th>
                <th className="px-5 py-3" aria-sort={titleSort === "asc" ? "ascending" : titleSort === "desc" ? "descending" : "none"}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md text-left font-medium transition hover:text-primary focus-visible:focus-ring"
                    title="按网站名称排序"
                    onClick={toggleTitleSort}
                  >
                    网站
                    {titleSort === "desc" ? (
                      <ArrowDownAZ className="size-3.5" />
                    ) : titleSort === "asc" ? (
                      <ArrowUpAZ className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5 text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3">说明</th>
                <th className="px-5 py-3">分类</th>
                <th className="px-5 py-3">标签</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pagedLinks.map((link) => (
                <tr key={link.id}>
                  <td className="px-5 py-4">
                    <input
                      aria-label={`选择链接 ${link.title}`}
                      checked={selectedIds.includes(link.id)}
                      type="checkbox"
                      onChange={(event) => toggleLink(link.id, event.target.checked)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <LinkIcon title={link.title} iconUrl={link.iconUrl} />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{link.title}</div>
                        <div className="mt-1 max-w-md truncate text-xs text-slate-500">{link.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-xs line-clamp-2 text-sm leading-5 text-slate-600">{link.description || "未填写说明"}</p>
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
                      <Button size="sm" variant={link.isActive ? "secondary" : "primary"} disabled={submitting} onClick={() => toggleLinkStatus(link)}>
                        {link.isActive ? "停用" : "启用"}
                      </Button>
                      <Button size="sm" variant="secondary" disabled={submitting} onClick={() => edit(link)}>
                        编辑
                      </Button>
                      <Button size="sm" variant="danger" disabled={submitting} onClick={() => remove(link)}>
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedLinks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                    暂无符合条件的链接
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-line px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            共 {filteredLinks.length} 条，当前显示 {pageStart}-{pageEnd}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft className="size-4" />
              上一页
            </Button>
            <span className="min-w-16 text-center text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <Button type="button" size="sm" variant="secondary" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              下一页
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog.Root open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : reset())}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-line bg-white shadow-2xl shadow-slate-950/20">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-950">{editingId ? "编辑链接" : "新增链接"}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-slate-500">维护网站名称、分类、标签、图标和展示状态。</Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button type="button" variant="ghost" size="sm" disabled={submitting}>
                  <X className="size-4" />
                </Button>
              </Dialog.Close>
            </div>
            <LinkFormPanel
              categories={categories}
              editingId={editingId}
              form={form}
              message={message}
              resolvingIcon={resolvingIcon}
              submitting={submitting}
              tags={tags}
              onCancel={reset}
              onResolveIcon={resolveIcon}
              onSubmit={submit}
              onToggleTag={toggleTag}
              onUpdate={setForm}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function LinkFormPanel({
  categories,
  editingId,
  form,
  message,
  resolvingIcon,
  submitting,
  tags,
  onCancel,
  onResolveIcon,
  onSubmit,
  onToggleTag,
  onUpdate,
}: {
  categories: Category[];
  editingId: string | null;
  form: LinkForm;
  message: string;
  resolvingIcon: boolean;
  submitting: boolean;
  tags: Tag[];
  onCancel: () => void;
  onResolveIcon: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleTag: (tagId: string, checked: boolean) => void;
  onUpdate: React.Dispatch<React.SetStateAction<LinkForm>>;
}) {
  return (
    <form className="grid gap-5 p-5 xl:grid-cols-2" onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="网站名称">
            <Input value={form.title} onChange={(event) => onUpdate({ ...form, title: event.target.value })} />
          </Field>
          <Field label="分类">
            <Select value={form.categoryId} onChange={(event) => onUpdate({ ...form, categoryId: event.target.value })}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="URL">
          <Input value={form.url} onChange={(event) => onUpdate({ ...form, url: event.target.value })} />
        </Field>
        <Field label="图标 URL（可选）">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input value={form.iconUrl} onChange={(event) => onUpdate({ ...form, iconUrl: event.target.value })} placeholder="可自动读取，也可以手动填写图标地址" />
            <Button type="button" variant="secondary" disabled={submitting || resolvingIcon} onClick={onResolveIcon}>
              <Sparkles className="size-4" />
              {resolvingIcon ? "读取中..." : "自动读取"}
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
            <LinkIcon title={form.title || form.url || "网站"} iconUrl={form.iconUrl || null} className="size-9 rounded-lg" />
            <span className="text-xs text-slate-500">{form.iconUrl ? "当前图标预览" : "未设置图标时会显示首字母图标"}</span>
          </div>
        </Field>
        <Field label="描述">
          <Textarea value={form.description} onChange={(event) => onUpdate({ ...form, description: event.target.value })} />
        </Field>
      </div>

      <div className="space-y-4">
        <Field label="标签">
          <div className="flex flex-wrap gap-2 rounded-lg border border-line bg-slate-50 p-3">
            {tags.map((tag) => (
              <label key={tag.id} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                <input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={(event) => onToggleTag(tag.id, event.target.checked)} />
                <span style={{ color: tag.color }}>{tag.name}</span>
              </label>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="排序">
            <Input type="number" value={form.sortOrder} onChange={(event) => onUpdate({ ...form, sortOrder: Number(event.target.value) })} />
          </Field>
          <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isFeatured} onChange={(event) => onUpdate({ ...form, isFeatured: event.target.checked })} />
            热门推荐
          </label>
          <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => onUpdate({ ...form, isActive: event.target.checked })} />
            启用展示
          </label>
        </div>
        {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={submitting} onClick={onCancel}>
            取消
          </Button>
          <Button disabled={submitting}>{submitting ? "处理中..." : editingId ? "保存链接" : "新增链接"}</Button>
        </div>
      </div>
    </form>
  );
}

function MultiFilter({
  emptyLabel,
  label,
  onChange,
  onOpenChange,
  open,
  options,
  value,
}: {
  emptyLabel: string;
  label: string;
  onChange: (value: string[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  options: Array<{ label: string; value: string }>;
  value: string[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOptions = options.filter((option) => value.includes(option.value));
  const summary =
    selectedOptions.length === 0
      ? emptyLabel
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions[0].label} +${selectedOptions.length - 1}`;

  function toggle(optionValue: string, checked: boolean) {
    if (checked) {
      onChange(Array.from(new Set([...value, optionValue])));
      return;
    }
    onChange(value.filter((item) => item !== optionValue));
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 text-left text-sm text-slate-900 outline-none transition hover:bg-slate-50 focus:border-blue-400 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]"
        type="button"
        onClick={() => onOpenChange(!open)}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className="size-4 shrink-0 text-slate-400" />
      </button>
      {open ? (
        <div className="absolute left-0 top-11 z-30 w-full min-w-56 rounded-lg border border-line bg-white p-2 shadow-xl shadow-slate-950/10" role="group" aria-label={label}>
          <div className="mb-1 flex items-center justify-between px-2 py-1 text-xs text-slate-500">
            <span>{label}</span>
            {value.length > 0 ? (
              <button className="text-primary hover:text-blue-700" type="button" onClick={() => onChange([])}>
                清空
              </button>
            ) : null}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => {
              const checked = value.includes(option.value);
              return (
                <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <input checked={checked} type="checkbox" onChange={(event) => toggle(option.value, event.target.checked)} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {checked ? <Check className="size-4 text-primary" /> : null}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
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
