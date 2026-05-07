import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

type FetchLike = typeof fetch;

const ICON_REL_TOKENS = new Set(["icon", "apple-touch-icon", "apple-touch-icon-precomposed", "mask-icon"]);
const MAX_HTML_LENGTH = 512_000;

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;

  const [first, second] = parts;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first === 169 && second === 254 ||
    first === 172 && second >= 16 && second <= 31 ||
    first === 192 && second === 168 ||
    first >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

export function isBlockedIp(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

export async function assertPublicHttpUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("请输入合法 URL。");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URL 必须以 http:// 或 https:// 开头。");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("不支持读取本机或内网地址的图标。");
  }

  if (isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("不支持读取本机或内网地址的图标。");
    return url;
  }

  const addresses = await lookup(hostname, { all: true });
  if (addresses.length === 0 || addresses.some((entry) => isBlockedIp(entry.address))) {
    throw new Error("不支持读取本机或内网地址的图标。");
  }

  return url;
}

function readAttribute(tag: string, name: string) {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`, "i");
  const match = tag.match(pattern);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? "";
}

function isIconLink(tag: string) {
  const rel = readAttribute(tag, "rel").toLowerCase();
  if (!rel) return false;
  return rel.split(/\s+/).some((token) => ICON_REL_TOKENS.has(token));
}

function scoreIconCandidate(url: string, rel: string) {
  const lower = url.toLowerCase();
  const normalizedRel = rel.toLowerCase();
  if (normalizedRel.includes("apple-touch-icon")) return 100;
  if (lower.endsWith(".svg")) return 95;
  if (lower.includes("apple-touch-icon")) return 90;
  if (lower.includes("32x32") || lower.includes("48x48") || lower.includes("64x64")) return 80;
  if (lower.includes("favicon")) return 70;
  if (lower.endsWith(".png")) return 60;
  if (lower.endsWith(".ico")) return 50;
  return 10;
}

export function extractFaviconUrls(html: string, pageUrl: string) {
  const baseUrl = new URL(pageUrl);
  const candidates = new Map<string, number>();
  const linkTags = html.slice(0, MAX_HTML_LENGTH).match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of linkTags) {
    if (!isIconLink(tag)) continue;

    const rel = readAttribute(tag, "rel");
    const href = readAttribute(tag, "href").trim();
    if (!href) continue;

    try {
      const iconUrl = new URL(href, baseUrl);
      if (iconUrl.protocol === "http:" || iconUrl.protocol === "https:") {
        const normalizedUrl = iconUrl.toString();
        candidates.set(normalizedUrl, Math.max(candidates.get(normalizedUrl) ?? 0, scoreIconCandidate(normalizedUrl, rel)));
      }
    } catch {
      // 忽略页面中不合法的 icon href，继续尝试其它候选项。
    }
  }

  return Array.from(candidates.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([url]) => url);
}

async function fetchText(url: string, fetchImpl: FetchLike) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "LinkBox favicon resolver",
    },
    redirect: "manual",
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) return "";

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) return "";

  return (await response.text()).slice(0, MAX_HTML_LENGTH);
}

async function isReachableIcon(url: string, fetchImpl: FetchLike) {
  try {
    const headResponse = await fetchImpl(url, {
      method: "HEAD",
      headers: { "User-Agent": "LinkBox favicon resolver" },
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    });
    if (headResponse.ok) return true;
    if (headResponse.status !== 405 && headResponse.status !== 403) return false;

    const getResponse = await fetchImpl(url, {
      headers: {
        Range: "bytes=0-0",
        "User-Agent": "LinkBox favicon resolver",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
    });
    return getResponse.ok;
  } catch {
    return false;
  }
}

export async function resolveFaviconUrl(rawUrl: string, fetchImpl: FetchLike = fetch) {
  const url = await assertPublicHttpUrl(rawUrl);
  const html = await fetchText(url.toString(), fetchImpl);
  const candidates = html ? extractFaviconUrls(html, url.toString()) : [];

  for (const candidate of candidates) {
    try {
      await assertPublicHttpUrl(candidate);
    } catch {
      continue;
    }
    if (await isReachableIcon(candidate, fetchImpl)) return candidate;
  }

  const fallback = new URL("/favicon.ico", url.origin).toString();
  if (await isReachableIcon(fallback, fetchImpl)) return fallback;

  throw new Error("没有读取到可用的网站图标。");
}
