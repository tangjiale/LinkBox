"use client";

import { useState } from "react";
import type { Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getFetchErrorMessage, parseApiResponse } from "@/lib/api/client";

const emptyForm = {
  name: "",
  color: "#2563eb",
};

export function TagManager({ tags }: { tags: Tag[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function edit(tag: Tag) {
    setEditingId(tag.id);
    setForm({ name: tag.name, color: tag.color });
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
      const response = await fetch(editingId ? `/api/tags/${editingId}` : "/api/tags", {
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

  async function remove(tag: Tag) {
    if (!window.confirm(`确认删除标签「${tag.name}」吗？关联链接会自动解除该标签。`)) return;
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
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

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">标签管理</h1>
        <p className="mt-1 text-sm text-slate-500">标签用于补充网站属性，一个链接可以关联多个标签。</p>
        <form className="mt-6 space-y-4 rounded-xl border border-line bg-white p-5 shadow-sm" onSubmit={submit}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">标签名称</label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">颜色</label>
            <Input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} />
          </div>
          {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p> : null}
          <div className="flex gap-2">
            <Button disabled={submitting}>{submitting ? "处理中..." : editingId ? "保存标签" : "新增标签"}</Button>
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
          <h2 className="font-semibold text-slate-950">标签列表</h2>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => (
            <div key={tag.id} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <Badge style={{ background: `${tag.color}12`, color: tag.color, borderColor: `${tag.color}33` }}>{tag.name}</Badge>
                <span className="text-xs text-slate-400">{tag.slug}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" disabled={submitting} onClick={() => edit(tag)}>
                  编辑
                </Button>
                <Button size="sm" variant="danger" disabled={submitting} onClick={() => remove(tag)}>
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
