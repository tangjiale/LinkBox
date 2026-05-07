<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LinkBox 项目 Agent 工作规范

本文件适用于当前目录及其所有子目录。修改本项目代码时，必须优先遵守这里的项目级约定。


## 项目定位

LinkBox（链接盒子）是一个链接管理与 Web 导航网站，包含：

- 公开展示页：面向普通访客展示分类、标签、热门链接和搜索结果。
- 管理后台：面向管理员维护分类、链接、标签、推荐状态、启停状态和排序。
- 数据持久化：使用 Postgres 保存分类、链接、标签、管理员和多标签关联数据。


## 技术栈

- 框架：Next.js 16 App Router。
- 语言：TypeScript。
- 前端：React 19。
- 样式：Tailwind CSS 4。
- UI 基础组件：项目内 `src/components/ui/*`，部分弹窗使用 Radix UI。
- 图标：`lucide-react`。
- 数据库：Postgres。
- ORM：Drizzle ORM，schema 位于 `src/lib/db/schema.ts`。
- 数据校验：Zod，校验器位于 `src/lib/validators/linkbox.ts`。
- 认证：自定义 Cookie Session + `bcryptjs`。
- 测试：Vitest。
- 代码检查：ESLint。
- 部署目标：Vercel，数据库推荐 Neon Postgres。


## Next.js 16 开发要求

- 这个项目使用 Next.js 16，不要按旧版本 Next.js 经验直接改 API 或目录约定。
- 写页面、布局、Route Handler、Server Component、Client Component 相关代码前，先阅读 `node_modules/next/dist/docs/` 里对应文档。
- 默认页面和布局是 Server Component；只有需要状态、事件、浏览器 API、弹窗交互等场景才使用 `"use client"`。
- 服务端读取数据库、鉴权、环境变量等逻辑必须留在 Server Component、Route Handler 或 `src/lib/*` 服务端模块中，不要暴露到客户端组件。


## 目录职责

- `src/app`：App Router 页面、布局和 API Route Handlers。
- `src/components/public`：公开展示页组件。
- `src/components/admin`：管理后台组件。
- `src/components/ui`：可复用基础 UI 组件。
- `src/lib/db`：数据库连接、schema、查询与初始化逻辑。
- `src/lib/auth`：登录态、Session、后台权限校验。
- `src/lib/validators`：Zod 输入校验。
- `src/lib/api`：请求解析与客户端 API 辅助函数。
- `src/lib/utils`：通用工具函数。
- `tests`：Vitest 测试。
- `scripts`：维护脚本，例如数据库初始化。


## 代码规范

- 保持 TypeScript 类型明确，避免 `any`。确实需要时必须说明原因，并尽量收敛作用域。
- 表单、API 入参和数据库写入必须经过 Zod 校验或等价的结构化校验。
- 不要绕过 `src/lib/db/queries.ts` 直接在组件里操作数据库。
- 数据库 schema 变更必须同步检查：
  - `src/lib/db/schema.ts`
  - `src/lib/db/connection.ts`
  - `src/lib/db/queries.ts`
  - `src/lib/types.ts`
  - `src/lib/validators/linkbox.ts`
  - README 或相关配置说明
- 公开页只展示启用数据；后台可以查看和维护启停状态。
- 管理后台写接口必须经过 `requireAdminApi()`；后台页面必须经过 `requireAdminPage()`。
- 客户端请求统一使用 `parseApiResponse`、`getFetchErrorMessage` 等既有辅助函数处理错误。
- 命名要贴近业务含义，例如 `categoryFilter`、`tagFilter`、`isFeatured`、`isActive`，不要使用含糊缩写。
- 注释只写关键流程、边界条件或不直观的业务规则；不要写重复代码含义的空注释。
- 修改代码时删除无用代码，不保留已经废弃的兼容分支。
- 默认使用 ASCII 标点和英文半角符号；面向用户展示的中文文案可以使用中文标点。


## 前端与 UI 规范

- 优先复用 `src/components/ui` 中已有的 `Button`、`Input`、`Select`、`Textarea`、`Badge`。
- 图标优先使用 `lucide-react`，不要手写 SVG，除非没有合适图标或确有必要。
- 管理后台界面要偏工具型：信息密度清晰、控件稳定、方便重复操作，不要做营销式大 Hero。
- 新增表格列或按钮后，必须检查横向宽度、移动端或窄屏布局，避免文字重叠和点击区域被覆盖。
- 表格内容较长时使用 `truncate`、`line-clamp`、`max-w-*` 或横向滚动处理，不能让布局被长文本撑坏。
- 弹窗、新增/编辑表单等交互状态必须处理：
  - 提交中禁用按钮
  - API 错误提示
  - 取消或关闭时恢复表单状态
