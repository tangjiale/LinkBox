import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, ensureDatabase } from "./connection";
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

async function ensureUniqueSlug(base: string, table: "categories" | "tags", currentId?: string) {
  await ensureDatabase();
  const slug = createSlug(base);
  const existing =
    table === "categories"
      ? await db().select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).limit(1)
      : await db().select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing.length === 0 || existing[0].id === currentId) return slug;

  for (let index = 0; index < 8; index += 1) {
    const candidate = `${slug}-${id().slice(0, 8)}`;
    const duplicate =
      table === "categories"
        ? await db().select({ id: categories.id }).from(categories).where(eq(categories.slug, candidate)).limit(1)
        : await db().select({ id: tags.id }).from(tags).where(eq(tags.slug, candidate)).limit(1);
    if (duplicate.length === 0) return candidate;
  }
  throw new LinkBoxError(409, "无法生成唯一标识，请稍后重试。");
}

async function assertExists(table: "categories" | "links" | "tags", itemId: string, label: string) {
  await ensureDatabase();
  const row =
    table === "categories"
      ? await db().select({ id: categories.id }).from(categories).where(eq(categories.id, itemId)).limit(1)
      : table === "links"
        ? await db().select({ id: links.id }).from(links).where(eq(links.id, itemId)).limit(1)
        : await db().select({ id: tags.id }).from(tags).where(eq(tags.id, itemId)).limit(1);
  if (row.length === 0) throw new LinkBoxError(404, `${label}不存在或已被删除。`);
}

async function assertCategoryUsable(categoryId: string) {
  await ensureDatabase();
  const row = await db().select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (row.length === 0) throw new LinkBoxError(400, "所选分类不存在。");
}

