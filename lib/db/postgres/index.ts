import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_DATABASE_URL || "";

// Conexión singleton segura para Server Components y Server Actions de Next.js
const globalForDb = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
};

const client =
  globalForDb.postgresClient ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const dbPostgres = drizzle(client, { schema });
export { schema };
