"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getFetchErrorMessage, parseApiResponse } from "@/lib/api/client";

const emptyForm = {
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function edit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description: category.description ?? "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(editingId ? `/api/categories/${editingId}` : "/api/categories", {
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

  async function remove(category: Category) {
    if (!window.confirm(`确认删除分类「${category.name}」吗？`)) return;
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
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

  async function toggleCategoryStatus(category: Category) {
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: category.name,
          description: category.description ?? "",
          sortOrder: category.sortOrder,
          isActive: !category.isActive,
        }),
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
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">分类管理</h1>
        <p className="mt-1 text-sm text-slate-500">分类用于公开页的主要筛选和信息分组。</p>
        <form className="mt-6 space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm" onSubmit={submit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">分类名称</label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">描述</label>
            <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">排序</label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
            展示在公开页
          </label>
          {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
          <div className="flex gap-2">
            <Button disabled={submitting}>{submitting ? "处理中..." : editingId ? "保存分类" : "新增分类"}</Button>
            {editingId ? (
              <Button type="button" variant="secondary" disabled={submitting} onClick={reset}>
                取消
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-semibold text-slate-950">分类列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">名称</th>
                <th className="px-5 py-3">描述</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-5 py-4 font-medium text-slate-900">{category.name}</td>
                  <td className="px-5 py-4 text-slate-500">{category.description}</td>
                  <td className="px-5 py-4 text-slate-500">{category.sortOrder}</td>
                  <td className="px-5 py-4">
                    <Badge className={category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                      {category.isActive ? "启用" : "停用"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant={category.isActive ? "secondary" : "primary"} disabled={submitting} onClick={() => toggleCategoryStatus(category)}>
                        {category.isActive ? "停用" : "启用"}
                      </Button>
                      <Button size="sm" variant="secondary" disabled={submitting} onClick={() => edit(category)}>
                        编辑
                      </Button>
                      <Button size="sm" variant="danger" disabled={submitting} onClick={() => remove(category)}>
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
