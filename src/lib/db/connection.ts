import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import postgres from "postgres";
import * as schema from "./schema";
import { adminUsers, categories, linkTags, links, tags } from "./schema";
import { createSlug } from "@/lib/utils/slug";

type DbClient = ReturnType<typeof drizzle<typeof schema>>;
type SqlClient = ReturnType<typeof postgres>;

let dbClient: DbClient | null = null;
let rawClient: SqlClient | null = null;
let initialized = false;

export function db() {
  if (!dbClient) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("缺少 DATABASE_URL。请在 Vercel Neon 集成或 .env.local 中配置 Postgres 连接字符串。");
    }
    rawClient = postgres(databaseUrl, {
      max: 1,
      onnotice: () => undefined,
      prepare: false,
    });
    dbClient = drizzle(rawClient, { schema });
  }
  return dbClient;
}

export async function closeDatabase() {
  if (!rawClient) return;

  await rawClient.end({ timeout: 5 });
  rawClient = null;
  dbClient = null;
  initialized = false;
}

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

async function ensureSlug(base: string, table: "categories" | "tags") {
  const slug = createSlug(base);
  const rows =
    table === "categories"
      ? await db().select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1)
      : await db().select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
  return rows.length > 0 ? `${slug}-${id().slice(0, 8)}` : slug;
}

