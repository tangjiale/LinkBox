import fs from "node:fs";
import path from "node:path";

import { closeDatabase, ensureDatabase } from "../src/lib/db/connection";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

async function main() {
  loadLocalEnv();
  try {
    await ensureDatabase();
    console.log("LinkBox Postgres 数据库已初始化并写入默认数据。");
  } finally {
    await closeDatabase();
  }
}

main().catch((error) => {
  console.error("初始化数据库失败");
  console.error(error);
  process.exit(1);
});
