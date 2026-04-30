import { ensureDatabase } from "../src/lib/db/connection";

ensureDatabase();
console.log("LinkBox SQLite 数据库已初始化并写入默认数据。");