async function insertCategory(name: string, description: string, sortOrder: number) {
  const timestamp = now();
  await db().insert(categories).values({
    id: id(),
    name,
    slug: await ensureSlug(name, "categories"),
    description,
    sortOrder,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

async function insertTag(name: string, color: string) {
  const timestamp = now();
  await db().insert(tags).values({
    id: id(),
    name,
    slug: await ensureSlug(name, "tags"),
    color,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function ensureDatabase() {
  if (initialized) return;

  await db().execute(sql`
    create table if not exists categories (
      id text primary key,
      name text not null,
      slug text not null unique,
      description text,
      sort_order integer not null default 0,
      is_active boolean not null default true,
      created_at text not null,
      updated_at text not null
    )
  `);

  await db().execute(sql`
    create table if not exists links (
      id text primary key,
      title text not null,
      url text not null,
      description text,
      icon_url text,
      category_id text not null references categories(id),
      is_featured boolean not null default false,
      is_active boolean not null default true,
      sort_order integer not null default 0,
      created_at text not null,
      updated_at text not null
    )
  `);

  await db().execute(sql`
    create table if not exists tags (
      id text primary key,
      name text not null,
      slug text not null unique,
      color text not null default '#2563eb',
      created_at text not null,
      updated_at text not null
    )
  `);

  await db().execute(sql`
    create table if not exists link_tags (
      link_id text not null references links(id) on delete cascade,
      tag_id text not null references tags(id) on delete cascade,
      primary key (link_id, tag_id)
    )
  `);

  await db().execute(sql`
    create table if not exists admin_users (
      id text primary key,
      username text not null unique,
      password_hash text not null,
      created_at text not null,
      updated_at text not null
    )
  `);

  await db().execute(sql`create index if not exists idx_links_category_id on links(category_id)`);
  await db().execute(sql`create index if not exists idx_links_active_featured on links(is_active, is_featured)`);
  await db().execute(sql`create index if not exists idx_link_tags_link_id on link_tags(link_id)`);
  await db().execute(sql`create index if not exists idx_link_tags_tag_id on link_tags(tag_id)`);

  await seedDefaults();
  initialized = true;
}

async function seedDefaults() {
  const [{ count: adminCount }] = await db().select({ count: sql<string>`count(*)::text` }).from(adminUsers);
  if (Number(adminCount) === 0) {
    const timestamp = now();
    const username = process.env.LINKBOX_ADMIN_USER ?? "admin";
    const password = process.env.LINKBOX_ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? "" : "admin123456");
    if (!password) {
      throw new Error("生产环境初始化管理员前必须设置 LINKBOX_ADMIN_PASSWORD。");
    }
    await db().insert(adminUsers).values({ id: id(), username, passwordHash: hashSync(password, 10), createdAt: timestamp, updatedAt: timestamp });
  }

  const [{ count: categoryCount }] = await db().select({ count: sql<string>`count(*)::text` }).from(categories);
  if (Number(categoryCount) === 0) {
    for (const [name, description, order] of [
      ["AI工具", "聚合对话、绘图、搜索与效率类 AI 应用", 10],
      ["开发资源", "开发者常用文档、框架、工具和部署平台", 20],
      ["设计灵感", "设计素材、配色、图标与作品灵感", 30],
      ["效率工具", "提升个人和团队工作效率的在线工具", 40],
      ["学习资料", "课程、教程、知识库与技术文章", 50],
      ["常用网站", "高频访问的网站和内部入口", 60],
    ] as const) {
      await insertCategory(name, description, order);
    }
  }

  const [{ count: tagCount }] = await db().select({ count: sql<string>`count(*)::text` }).from(tags);
  if (Number(tagCount) === 0) {
    for (const [name, color] of [
      ["推荐", "#2563eb"],
      ["免费", "#10b981"],
      ["开发", "#0f766e"],
      ["设计", "#f59e0b"],
      ["学习", "#7c3aed"],
      ["效率", "#ef4444"],
    ] as const) {
      await insertTag(name, color);
    }
  }

  const [{ count: linkCount }] = await db().select({ count: sql<string>`count(*)::text` }).from(links);
  if (Number(linkCount) > 0) return;

  const categoryRows = await db().select({ id: categories.id, name: categories.name }).from(categories);
  const tagRows = await db().select({ id: tags.id, name: tags.name }).from(tags);
  const categoryId = (name: string) => categoryRows.find((item) => item.name === name)?.id ?? categoryRows[0].id;
  const tagId = (name: string) => tagRows.find((item) => item.name === name)?.id;

  const samples = [
    ["ChatGPT", "https://chat.openai.com", "通用 AI 对话与内容创作助手", "AI工具", ["推荐", "效率"], true],
    ["Perplexity", "https://www.perplexity.ai", "带引用来源的 AI 搜索与研究工具", "AI工具", ["推荐", "学习"], true],
    ["v0", "https://v0.dev", "面向前端界面的 AI 生成工具", "AI工具", ["开发", "设计"], false],
    ["Next.js", "https://nextjs.org", "React 全栈应用框架与官方文档", "开发资源", ["开发", "推荐"], true],
    ["React", "https://react.dev", "React 官方文档与现代组件开发指南", "开发资源", ["开发", "学习"], false],
    ["Tailwind CSS", "https://tailwindcss.com", "实用优先的 CSS 框架", "开发资源", ["开发", "设计"], false],
    ["Figma", "https://www.figma.com", "协作式 UI 设计与原型工具", "设计灵感", ["设计", "推荐"], true],
    ["Lucide", "https://lucide.dev", "简洁一致的开源图标库", "设计灵感", ["设计", "免费"], false],
    ["Notion", "https://www.notion.so", "知识库、文档与项目协作空间", "效率工具", ["效率"], true],
    ["飞书", "https://www.feishu.cn", "团队协作、文档与流程管理平台", "效率工具", ["效率"], false],
    ["MDN", "https://developer.mozilla.org", "Web 技术权威参考文档", "学习资料", ["学习", "开发"], true],
    ["GitHub", "https://github.com", "代码托管、协作开发与开源社区", "常用网站", ["开发", "推荐"], true],
  ] as const;

  const timestamp = now();
  for (const [title, url, description, category, tagNames, featured] of samples) {
    const linkId = id();
    await db().insert(links).values({
      id: linkId,
      title,
      url,
      description,
      iconUrl: null,
      categoryId: categoryId(category),
      isFeatured: featured,
      isActive: true,
      sortOrder: samples.findIndex((sample) => sample[0] === title) + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    for (const name of tagNames) {
      const currentTagId = tagId(name);
      if (currentTagId) {
        await db().insert(linkTags).values({ linkId, tagId: currentTagId });
      }
    }
  }
}
