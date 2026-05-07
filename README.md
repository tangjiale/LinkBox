# 链接盒子 LinkBox

链接盒子是一个现代化的链接管理与 Web 导航网站。它提供一个公开展示页，用来快速搜索、筛选和访问常用网站；同时提供一个登录保护的管理后台，用来维护分类、链接和标签。

项目当前基于 **Next.js + React + TypeScript + Tailwind CSS + Postgres** 实现，适合作为个人导航、团队内部资源入口、工具集合页或轻量知识库入口。


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
  - 数据设置：展示 Postgres 连接说明和生产环境提醒

- **数据与安全**
  - Postgres 云数据库持久化，适合部署到 Vercel
  - 后台 API 登录保护
  - 生产环境强制配置 `LINKBOX_SESSION_SECRET`
  - 生产环境初始化管理员时强制配置 `LINKBOX_ADMIN_PASSWORD`
  - 链接支持多标签关联
  - API 对非法 JSON、不存在资源、无效标签等返回稳定错误


## 技术栈

- **框架**：Next.js 16 App Router
- **前端**：React 19、TypeScript
- **样式**：Tailwind CSS 4
- **图标**：lucide-react
- **数据库**：Postgres，推荐 Vercel Marketplace Neon
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

### 2. 配置数据库

项目需要配置 Postgres 连接字符串：

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST/DB?sslmode=require
```

如果使用 Vercel Marketplace 的 Neon 集成，Vercel 会自动注入 `DATABASE_URL`。本地开发可以从 Vercel 拉取环境变量，或手动写入 `.env.local`。

### 3. 初始化数据库

```bash
npm run db:seed
```

这个命令会在 Postgres 中创建表，并写入默认分类、标签、示例链接和本地开发管理员账号。

### 4. 启动开发服务

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

正式环境请务必通过环境变量配置自己的管理员账号和密码。

### 5. Vercel + Neon 快速配置

1. 在 Vercel 项目的 Marketplace 中添加 Neon。
2. 创建或关联 Neon Postgres 数据库。
3. 确认 Vercel 项目环境变量中存在 `DATABASE_URL`。
4. 额外配置 `LINKBOX_SESSION_SECRET`、`LINKBOX_ADMIN_USER`、`LINKBOX_ADMIN_PASSWORD`。
5. 部署后执行一次初始化：

```bash
npm run db:seed
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

本地开发和生产环境都必须配置数据库连接：

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST/DB?sslmode=require
```

生产环境还必须配置以下变量：

```bash
LINKBOX_SESSION_SECRET=一段足够长的随机字符串
LINKBOX_ADMIN_USER=你的管理员账号
LINKBOX_ADMIN_PASSWORD=你的管理员密码
```

### 生成 Session Secret

建议使用 32 字节以上随机值：

```bash
openssl rand -base64 48
```

### 生产环境安全规则

- `NODE_ENV=production` 时，如果没有配置 `LINKBOX_SESSION_SECRET`，Session 签名会直接报错。
- `NODE_ENV=production` 且数据库为空时，如果没有配置 `LINKBOX_ADMIN_PASSWORD`，管理员初始化会直接报错。
- 如果没有配置 `DATABASE_URL`，数据库初始化和页面读取会直接报错。
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
│       ├── db                  Postgres 连接、Schema、查询与写入
│       ├── validators          zod 校验
│       └── utils               通用工具
├── tests
│   └── linkbox.test.ts          基础单元测试
├── package.json
└── README.md
```


## 部署到 Vercel

当前版本已去掉 SQLite，使用 Postgres 作为唯一持久化数据库。推荐通过 Vercel Marketplace 安装 Neon。

Vercel 生产环境建议配置：

```bash
DATABASE_URL=Neon 自动注入或手动配置的 Postgres 连接字符串
LINKBOX_SESSION_SECRET=一段足够长的随机字符串
LINKBOX_ADMIN_USER=admin
LINKBOX_ADMIN_PASSWORD=你的强密码
```

构建并启动：

```bash
npm install
npm run db:seed
npm run build
npm run start
```

如果通过 Vercel Dashboard 部署，通常不需要手动运行 `npm run start`。首次部署后需要确保数据库已经初始化；可以在本地连接同一个 `DATABASE_URL` 执行 `npm run db:seed`，或通过 Vercel 的部署/运维命令执行初始化脚本。


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

- 支持链接访问统计
- 支持导入/导出 JSON 或 CSV
- 支持拖拽排序
- 支持 favicon 自动抓取
- 支持多管理员或角色权限
- 支持公开投稿和审核流程
