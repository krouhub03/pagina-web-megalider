const postgres = require('postgres');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pgUrl = process.env.POSTGRES_DATABASE_URL;
  if (!pgUrl) throw new Error("No POSTGRES_DATABASE_URL");
  
  const mysqlUrl = process.env.MYSQL_DATABASE_URL;
  if (!mysqlUrl) throw new Error("No MYSQL_DATABASE_URL");

  console.log("Creando tabla en PostgreSQL...");
  const sqlPg = postgres(pgUrl, { max: 1 });
  
  await sqlPg`
    CREATE TABLE IF NOT EXISTS "facturas_auditoria" (
      "id" serial PRIMARY KEY NOT NULL,
      "datos_extraidos" text,
      "estado" varchar(50) DEFAULT 'PENDIENTE',
      "creado_en" timestamp DEFAULT now()
    );
  `;
  
  await sqlPg`
    CREATE TABLE IF NOT EXISTS "facturas_auditoria_archivos" (
      "id" serial PRIMARY KEY NOT NULL,
      "factura_auditoria_id" integer,
      "datos_base64" text NOT NULL,
      "orden" integer DEFAULT 0,
      "creado_en" timestamp DEFAULT now()
    );
  `;
  console.log("PostgreSQL OK");

  console.log("Creando tablas en MySQL...");
  const sqlMysql = await mysql.createConnection(mysqlUrl);
  
  await sqlMysql.query(`
    CREATE TABLE IF NOT EXISTS proveedores (
      id int AUTO_INCREMENT NOT NULL,
      nit varchar(50) NOT NULL,
      razon_social varchar(255) NOT NULL,
      creado_en timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT proveedores_id PRIMARY KEY(id),
      CONSTRAINT proveedores_nit_unique UNIQUE(nit)
    );
  `);

  await sqlMysql.query(`
    CREATE TABLE IF NOT EXISTS facturas (
      id int AUTO_INCREMENT NOT NULL,
      numero_factura varchar(100) NOT NULL,
      proveedor_id int NOT NULL,
      fecha_emision timestamp NOT NULL,
      total_factura decimal(12,2) NOT NULL DEFAULT '0.00',
      categoria enum('INVENTARIO','OPEX','ACTIVOS') NOT NULL DEFAULT 'INVENTARIO',
      estado_pago enum('PAGADA','PENDIENTE','CREDITO_30_DIAS') NOT NULL DEFAULT 'PENDIENTE',
      creado_en timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT facturas_id PRIMARY KEY(id)
    );
  `);

  await sqlMysql.query(`
    CREATE TABLE IF NOT EXISTS factura_items (
      id int AUTO_INCREMENT NOT NULL,
      factura_id int NOT NULL,
      descripcion text NOT NULL,
      cantidad decimal(12,2) NOT NULL,
      precio_unitario decimal(12,2) NOT NULL,
      subtotal decimal(12,2) NOT NULL,
      CONSTRAINT factura_items_id PRIMARY KEY(id)
    );
  `);
  
  console.log("MySQL OK");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
