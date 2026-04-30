import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  color: text("color").notNull().default("#2563eb"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const linkTags = sqliteTable(
  "link_tags",
  {
    linkId: text("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.linkId, table.tagId] }),
  }),
);

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const linksRelations = relations(links, ({ one, many }) => ({
  category: one(categories, {
    fields: [links.categoryId],
    references: [categories.id],
  }),
  linkTags: many(linkTags),
}));

export const linkTagsRelations = relations(linkTags, ({ one }) => ({
  link: one(links, {
    fields: [linkTags.linkId],
    references: [links.id],
  }),
  tag: one(tags, {
    fields: [linkTags.tagId],
    references: [tags.id],
  }),
}));
