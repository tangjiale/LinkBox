import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { hashSync } from "bcryptjs";
import * as schema from "./schema";
import { createSlug } from "@/lib/utils/slug";

const dataDir = path.join(process.cwd(), "data");
const dbPath = process.env.LINKBOX_DB_PATH ?? path.join(dataDir, "linkbox.sqlite");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

let initialized = false;

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function ensureSlug(base: string, table: "categories" | "tags") {
  const slug = createSlug(base);
  const exists = sqlite.prepare(`select id from ${table} where slug = ?`).get(slug);
  return exists ? `${slug}-${id().slice(0, 6)}` : slug;
}

function insertCategory(name: string, description: string, sortOrder: number) {
  const timestamp = now();
  sqlite
    .prepare(
      "insert into categories (id, name, slug, description, sort_order, is_active, created_at, updated_at) values (?, ?, ?, ?, ?, 1, ?, ?)",
    )
    .run(id(), name, ensureSlug(name, "categories"), description, sortOrder, timestamp, timestamp);
}

function insertTag(name: string, color: string) {
  const timestamp = now();
  sqlite
    .prepare("insert into tags (id, name, slug, color, created_at, updated_at) values (?, ?, ?, ?, ?, ?)")
    .run(id(), name, ensureSlug(name, "tags"), color, timestamp, timestamp);
}

function seedDefaults() {
  const adminCount = sqlite.prepare("select count(*) as count from admin_users").get() as { count: number };
  if (adminCount.count === 0) {
    const timestamp = now();
    const username = process.env.LINKBOX_ADMIN_USER ?? "admin";
    const password = process.env.LINKBOX_ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? "" : "admin123456");
    if (!password) {
      throw new Error("生产环境初始化管理员前必须设置 LINKBOX_ADMIN_PASSWORD。");
    }
    sqlite
      .prepare("insert into admin_users (id, username, password_hash, created_at, updated_at) values (?, ?, ?, ?, ?)")
      .run(id(), username, hashSync(password, 10), timestamp, timestamp);
  }

  const categoryCount = sqlite.prepare("select count(*) as count from categories").get() as { count: number };
  if (categoryCount.count === 0) {
    [
      ["AI工具", "聚合对话、绘图、搜索与效率类 AI 应用", 10],
      ["开发资源", "开发者常用文档、框架、工具和部署平台", 20],
      ["设计灵感", "设计素材、配色、图标与作品灵感", 30],
      ["效率工具", "提升个人和团队工作效率的在线工具", 40],
      ["学习资料", "课程、教程、知识库与技术文章", 50],
      ["常用网站", "高频访问的网站和内部入口", 60],
    ].forEach(([name, description, order]) => insertCategory(String(name), String(description), Number(order)));
  }

  const tagCount = sqlite.prepare("select count(*) as count from tags").get() as { count: number };
  if (tagCount.count === 0) {
    [
      ["推荐", "#2563eb"],
      ["免费", "#10b981"],
      ["开发", "#0f766e"],
      ["设计", "#f59e0b"],
      ["学习", "#7c3aed"],
      ["效率", "#ef4444"],
    ].forEach(([name, color]) => insertTag(name, color));
  }

  const linkCount = sqlite.prepare("select count(*) as count from links").get() as { count: number };
  if (linkCount.count > 0) return;

  const categories = sqlite.prepare("select id, name from categories").all() as Array<{ id: string; name: string }>;
  const tags = sqlite.prepare("select id, name from tags").all() as Array<{ id: string; name: string }>;
  const categoryId = (name: string) => categories.find((item) => item.name === name)?.id ?? categories[0].id;
  const tagId = (name: string) => tags.find((item) => item.name === name)?.id;

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
  const insertLink = sqlite.prepare(
    "insert into links (id, title, url, description, icon_url, category_id, is_featured, is_active, sort_order, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)",
  );
  const insertLinkTag = sqlite.prepare("insert into link_tags (link_id, tag_id) values (?, ?)");

  samples.forEach(([title, url, description, category, tagNames, featured], index) => {
    const linkId = id();
    insertLink.run(linkId, title, url, description, null, categoryId(category), featured ? 1 : 0, index + 1, timestamp, timestamp);
    tagNames.forEach((name) => {
      const currentTagId = tagId(name);
      if (currentTagId) insertLinkTag.run(linkId, currentTagId);
    });
  });
}

export function ensureDatabase() {
  if (initialized) return;

  sqlite.exec(`
    create table if not exists categories (
      id text primary key,
      name text not null,
      slug text not null unique,
      description text,
      sort_order integer not null default 0,
      is_active integer not null default 1,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists links (
      id text primary key,
      title text not null,
      url text not null,
      description text,
      icon_url text,
      category_id text not null references categories(id),
      is_featured integer not null default 0,
      is_active integer not null default 1,
      sort_order integer not null default 0,
      created_at text not null,
      updated_at text not null
    );

    create table if not exists tags (
      id text primary key,
      name text not null,
      slug text not null unique,
      color text not null default '#2563eb',
      created_at text not null,
      updated_at text not null
    );

    create table if not exists link_tags (
      link_id text not null references links(id) on delete cascade,
      tag_id text not null references tags(id) on delete cascade,
      primary key (link_id, tag_id)
    );

    create table if not exists admin_users (
      id text primary key,
      username text not null unique,
      password_hash text not null,
      created_at text not null,
      updated_at text not null
    );

    create index if not exists idx_links_category_id on links(category_id);
    create index if not exists idx_links_active_featured on links(is_active, is_featured);
    create index if not exists idx_link_tags_link_id on link_tags(link_id);
    create index if not exists idx_link_tags_tag_id on link_tags(tag_id);
  `);

  seedDefaults();
  initialized = true;
}

export function getSqlite() {
  ensureDatabase();
  return sqlite;
}
