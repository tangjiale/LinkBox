# 链接盒子 LinkBox

链接盒子是一个现代化的链接管理与 Web 导航网站。它提供一个公开展示页，用来快速搜索、筛选和访问常用网站；同时提供一个登录保护的管理后台，用来维护分类、链接和标签。

项目当前基于 **Next.js + React + TypeScript + Tailwind CSS + SQLite** 实现，适合作为个人导航、团队内部资源入口、工具集合页或轻量知识库入口。


## 功能概览

- **公开展示页**
  - 顶部导航：`首页 / 分类 / 热门 / 最近收录 / 管理入口`
  - 左侧分类栏：按分类快速筛选链接
  - 搜索框：支持按网站名称、描述、URL、分类、标签搜索
  - 精选分类：展示分类入口和站点数量
  - 热门链接：以卡片形式展示推荐链接
  - 最近收录：以表格形式展示近期新增链接
  - 响应式布局：桌面端和移动端均可使用

- **管理后台**
  - 简单管理员登录
  - 概览统计
  - 分类管理：新增、编辑、删除、排序、启停
  - 链接管理：新增、编辑、删除、分类关联、多标签关联、热门推荐、启停
  - 标签管理：新增、编辑、删除、颜色配置
  - 数据设置：展示 SQLite 存储说明和生产环境提醒

- **数据与安全**
  - 本地 SQLite 持久化
  - 后台 API 登录保护
  - 生产环境强制配置 `LINKBOX_SESSION_SECRET`
  - 生产环境初始化管理员时强制配置 `LINKBOX_ADMIN_PASSWORD`
  - 链接写入使用事务，避免标签关联半写入
  - API 对非法 JSON、不存在资源、无效标签等返回稳定错误


## 技术栈

- **框架**：Next.js 16 App Router
- **前端**：React 19、TypeScript
- **样式**：Tailwind CSS 4
- **图标**：lucide-react
- **数据库**：SQLite，本地使用 `better-sqlite3`
- **ORM / Schema**：Drizzle ORM
- **校验**：zod
- **认证**：自定义 Cookie Session + bcryptjs
- **测试**：Vitest
- **代码检查**：ESLint


## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run db:seed
```

这个命令会创建本地 SQLite 数据库，并写入默认分类、标签、示例链接和本地开发管理员账号。

默认数据库位置：

```text
data/linkbox.sqlite
```

数据库文件已在 `.gitignore` 中忽略，不会被提交到 Git。

### 3. 启动开发服务

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

管理后台：

```text
http://localhost:3000/admin
```

本地开发默认账号：

```text
账号：admin
密码：admin123456
```


## 常用命令

```bash
# 启动开发服务
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm run start

# ESLint 检查
npm run lint

# 运行测试
npm test

# 初始化或补齐默认数据
npm run db:seed
```


## 环境变量

本地开发可以不配置环境变量，项目会使用开发默认值。

生产环境必须配置以下变量：

```bash
LINKBOX_SESSION_SECRET=一段足够长的随机字符串
LINKBOX_ADMIN_USER=你的管理员账号
LINKBOX_ADMIN_PASSWORD=你的管理员密码
```

可选变量：

```bash
LINKBOX_DB_PATH=/absolute/path/to/linkbox.sqlite
```

### 生成 Session Secret

建议使用 32 字节以上随机值：

```bash
openssl rand -base64 48
```

### 生产环境安全规则

- `NODE_ENV=production` 时，如果没有配置 `LINKBOX_SESSION_SECRET`，Session 签名会直接报错。
- `NODE_ENV=production` 且数据库为空时，如果没有配置 `LINKBOX_ADMIN_PASSWORD`，管理员初始化会直接报错。
- 本地默认密码 `admin123456` 只用于开发环境。


## 路由说明

### 页面路由

```text
/                  公开展示页
/login             管理员登录页
/admin             后台概览
/admin/categories  分类管理
/admin/links       链接管理
/admin/tags        标签管理
/admin/settings    数据设置
```

### API 路由

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/categories
POST   /api/categories
PATCH  /api/categories/[id]
DELETE /api/categories/[id]

GET    /api/links
POST   /api/links
PATCH  /api/links/[id]
DELETE /api/links/[id]

GET    /api/tags
POST   /api/tags
PATCH  /api/tags/[id]
DELETE /api/tags/[id]
```