- 批量操作和筛选条件联动时，筛选变化后应清空已选项并回到第一页，避免误操作。


## 数据库与环境变量规范

- 项目使用 Postgres，不再使用 SQLite。
- 数据库连接通过 `DATABASE_URL` 配置。
- 本地开发环境变量优先写在 `.env.local`，不要提交真实密码、Token 或生产数据库连接。
- 生产环境必须配置：
  - `DATABASE_URL`
  - `LINKBOX_SESSION_SECRET`
  - `LINKBOX_ADMIN_USER`
  - `LINKBOX_ADMIN_PASSWORD`
- `NODE_ENV=production` 下不能依赖默认管理员密码。
- 涉及数据删除、批量更新、schema 变更或生产数据库操作前，必须明确说明风险并取得用户确认。


## API 规范

- Route Handler 位于 `src/app/api/**/route.ts`。
- 写接口必须：
  - 调用 `requireAdminApi()`
  - 使用 `readJson()` 读取 JSON
  - 使用 Zod schema 校验数据
  - 使用 `toErrorResponse()` 或稳定 JSON 错误格式返回异常
- API 返回应保持简单稳定，例如 `{ ok: true }`、`{ error: "..." }`、`{ links: [...] }`。
- PATCH 全量更新资源时，调用方必须携带该资源现有字段，避免只传部分字段导致校验失败或数据丢失。


## 开发流程

1. 先理解需求和现有代码。
   - 优先查看相关页面、组件、API、数据库查询和类型定义。
   - 不要在不了解现有模式时直接引入新库或新架构。

2. 制定小范围实现方案。
   - 保持改动聚焦，避免顺手重构无关模块。
   - 如果需求影响前后端链路，要同时检查 UI、API、校验、数据库和测试。

3. 实施代码修改。
   - 手动编辑优先使用 `apply_patch`。
   - 不要覆盖用户未提交的无关改动。
   - 不要执行 `git reset --hard`、`git checkout --` 等破坏性命令，除非用户明确要求。

4. 自测和修复。
   - 每完成一项任务，都必须运行必要测试。
   - 如果修改 UI，需要尽量用浏览器实际打开页面验证关键交互。
   - 如果修改 API 或数据逻辑，需要覆盖成功和失败路径。

5. 汇总结果。
   - 说明改了哪些文件、实现了什么行为。
   - 明确列出已运行的验证命令。
   - 如果某项测试没有运行，必须说明原因和风险。


## 必跑验证

完成代码任务后，默认至少运行：

```bash
npm run lint
npm test
npm run build
```

如果任务只改文档，可以不跑完整构建，但至少检查文档内容是否准确、无明显格式错误。

如果任务涉及页面交互，除上述命令外，还应使用浏览器验证主要流程，例如：

- 公开页加载和搜索筛选。
- 后台登录后进入管理页面。
- 分类、链接、标签的新增、编辑、删除。
- 分页、批量选择、筛选、启停、热门推荐等交互。


## Git 与提交规范

- 提交前先查看 `git status --short`，确认只包含本次任务相关文件。
- 不要提交 `.env.local`、真实密钥、Token、数据库密码或本地临时文件。
- `.playwright-mcp/` 属于浏览器测试临时目录，应保持忽略。
- 提交信息使用简洁中文或英文，描述业务改动，例如：
  - `完善链接管理筛选`
  - `Add link status toggle`
- 如果用户要求推送 GitHub，再执行 add、commit、push；不要擅自推送。


## 危险操作确认

以下操作必须先向用户确认：

- 删除文件或目录。
- 批量修改数据。
- 数据库 schema 变更、清表、删表、生产数据迁移。
- 修改生产环境变量、部署 Token、GitHub Secret、Vercel Secret。
- 调用生产环境 API 或连接生产数据库执行写操作。
- 升级 Next.js、React、Drizzle、Tailwind 等核心依赖。

确认时需要说明：

- 操作类型
- 影响范围
- 潜在风险
- 是否可以继续
