import { describe, expect, it } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { createSlug } from "@/lib/utils/slug";
import { categorySchema, linkSchema, tagSchema } from "@/lib/validators/linkbox";
import { createSessionToken, readSessionToken } from "@/lib/auth/session";
import { extractFaviconUrls, isBlockedIp } from "@/lib/favicon";

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

describe("login api", () => {
  it("returns a json 400 response for invalid json bodies", async () => {
    const response = await loginPost(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "{invalid-json",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "请求体必须是合法 JSON" });
  });
});

describe("favicon resolver", () => {
  it("extracts and resolves favicon links from html", () => {
    const icons = extractFaviconUrls(
      `
        <link rel="shortcut icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="https://cdn.example.com/apple.png">
        <link rel="icon" sizes="32x32" href="./favicon-32x32.png">
      `,
      "https://example.com/docs/page",
    );

    expect(icons).toEqual([
      "https://cdn.example.com/apple.png",
      "https://example.com/docs/favicon-32x32.png",
      "https://example.com/favicon.ico",
    ]);
  });

  it("blocks localhost and private network ips", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.8")).toBe(true);
    expect(isBlockedIp("192.168.1.2")).toBe(true);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
  });
});