说明：

- 分类、链接、标签 API 都需要登录后访问。
- 公开展示页直接由服务端读取启用状态的数据。
- 写接口统一使用 zod 校验请求数据。


## 数据模型

### 分类 categories

```text
id
name
slug
description
sortOrder
isActive
createdAt
updatedAt
```

### 链接 links

```text
id
title
url
description
iconUrl
categoryId
isFeatured
isActive
sortOrder
createdAt
updatedAt
```

### 标签 tags

```text
id
name
slug
color
createdAt
updatedAt
```

### 链接标签关系 link_tags

```text
linkId
tagId
```

### 管理员 admin_users

```text
id
username
passwordHash
createdAt
updatedAt
```


## 目录结构

```text
.
├── scripts
│   └── seed.ts                 数据库初始化脚本
├── src
│   ├── app
│   │   ├── page.tsx            公开展示页
│   │   ├── login               登录页
│   │   ├── admin               管理后台页面
│   │   └── api                 后台 API
│   ├── components
│   │   ├── public              展示页组件
│   │   ├── admin               后台组件
│   │   └── ui                  通用 UI 组件
│   └── lib
│       ├── auth                登录、Session、权限校验
│       ├── db                  SQLite 连接、Schema、查询与写入
│       ├── validators          zod 校验
│       └── utils               通用工具
├── tests
│   └── linkbox.test.ts          基础单元测试
├── package.json
└── README.md
```


## 部署到 Vercel 的注意事项

当前版本使用的是本地文件 SQLite：

```text
data/linkbox.sqlite
```

这种方式适合本机或传统服务器部署，但不适合作为 Vercel 上的生产可写数据库。Vercel 的运行环境不适合把项目目录里的 SQLite 文件当作长期持久化数据库使用。

如果要部署到 Vercel，推荐先做数据库适配：

### 推荐方案：Turso / libSQL

Turso 是 Serverless SQLite，最接近当前 SQLite 方案，适合部署到 Vercel。

需要新增环境变量：

```bash
TURSO_DATABASE_URL=你的 Turso 数据库地址
TURSO_AUTH_TOKEN=你的 Turso Token
```

同时需要把当前 `better-sqlite3` 文件数据库访问层改成 Turso/libSQL 驱动。

### 可选方案：Vercel Postgres / Neon

如果希望使用更通用的云数据库，可以改成 Postgres。

这需要调整数据库驱动、Schema 和查询层。

### 不推荐方案：直接在 Vercel 使用本地 SQLite 文件

不推荐直接用 `data/linkbox.sqlite` 部署到 Vercel 生产环境，因为后台新增、编辑、删除的数据无法作为可靠的长期数据保存。


## 传统服务器部署

如果部署到自有服务器、VPS、Docker 或 NAS，可以继续使用当前 SQLite 文件方案。

生产环境建议配置：

```bash
LINKBOX_SESSION_SECRET=一段足够长的随机字符串
LINKBOX_ADMIN_USER=admin
LINKBOX_ADMIN_PASSWORD=你的强密码
LINKBOX_DB_PATH=/data/linkbox.sqlite
```

构建并启动：

```bash
npm install
npm run db:seed
npm run build
npm run start
```


## 验证记录

当前版本已通过：

```bash
npm run lint
npm test
npm run build
```

浏览器验收覆盖：

- 公开展示页 `/`
- 登录页 `/login`
- 后台概览 `/admin`
- 链接管理 `/admin/links`
- 桌面端首页布局
- 移动端首页布局


## 后续可扩展方向

- 适配 Turso/libSQL，支持 Vercel 生产部署
- 支持链接访问统计
- 支持导入/导出 JSON 或 CSV
- 支持拖拽排序
- 支持暗色模式
- 支持 favicon 自动抓取
- 支持多管理员或角色权限
- 支持公开投稿和审核流程
