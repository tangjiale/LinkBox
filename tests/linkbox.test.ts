import { describe, expect, it } from "vitest";
import { createSlug } from "@/lib/utils/slug";
import { categorySchema, linkSchema, tagSchema } from "@/lib/validators/linkbox";
import { createSessionToken, readSessionToken } from "@/lib/auth/session";

describe("slug generation", () => {
  it("maps known Chinese category names to stable slugs", () => {
    expect(createSlug("AI工具")).toBe("ai-tools");
    expect(createSlug("开发资源")).toBe("dev-resources");
  });

  it("creates deterministic fallback slugs for Chinese text", () => {
    expect(createSlug("我的导航")).toMatch(/^item-/);
  });
});

describe("input validation", () => {
  it("accepts valid link payloads", () => {
    const parsed = linkSchema.safeParse({
      title: "Next.js",
      url: "https://nextjs.org",
      categoryId: "cat_1",
      tagIds: ["tag_1"],
      isFeatured: true,
      isActive: true,
      sortOrder: 10,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects non-http link urls", () => {
    const parsed = linkSchema.safeParse({
      title: "Local",
      url: "ftp://example.com",
      categoryId: "cat_1",
    });
    expect(parsed.success).toBe(false);
  });

  it("validates category and tag basics", () => {
    expect(categorySchema.safeParse({ name: "效率工具", sortOrder: 1, isActive: true }).success).toBe(true);
    expect(tagSchema.safeParse({ name: "推荐", color: "#2563eb" }).success).toBe(true);
    expect(tagSchema.safeParse({ name: "推荐", color: "blue" }).success).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips signed session payloads", () => {
    const token = createSessionToken("admin");
    expect(readSessionToken(token)?.username).toBe("admin");
  });

  it("rejects tampered tokens", () => {
    const token = `${createSessionToken("admin")}x`;
    expect(readSessionToken(token)).toBeNull();
  });
});
