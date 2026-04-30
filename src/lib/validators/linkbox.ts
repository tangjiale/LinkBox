import { z } from "zod";

const boolish = z.union([z.boolean(), z.literal("true"), z.literal("false")]).transform((value) => {
  if (typeof value === "boolean") return value;
  return value === "true";
});

export const loginSchema = z.object({
  username: z.string().min(1, "请输入账号").trim(),
  password: z.string().min(1, "请输入密码"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "分类名称不能为空").max(40, "分类名称过长").trim(),
  description: z.string().max(120, "描述过长").optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: boolish.default(true),
});

export const tagSchema = z.object({
  name: z.string().min(1, "标签名称不能为空").max(24, "标签名称过长").trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "颜色必须是 HEX 格式").default("#2563eb"),
});

export const linkSchema = z.object({
  title: z.string().min(1, "网站名称不能为空").max(80, "网站名称过长").trim(),
  url: z.string().url("请输入合法 URL").refine((url) => /^https?:\/\//.test(url), "URL 必须以 http:// 或 https:// 开头"),
  description: z.string().max(180, "描述过长").optional().nullable(),
  iconUrl: z.string().url("图标 URL 不合法").optional().nullable().or(z.literal("")),
  categoryId: z.string().min(1, "请选择分类"),
  tagIds: z.array(z.string()).default([]),
  isFeatured: boolish.default(false),
  isActive: boolish.default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type LinkInput = z.infer<typeof linkSchema>;
