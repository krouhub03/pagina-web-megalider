import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionUri = process.env.MYSQL_DATABASE_URL || "";

const globalForMysql = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

const pool =
  globalForMysql.mysqlPool ??
  mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMysql.mysqlPool = pool;
}

export const dbMysql = drizzle(pool, { schema, mode: "default" });
export { schema };
