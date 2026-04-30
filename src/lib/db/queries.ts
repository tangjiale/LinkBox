import { asc, desc, eq } from "drizzle-orm";
import { db, ensureDatabase, getSqlite } from "./connection";
import { adminUsers, categories, linkTags, links, tags } from "./schema";
import type { Category, LinkItem, PublicData, Tag } from "@/lib/types";
import type { CategoryInput, LinkInput, TagInput } from "@/lib/validators/linkbox";
import { createSlug } from "@/lib/utils/slug";
import { LinkBoxError } from "@/lib/utils/errors";

function timestamp() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function ensureUniqueSlug(base: string, table: "categories" | "tags", currentId?: string) {
  const sqlite = getSqlite();
  const slug = createSlug(base);
  const existing = sqlite.prepare(`select id from ${table} where slug = ?`).get(slug) as { id: string } | undefined;
  if (!existing || existing.id === currentId) return slug;
  return `${slug}-${id().slice(0, 6)}`;
}

function assertExists(table: "categories" | "links" | "tags", itemId: string, label: string) {
  const sqlite = getSqlite();
  const row = sqlite.prepare(`select id from ${table} where id = ?`).get(itemId);
  if (!row) throw new LinkBoxError(404, `${label}不存在或已被删除。`);
}

function assertCategoryUsable(categoryId: string) {
  const sqlite = getSqlite();
  const row = sqlite.prepare("select id from categories where id = ?").get(categoryId);
  if (!row) throw new LinkBoxError(400, "所选分类不存在。");
}

function normalizeTagIds(tagIds: string[]) {
  const uniqueIds = Array.from(new Set(tagIds));
  if (uniqueIds.length === 0) return uniqueIds;

  const sqlite = getSqlite();
  const placeholders = uniqueIds.map(() => "?").join(", ");
  const rows = sqlite.prepare(`select id from tags where id in (${placeholders})`).all(...uniqueIds) as Array<{ id: string }>;
  if (rows.length !== uniqueIds.length) {
    throw new LinkBoxError(400, "部分标签不存在，请刷新后重试。");
  }
  return uniqueIds;
}

function normalizeCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeTag(row: typeof tags.$inferSelect): Tag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getAdminByUsername(username: string) {
  ensureDatabase();
  return db.select().from(adminUsers).where(eq(adminUsers.username, username)).get();
}

export function listCategories(includeInactive = false): Category[] {
  ensureDatabase();
  const rows = db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)).all();
  return rows.filter((item) => includeInactive || item.isActive).map(normalizeCategory);
}

export function listTags(): Tag[] {
  ensureDatabase();
  return db.select().from(tags).orderBy(asc(tags.name)).all().map(normalizeTag);
}

