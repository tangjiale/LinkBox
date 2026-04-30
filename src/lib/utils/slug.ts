const slugMap: Record<string, string> = {
  AI工具: "ai-tools",
  开发资源: "dev-resources",
  设计灵感: "design-inspiration",
  效率工具: "productivity",
  学习资料: "learning",
  常用网站: "favorites",
};

export function createSlug(input: string) {
  const trimmed = input.trim();
  if (slugMap[trimmed]) return slugMap[trimmed];

  const ascii = trimmed
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (ascii) return ascii.slice(0, 60);

  return `item-${Buffer.from(trimmed).toString("hex").slice(0, 12)}`;
}