async function normalizeTagIds(tagIds: string[]) {
  const uniqueIds = Array.from(new Set(tagIds));
  if (uniqueIds.length === 0) return uniqueIds;

  await ensureDatabase();
  const rows = await db().select({ id: tags.id }).from(tags).where(inArray(tags.id, uniqueIds));
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

export async function getAdminByUsername(username: string) {
  await ensureDatabase();
  const rows = await db().select().from(adminUsers).where(eq(adminUsers.username, username)).limit(1);
  return rows[0];
}

export async function listCategories(includeInactive = false): Promise<Category[]> {
  await ensureDatabase();
  const rows = await db().select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.filter((item) => includeInactive || item.isActive).map(normalizeCategory);
}

export async function listTags(): Promise<Tag[]> {
  await ensureDatabase();
  return (await db().select().from(tags).orderBy(asc(tags.name))).map(normalizeTag);
}

export async function listLinks(includeInactive = false): Promise<LinkItem[]> {
  await ensureDatabase();
  const [allCategories, allTags, linkRows, linkTagRows] = await Promise.all([
    listCategories(true),
    listTags(),
    db().select().from(links).orderBy(asc(links.sortOrder), desc(links.createdAt), asc(links.title)),
    db().select().from(linkTags),
  ]);
  const categoryMap = new Map(allCategories.map((category) => [category.id, category]));
  const tagMap = new Map(allTags.map((tag) => [tag.id, tag]));

  return linkRows
    .filter((item) => includeInactive || item.isActive)
    .map((row) => ({
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

export async function getPublicData(): Promise<PublicData> {
  const [visibleCategories, allTags, activeLinks] = await Promise.all([listCategories(false), listTags(), listLinks(false)]);
  const visibleCategoryIds = new Set(visibleCategories.map((category) => category.id));
  return {
    categories: visibleCategories,
    tags: allTags,
    links: activeLinks.filter((link) => visibleCategoryIds.has(link.categoryId)),
  };
}

export async function getAdminSummary() {
  const [allLinks, allCategories, allTags] = await Promise.all([listLinks(true), listCategories(true), listTags()]);

  return {
    linksCount: allLinks.length,
    activeLinksCount: allLinks.filter((item) => item.isActive).length,
    featuredLinksCount: allLinks.filter((item) => item.isFeatured).length,
    categoriesCount: allCategories.length,
    tagsCount: allTags.length,
    recentLinks: allLinks.slice(0, 6),
  };
}

export async function createCategory(input: CategoryInput) {
  await ensureDatabase();
  const row = {
    id: id(),
    name: input.name,
    slug: await ensureUniqueSlug(input.name, "categories"),
    description: input.description || null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
  await db().insert(categories).values(row);
  return normalizeCategory(row);
}

export async function updateCategory(categoryId: string, input: CategoryInput) {
  await ensureDatabase();
  await assertExists("categories", categoryId, "分类");
  await db()
    .update(categories)
    .set({
      name: input.name,
      slug: await ensureUniqueSlug(input.name, "categories", categoryId),
      description: input.description || null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      updatedAt: timestamp(),
    })
    .where(eq(categories.id, categoryId));
}

export async function deleteCategory(categoryId: string) {
  await ensureDatabase();
  await assertExists("categories", categoryId, "分类");
  const related = await db().select({ id: links.id }).from(links).where(eq(links.categoryId, categoryId)).limit(1);
  if (related.length > 0) {
    throw new LinkBoxError(409, "该分类下仍有关联链接，请先调整或删除链接。");
  }
  await db().delete(categories).where(eq(categories.id, categoryId));
}

export async function createTag(input: TagInput) {
  await ensureDatabase();
  const row = {
    id: id(),
    name: input.name,
    slug: await ensureUniqueSlug(input.name, "tags"),
    color: input.color,
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
  await db().insert(tags).values(row);
  return normalizeTag(row);
}

export async function updateTag(tagId: string, input: TagInput) {
  await ensureDatabase();
  await assertExists("tags", tagId, "标签");
  await db()
    .update(tags)
    .set({
      name: input.name,
      slug: await ensureUniqueSlug(input.name, "tags", tagId),
      color: input.color,
      updatedAt: timestamp(),
    })
    .where(eq(tags.id, tagId));
}

export async function deleteTag(tagId: string) {
  await ensureDatabase();
  await assertExists("tags", tagId, "标签");
  await db().delete(linkTags).where(eq(linkTags.tagId, tagId));
  await db().delete(tags).where(eq(tags.id, tagId));
}

export async function createLink(input: LinkInput) {
  await ensureDatabase();
  await assertCategoryUsable(input.categoryId);
  const validTagIds = await normalizeTagIds(input.tagIds);
  const linkId = id();
  const now = timestamp();
  await db().insert(links).values({
    id: linkId,
    title: input.title,
    url: input.url,
    description: input.description || null,
    iconUrl: input.iconUrl || null,
    categoryId: input.categoryId,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    createdAt: now,
    updatedAt: now,
  });
  await replaceLinkTags(linkId, validTagIds);
}

export async function updateLink(linkId: string, input: LinkInput) {
  await ensureDatabase();
  await assertExists("links", linkId, "链接");
  await assertCategoryUsable(input.categoryId);
  const validTagIds = await normalizeTagIds(input.tagIds);
  await db()
    .update(links)
    .set({
      title: input.title,
      url: input.url,
      description: input.description || null,
      iconUrl: input.iconUrl || null,
      categoryId: input.categoryId,
      isFeatured: input.isFeatured,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      updatedAt: timestamp(),
    })
    .where(eq(links.id, linkId));
  await replaceLinkTags(linkId, validTagIds);
}

export async function deleteLink(linkId: string) {
  await ensureDatabase();
  await assertExists("links", linkId, "链接");
  await db().delete(linkTags).where(eq(linkTags.linkId, linkId));
  await db().delete(links).where(eq(links.id, linkId));
}

async function replaceLinkTags(linkId: string, tagIds: string[]) {
  await db().delete(linkTags).where(eq(linkTags.linkId, linkId));
  if (tagIds.length > 0) {
    await db().insert(linkTags).values(tagIds.map((tagId) => ({ linkId, tagId })));
  }
}
