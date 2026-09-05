const { migrate } = require('drizzle-orm/postgres-js/migrator');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.POSTGRES_DATABASE_URL;
  if (!connectionString) throw new Error("No URL");
  
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("Corriendo migraciones Postgres...");
  await migrate(db, { migrationsFolder: './lib/db/postgres/migrations' });
  console.log("¡Migraciones Postgres completadas!");
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
