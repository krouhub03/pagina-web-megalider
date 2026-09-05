import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/mysql/schema.ts",
  out: "./lib/db/mysql/migrations",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.MYSQL_DATABASE_URL || "",
  },
});
