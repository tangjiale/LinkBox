"use client";

import { useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteMark } from "@/components/public/site-mark";

export function LoginPanel() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hint =
    process.env.NODE_ENV === "production"
      ? "请输入部署时配置的管理员账号和密码。"
      : "默认账号为 admin，初始密码为 admin123456。";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "登录失败");
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <main className="linkbox-shell grid min-h-screen place-items-center px-4">
      <section className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-xl shadow-slate-950/5">
        <SiteMark />
        <div className="mt-8">
          <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-primary">
            <LockKeyhole className="size-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">登录管理后台</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">维护分类、链接和标签。{hint}</p>
        </div>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">账号</span>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">密码</span>
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="请输入密码"
            />
          </label>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button className="w-full" disabled={loading}>
            {loading ? "登录中..." : "进入后台"}
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </section>
    </main>
  );
}
