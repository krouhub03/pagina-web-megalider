import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function main() {
  const { dbMysql } = await import('./lib/db/mysql/index.js');
  const { sql } = await import('drizzle-orm');
  const [f] = await dbMysql.execute(sql`SELECT COUNT(*) as c FROM facturas`);
  console.log('Facturas count:', f);
  process.exit(0);
}
main();
