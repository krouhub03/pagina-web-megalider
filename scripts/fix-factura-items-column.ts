import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mysql from "mysql2/promise";

async function main() {
  const url = process.env.MYSQL_DATABASE_URL;
  if (!url) {
    console.error("No MYSQL_DATABASE_URL");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  console.log("🔍 Inspeccionando columnas de `factura_items`...");

  const [cols]: any = await conn.query("SHOW COLUMNS FROM `factura_items`");
  const colNames = cols.map((c: any) => c.Field);
  console.log("Columnas actuales en `factura_items`:", colNames);

  if (!colNames.includes("nombre_producto")) {
    if (colNames.includes("descripcion")) {
      console.log("🔄 Agregando columna `nombre_producto` y copiando datos de `descripcion`...");
      await conn.query("ALTER TABLE `factura_items` ADD COLUMN `nombre_producto` text NULL;");
      await conn.query("UPDATE `factura_items` SET `nombre_producto` = `descripcion` WHERE `nombre_producto` IS NULL;");
      console.log("✅ Columna `nombre_producto` agregada y datos copiados.");
    } else {
      console.log("➕ Creando columna `nombre_producto`...");
      await conn.query("ALTER TABLE `factura_items` ADD COLUMN `nombre_producto` text NULL;");
      console.log("✅ Columna `nombre_producto` agregada.");
    }
  } else {
    console.log("ℹ️ La columna `nombre_producto` ya existe.");
  }

  console.log("🛠️ Verificando tabla `factura_archivos`...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`factura_archivos\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`factura_id\` int NOT NULL,
      \`nombre_archivo\` varchar(255) NOT NULL,
      \`tipo_mime\` varchar(100) NOT NULL,
      \`datos_base64\` longtext NOT NULL,
      \`creado_en\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_factura_archivos_factura_id\` (\`factura_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✅ Tabla `factura_archivos` lista.");

  await conn.end();
}

main().catch(console.error);