export function listLinks(includeInactive = false): LinkItem[] {
  ensureDatabase();
  const categoryMap = new Map(listCategories(true).map((category) => [category.id, category]));
  const tagMap = new Map(listTags().map((tag) => [tag.id, tag]));
  const linkRows = db
    .select()
    .from(links)
    .orderBy(asc(links.sortOrder), desc(links.createdAt), asc(links.title))
    .all()
    .filter((item) => includeInactive || item.isActive);
  const linkTagRows = db.select().from(linkTags).all();

  return linkRows.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    iconUrl: row.iconUrl,
    categoryId: row.categoryId,
    category: categoryMap.get(row.categoryId) ?? null,
    tags: linkTagRows
      .filter((item) => item.linkId === row.id)
      .map((item) => tagMap.get(item.tagId))
      .filter((item): item is Tag => Boolean(item)),
    isFeatured: row.isFeatured,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export function getPublicData(): PublicData {
  return {
    categories: listCategories(false),
    tags: listTags(),
    links: listLinks(false),
  };
}

export function getAdminSummary() {
  const allLinks = listLinks(true);
  const allCategories = listCategories(true);
  const allTags = listTags();

  return {
    linksCount: allLinks.length,
    activeLinksCount: allLinks.filter((item) => item.isActive).length,
    featuredLinksCount: allLinks.filter((item) => item.isFeatured).length,
    categoriesCount: allCategories.length,
    tagsCount: allTags.length,
    recentLinks: allLinks.slice(0, 6),
  };
}

export function createCategory(input: CategoryInput) {
  ensureDatabase();
  const row = {
    id: id(),
    name: input.name,
    slug: ensureUniqueSlug(input.name, "categories"),
    description: input.description || null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
  db.insert(categories).values(row).run();
  return normalizeCategory(row);
}

export function updateCategory(categoryId: string, input: CategoryInput) {
  ensureDatabase();
  assertExists("categories", categoryId, "分类");
  const updatedAt = timestamp();
  db.update(categories)
    .set({
      name: input.name,
      slug: ensureUniqueSlug(input.name, "categories", categoryId),
      description: input.description || null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      updatedAt,
    })
    .where(eq(categories.id, categoryId))
    .run();
}

export function deleteCategory(categoryId: string) {
  ensureDatabase();
  assertExists("categories", categoryId, "分类");
  const related = db.select().from(links).where(eq(links.categoryId, categoryId)).all();
  if (related.length > 0) {
    throw new LinkBoxError(409, "该分类下仍有关联链接，请先调整或删除链接。");
  }
  db.delete(categories).where(eq(categories.id, categoryId)).run();
}

export function createTag(input: TagInput) {
  ensureDatabase();
  const row = {
    id: id(),
    name: input.name,
    slug: ensureUniqueSlug(input.name, "tags"),
    color: input.color,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
  db.insert(tags).values(row).run();
  return normalizeTag(row);
}

export function updateTag(tagId: string, input: TagInput) {
  ensureDatabase();
  assertExists("tags", tagId, "标签");
  db.update(tags)
    .set({
      name: input.name,
      slug: ensureUniqueSlug(input.name, "tags", tagId),
      color: input.color,
      updatedAt: timestamp(),
    })
    .where(eq(tags.id, tagId))
    .run();
}

export function deleteTag(tagId: string) {
  ensureDatabase();
  assertExists("tags", tagId, "标签");
  db.delete(linkTags).where(eq(linkTags.tagId, tagId)).run();
  db.delete(tags).where(eq(tags.id, tagId)).run();
}

export function createLink(input: LinkInput) {
  ensureDatabase();
  assertCategoryUsable(input.categoryId);
  const validTagIds = normalizeTagIds(input.tagIds);
  const linkId = id();
  const now = timestamp();
  const sqlite = getSqlite();
  const createTx = sqlite.transaction(() => {
    sqlite
      .prepare(
        "insert into links (id, title, url, description, icon_url, category_id, is_featured, is_active, sort_order, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        linkId,
        input.title,
        input.url,
        input.description || null,
        input.iconUrl || null,
        input.categoryId,
        input.isFeatured ? 1 : 0,
        input.isActive ? 1 : 0,
        input.sortOrder,
        now,
        now,
      );
    replaceLinkTags(linkId, validTagIds);
  });
  createTx();
}

export function updateLink(linkId: string, input: LinkInput) {
  ensureDatabase();
  assertExists("links", linkId, "链接");
  assertCategoryUsable(input.categoryId);
  const validTagIds = normalizeTagIds(input.tagIds);
  const sqlite = getSqlite();
  const updateTx = sqlite.transaction(() => {
    sqlite
      .prepare(
        "update links set title = ?, url = ?, description = ?, icon_url = ?, category_id = ?, is_featured = ?, is_active = ?, sort_order = ?, updated_at = ? where id = ?",
      )
      .run(
        input.title,
        input.url,
        input.description || null,
        input.iconUrl || null,
        input.categoryId,
        input.isFeatured ? 1 : 0,
        input.isActive ? 1 : 0,
        input.sortOrder,
        timestamp(),
        linkId,
      );
    replaceLinkTags(linkId, validTagIds);
  });
  updateTx();
}

export function deleteLink(linkId: string) {
  ensureDatabase();
  assertExists("links", linkId, "链接");
  db.delete(linkTags).where(eq(linkTags.linkId, linkId)).run();
  db.delete(links).where(eq(links.id, linkId)).run();
}

function replaceLinkTags(linkId: string, tagIds: string[]) {
  db.delete(linkTags).where(eq(linkTags.linkId, linkId)).run();
  tagIds.forEach((tagId) => {
    db.insert(linkTags).values({ linkId, tagId }).run();
  });
}
