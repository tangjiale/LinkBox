import { Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">数据设置</h1>
        <p className="mt-1 text-sm text-slate-500">首版保留数据库状态和运行说明，导入导出后续再扩展。</p>
      </div>
      <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid size-11 place-items-center rounded-lg bg-blue-50 text-primary">
            <Database className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-950">Postgres 云数据库</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              当前版本使用 Postgres 持久化数据，部署到 Vercel 时推荐通过 Vercel Marketplace 连接 Neon。
              运行环境需要配置 <code className="rounded bg-slate-100 px-1.5 py-0.5">DATABASE_URL</code>。
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              默认管理员账号为 <code className="rounded bg-slate-100 px-1.5 py-0.5">admin</code>，初始密码为{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">admin123456</code>。正式使用前建议通过环境变量重新初始化密码。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
