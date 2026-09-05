import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mysql from "mysql2/promise";

async function run() {
  const url = process.env.MYSQL_DATABASE_URL;
  if (!url) {
    console.error("❌ MYSQL_DATABASE_URL no está definido en .env.local");
    process.exit(1);
  }

  console.log("🔗 Conectando a MySQL/MariaDB en:", url.replace(/:[^:@]+@/, ":****@"));
  const conn = await mysql.createConnection(url);

  console.log("🛠️ 1. Creando tablas contables si no existen...");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`puc_cuentas\` (
      \`codigo\` varchar(10) PRIMARY KEY,
      \`nombre\` varchar(255) NULL,
      \`nivel\` int NULL,
      \`naturaleza\` varchar(50) NULL,
      \`descripcion\` text NULL,
      \`creado_en\` timestamp DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`medios_pago\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`codigo\` varchar(50) UNIQUE,
      \`nombre\` varchar(100) NOT NULL UNIQUE,
      \`activo\` boolean NOT NULL DEFAULT true,
      \`creado_en\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`tipos_operacion\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`codigo\` varchar(50) NOT NULL UNIQUE,
      \`nombre\` varchar(150) NOT NULL,
      \`descripcion\` text NULL,
      \`cuenta_puc_debito\` varchar(10) NOT NULL,
      \`cuenta_puc_credito\` varchar(10) NULL,
      \`afecta_inventario\` boolean NOT NULL DEFAULT false,
      \`es_remision\` boolean NOT NULL DEFAULT false,
      \`activo\` boolean NOT NULL DEFAULT true,
      \`creado_en\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`cuentas_tesoreria\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`medio_pago_id\` int NOT NULL,
      \`codigo_puc\` varchar(10) NOT NULL,
      \`nombre_cuenta\` varchar(150) NOT NULL,
      \`numero_referencia\` varchar(100) NULL,
      \`activo\` boolean NOT NULL DEFAULT true,
      \`creado_en\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_cuentas_tesoreria_medio_pago\` (\`medio_pago_id\`),
      INDEX \`idx_cuentas_tesoreria_codigo_puc\` (\`codigo_puc\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`tipos_retencion\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`codigo\` varchar(50) NOT NULL UNIQUE,
      \`nombre\` varchar(150) NOT NULL,
      \`porcentaje\` decimal(5,2) NOT NULL,
      \`base_minima\` decimal(12,2) DEFAULT 0.00,
      \`cuenta_puc\` varchar(10) NOT NULL,
      \`activo\` boolean NOT NULL DEFAULT true,
      \`creado_en\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`factura_retenciones\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`factura_id\` int NOT NULL,
      \`tipo_retencion_id\` int NOT NULL,
      \`base_gravable\` decimal(12,2) NOT NULL,
      \`porcentaje_aplicado\` decimal(5,2) NOT NULL,
      \`valor_retenido\` decimal(12,2) NOT NULL,
      \`creado_en\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_factura_retenciones_factura_id\` (\`factura_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`factura_asientos\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`factura_id\` int NOT NULL,
      \`cuenta_puc\` varchar(10) NOT NULL,
      \`concepto\` varchar(255) NOT NULL,
      \`debito\` decimal(12,2) NOT NULL DEFAULT 0.00,
      \`credito\` decimal(12,2) NOT NULL DEFAULT 0.00,
      \`creado_en\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX \`idx_factura_asientos_factura_id\` (\`factura_id\`),
      INDEX \`idx_factura_asientos_cuenta_puc\` (\`cuenta_puc\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

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

  console.log("🛠️ 2. Verificando y agregando columnas a tabla `facturas` y `medios_pago`...");

  // Verificar columnas en `medios_pago`
  const [colsMp]: any = await conn.query("SHOW COLUMNS FROM `medios_pago`");
  const colNamesMp = colsMp.map((c: any) => c.Field);
  if (!colNamesMp.includes("codigo")) {
    await conn.query("ALTER TABLE `medios_pago` ADD COLUMN `codigo` varchar(50) UNIQUE NULL;");
    console.log("  ➕ Columna `codigo` agregada a `medios_pago`.");
  }

  // Verificar columnas en `facturas`
  const [cols]: any = await conn.query("SHOW COLUMNS FROM `facturas`");
  const colNames = cols.map((c: any) => c.Field);

  if (!colNames.includes("tipo_operacion_id")) {
    await conn.query("ALTER TABLE `facturas` ADD COLUMN `tipo_operacion_id` int NULL;");
    console.log("  ➕ Columna `tipo_operacion_id` agregada.");
  }
  if (!colNames.includes("medio_pago_id")) {
    await conn.query("ALTER TABLE `facturas` ADD COLUMN `medio_pago_id` int NULL;");
    console.log("  ➕ Columna `medio_pago_id` agregada.");
  }
  if (!colNames.includes("cuenta_tesoreria_id")) {
    await conn.query("ALTER TABLE `facturas` ADD COLUMN `cuenta_tesoreria_id` int NULL;");
    console.log("  ➕ Columna `cuenta_tesoreria_id` agregada.");
  }
  if (!colNames.includes("remision_origen_id")) {
    await conn.query("ALTER TABLE `facturas` ADD COLUMN `remision_origen_id` int NULL;");
    console.log("  ➕ Columna `remision_origen_id` agregada.");
  }
  if (!colNames.includes("estado_remision")) {
    await conn.query("ALTER TABLE `facturas` ADD COLUMN `estado_remision` ENUM('PENDIENTE_FACTURAR', 'FACTURADA', 'NO_APLICA') NOT NULL DEFAULT 'NO_APLICA';");
    console.log("  ➕ Columna `estado_remision` agregada.");
  }
  if (!colNames.includes("estado_contable")) {
    await conn.query("ALTER TABLE `facturas` ADD COLUMN `estado_contable` ENUM('PENDIENTE_CONCILIACION', 'CONCILIADA', 'PAGADA') NOT NULL DEFAULT 'PENDIENTE_CONCILIACION';");
    console.log("  ➕ Columna `estado_contable` agregada.");
  }

  // Verificar columnas en `factura_items`
  const [colsFi]: any = await conn.query("SHOW COLUMNS FROM `factura_items`");
  const colNamesFi = colsFi.map((c: any) => c.Field);
  if (!colNamesFi.includes("nombre_producto")) {
    await conn.query("ALTER TABLE `factura_items` ADD COLUMN `nombre_producto` text NULL;");
    if (colNamesFi.includes("descripcion")) {
      await conn.query("UPDATE `factura_items` SET `nombre_producto` = `descripcion` WHERE `nombre_producto` IS NULL;");
    }
    console.log("  ➕ Columna `nombre_producto` agregada a `factura_items`.");
  }

  console.log("🌱 3. Sembrando Cuentas PUC...");
  const cuentasPucBase = [
    { codigo: "110505", nombre: "Caja General", nivel: 4, naturaleza: "Débito", descripcion: "Efectivo en mostrador y cajas" },
    { codigo: "11050501", nombre: "Caja Mostrador 1", nivel: 5, naturaleza: "Débito", descripcion: "Caja principal tienda física" },
    { codigo: "11050502", nombre: "Caja Auxiliar POS", nivel: 5, naturaleza: "Débito", descripcion: "Caja 2 auxiliar" },
    { codigo: "110510", nombre: "Cajas Menores", nivel: 4, naturaleza: "Débito", descripcion: "Fondo fijo de gastos menores" },
    { codigo: "11051001", nombre: "Caja Menor Gerencia", nivel: 5, naturaleza: "Débito", descripcion: "Fondo de emergencia y gastos diarios" },
    { codigo: "111005", nombre: "Bancos Moneda Nacional", nivel: 4, naturaleza: "Débito", descripcion: "Cuentas bancarias corrientes y de ahorros" },
    { codigo: "11100501", nombre: "Bancolombia Cta Ahorros", nivel: 5, naturaleza: "Débito", descripcion: "Cuenta principal de recaudos y pagos" },
    { codigo: "11100502", nombre: "Nequi Cigarrería Megalider", nivel: 5, naturaleza: "Débito", descripcion: "Billetera digital de pagos rápidos" },
    { codigo: "11100503", nombre: "Daviplata Megalider", nivel: 5, naturaleza: "Débito", descripcion: "Billetera digital auxiliar" },
    { codigo: "130505", nombre: "Clientes Nacionales", nivel: 4, naturaleza: "Débito", descripcion: "Cuentas por cobrar a clientes" },
    { codigo: "130510", nombre: "Deudores Datáfonos y Pasarelas", nivel: 4, naturaleza: "Débito", descripcion: "Fondos en tránsito por tarjetas" },
    { codigo: "1435", nombre: "Mercancías no Fabricadas por la Empresa", nivel: 3, naturaleza: "Débito", descripcion: "Inventario de licores, cigarrillos, confitería y bebidas" },
    { codigo: "143505", nombre: "Inventario General de Mercancías", nivel: 4, naturaleza: "Débito", descripcion: "Stock oficial para la venta" },
    { codigo: "152405", nombre: "Muebles y Enseres del Local", nivel: 4, naturaleza: "Débito", descripcion: "Vitrinas, mostradores y estanterías" },
    { codigo: "152805", nombre: "Equipos de Computación y Comunicación", nivel: 4, naturaleza: "Débito", descripcion: "Computadores, cámaras, impresoras POS" },
    { codigo: "220505", nombre: "Proveedores Nacionales", nivel: 4, naturaleza: "Crédito", descripcion: "Cuentas por pagar a distribuidores y terceros" },
    { codigo: "220595", nombre: "Mercancías por Facturar (Provisiones)", nivel: 4, naturaleza: "Crédito", descripcion: "Cuenta transitoria para remisiones de compra" },
    { codigo: "233595", nombre: "Otros Costos y Gastos por Pagar", nivel: 4, naturaleza: "Crédito", descripcion: "Acreedores varios y servicios" },
    { codigo: "236540", nombre: "Retención en la Fuente - Compras 2.5%", nivel: 4, naturaleza: "Crédito", descripcion: "Retenciones fiscales a proveedores" },
    { codigo: "236525", nombre: "Retención en la Fuente - Servicios 3.5%", nivel: 4, naturaleza: "Crédito", descripcion: "Retenciones por servicios y honorarios" },
    { codigo: "236701", nombre: "Retención de IVA (ReteIVA 15%)", nivel: 4, naturaleza: "Crédito", descripcion: "Retención de IVA practicada" },
    { codigo: "236801", nombre: "Retención de ICA (ReteICA)", nivel: 4, naturaleza: "Crédito", descripcion: "Retención de Impuesto de Industria y Comercio" },
    { codigo: "240801", nombre: "IVA Generado en Ventas (19% / 5%)", nivel: 4, naturaleza: "Crédito", descripcion: "Impuesto sobre las ventas recaudado" },
    { codigo: "240802", nombre: "IVA Descontable en Compras", nivel: 4, naturaleza: "Débito", descripcion: "Crédito tributario por compras a proveedores" },
    { codigo: "240810", nombre: "Impuesto Nacional al Consumo (ICO)", nivel: 4, naturaleza: "Débito", descripcion: "Impuesto al consumo en licores y cerveza" },
    { codigo: "4135", nombre: "Comercio al por Mayor y al por Menor", nivel: 3, naturaleza: "Crédito", descripcion: "Ingresos operacionales por venta de mercancía" },
    { codigo: "413505", nombre: "Ventas de Licores y Cigarrería", nivel: 4, naturaleza: "Crédito", descripcion: "Ingresos por ventas en mostrador y web" },
    { codigo: "5120", nombre: "Arrendamientos del Local", nivel: 3, naturaleza: "Débito", descripcion: "Canon de arrendamiento del establecimiento" },
    { codigo: "5135", nombre: "Servicios Operativos y Públicos", nivel: 3, naturaleza: "Débito", descripcion: "Energía, acueducto, internet, telefonía" },
    { codigo: "513525", nombre: "Acueducto y Alcantarillado", nivel: 4, naturaleza: "Débito", descripcion: "Servicios públicos básicos" },
    { codigo: "513530", nombre: "Energía Eléctrica", nivel: 4, naturaleza: "Débito", descripcion: "Consumo de energía neveras y local" },
    { codigo: "513550", nombre: "Transporte, Fletes y Acarreos", nivel: 4, naturaleza: "Débito", descripcion: "Domicilios y transporte de mercancía" },
    { codigo: "5145", nombre: "Mantenimiento y Reparaciones", nivel: 3, naturaleza: "Débito", descripcion: "Reparación de vitrinas, pintura, plomería" },
    { codigo: "514510", nombre: "Mantenimiento Instalaciones del Local", nivel: 4, naturaleza: "Débito", descripcion: "Arreglos locativos de la cigarrería" },
    { codigo: "519525", nombre: "Elementos de Aseo y Cafetería", nivel: 4, naturaleza: "Débito", descripcion: "Desechables, bolsas, jabón, suministros" },
    { codigo: "530515", nombre: "Comisiones y Gastos Bancarios / Datáfonos", nivel: 4, naturaleza: "Débito", descripcion: "Comisiones por pasarelas y terminales POS" },
  ];

  for (const c of cuentasPucBase) {
    await conn.query(
      `INSERT INTO \`puc_cuentas\` (\`codigo\`, \`nombre\`, \`nivel\`, \`naturaleza\`, \`descripcion\`)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE \`nombre\`=VALUES(\`nombre\`), \`nivel\`=VALUES(\`nivel\`), \`naturaleza\`=VALUES(\`naturaleza\`), \`descripcion\`=VALUES(\`descripcion\`);`,
      [c.codigo, c.nombre, c.nivel, c.naturaleza, c.descripcion]
    );
  }
  console.log(`  ✅ ${cuentasPucBase.length} Cuentas PUC sincronizadas.`);

  console.log("🌱 4. Sembrando Medios de Pago Macro...");
  const mediosPagoBase = [
    { codigo: "EFECTIVO", nombre: "Efectivo" },
    { codigo: "TRANSFERENCIA", nombre: "Transferencia / Digital" },
    { codigo: "TARJETA", nombre: "Tarjeta Débito / Crédito (Datáfono)" },
    { codigo: "CREDITO", nombre: "Crédito a Proveedor (30 Días)" },
  ];

  const mapaMediosPago: Record<string, number> = {};
  for (const mp of mediosPagoBase) {
    await conn.query(
      `INSERT INTO \`medios_pago\` (\`codigo\`, \`nombre\`) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`codigo\`=VALUES(\`codigo\`);`,
      [mp.codigo, mp.nombre]
    );
    const [rows]: any = await conn.query("SELECT id FROM `medios_pago` WHERE `nombre` = ?", [mp.nombre]);
    if (rows.length > 0) mapaMediosPago[mp.codigo] = rows[0].id;
  }
  console.log("  ✅ Medios de Pago Macro sincronizados.");

  console.log("🌱 5. Sembrando Tipos de Operación...");
  const tiposOperacionBase = [
    {
      codigo: "COMPRA_MERCANCIA",
      nombre: "Compra de Mercancía / Inventario",
      descripcion: "Adquisición de licores, cigarrillos, confitería y bebidas para comercialización. Afecta inventario.",
      cuentaPucDebito: "143505",
      cuentaPucCredito: "220505",
      afectaInventario: true,
      esRemision: false,
    },
    {
      codigo: "COMPRA_ACTIVO_FIJO",
      nombre: "Compra de Activos Fijos / Equipo",
      descripcion: "Adquisición de computadores, impresoras POS, cámaras o vitrinas para el establecimiento.",
      cuentaPucDebito: "152805",
      cuentaPucCredito: "220505",
      afectaInventario: false,
      esRemision: false,
    },
    {
      codigo: "MANTENIMIENTO_LOCAL",
      nombre: "Mantenimiento y Reparaciones Locativas",
      descripcion: "Gastos de plomería, pintura, arreglos de refrigeradores o estanterías del local.",
      cuentaPucDebito: "514510",
      cuentaPucCredito: "233595",
      afectaInventario: false,
      esRemision: false,
    },
    {
      codigo: "SERVICIOS_PUBLICOS",
      nombre: "Pago de Servicios Públicos e Internet",
      descripcion: "Facturas de energía eléctrica, acueducto, telefonía fija o internet de la tienda.",
      cuentaPucDebito: "513525",
      cuentaPucCredito: "233595",
      afectaInventario: false,
      esRemision: false,
    },
    {
      codigo: "GASTO_ADMIN_ASEO",
      nombre: "Insumos de Aseo y Cafetería",
      descripcion: "Compra de elementos de limpieza, bolsas plásticas, papel térmico o consumo interno.",
      cuentaPucDebito: "519525",
      cuentaPucCredito: "233595",
      afectaInventario: false,
      esRemision: false,
    },
    {
      codigo: "REMISION_COMPRA",
      nombre: "Remisión de Proveedor (Mercancía Física)",
      descripcion: "Entrada de mercancía respaldada con remisión de entrega provisional. Registra provisión sin duplicar.",
      cuentaPucDebito: "143505",
      cuentaPucCredito: "220595",
      afectaInventario: true,
      esRemision: true,
    },
  ];

  for (const op of tiposOperacionBase) {
    await conn.query(
      `INSERT INTO \`tipos_operacion\` (\`codigo\`, \`nombre\`, \`descripcion\`, \`cuenta_puc_debito\`, \`cuenta_puc_credito\`, \`afecta_inventario\`, \`es_remision\`)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE \`nombre\`=VALUES(\`nombre\`), \`descripcion\`=VALUES(\`descripcion\`), \`cuenta_puc_debito\`=VALUES(\`cuenta_puc_debito\`), \`cuenta_puc_credito\`=VALUES(\`cuenta_puc_credito\`), \`afecta_inventario\`=VALUES(\`afecta_inventario\`), \`es_remision\`=VALUES(\`es_remision\`);`,
      [op.codigo, op.nombre, op.descripcion, op.cuentaPucDebito, op.cuentaPucCredito, op.afectaInventario, op.esRemision]
    );
  }
  console.log("  ✅ Tipos de Operación sincronizados.");

  console.log("🌱 6. Sembrando Cuentas de Tesorería...");
  const cuentasTesoreriaBase = [
    { medioCodigo: "EFECTIVO", codigoPuc: "11050501", nombreCuenta: "Caja Mostrador 1 (Principal)", numeroReferencia: "CAJA-01" },
    { medioCodigo: "EFECTIVO", codigoPuc: "11050502", nombreCuenta: "Caja Auxiliar POS (Caja 2)", numeroReferencia: "CAJA-02" },
    { medioCodigo: "EFECTIVO", codigoPuc: "11051001", nombreCuenta: "Caja Menor Gerencia", numeroReferencia: "FONDO-FIJO" },
    { medioCodigo: "TRANSFERENCIA", codigoPuc: "11100501", nombreCuenta: "Bancolombia Ahorros Megalider", numeroReferencia: "CTA-982347123" },
    { medioCodigo: "TRANSFERENCIA", codigoPuc: "11100502", nombreCuenta: "Nequi Negocio Megalider", numeroReferencia: "3158901234" },
    { medioCodigo: "TRANSFERENCIA", codigoPuc: "11100503", nombreCuenta: "Daviplata Megalider", numeroReferencia: "3158901234" },
    { medioCodigo: "TARJETA", codigoPuc: "130510", nombreCuenta: "Datáfono Bold / Redeban", numeroReferencia: "DATA-01" },
    { medioCodigo: "CREDITO", codigoPuc: "220505", nombreCuenta: "Cuenta por Pagar Proveedor (Crédito)", numeroReferencia: "CXP-PROV" },
  ];

  for (const ct of cuentasTesoreriaBase) {
    const medioPagoId = mapaMediosPago[ct.medioCodigo];
    if (medioPagoId) {
      const [existing]: any = await conn.query("SELECT id FROM `cuentas_tesoreria` WHERE `nombre_cuenta` = ?", [ct.nombreCuenta]);
      if (existing.length === 0) {
        await conn.query(
          "INSERT INTO `cuentas_tesoreria` (`medio_pago_id`, `codigo_puc`, `nombre_cuenta`, `numero_referencia`, `activo`) VALUES (?, ?, ?, ?, 1)",
          [medioPagoId, ct.codigoPuc, ct.nombreCuenta, ct.numeroReferencia]
        );
      }
    }
  }
  console.log("  ✅ Cuentas de Tesorería sincronizadas.");

  console.log("🌱 7. Sembrando Tipos de Retención en la Fuente...");
  const tiposRetencionBase = [
    { codigo: "RTEFTE_COMPRAS_2_5", nombre: "Retención en la Fuente Compras (2.5%)", porcentaje: "2.50", baseMinima: "1145000.00", cuentaPuc: "236540" },
    { codigo: "RTEFTE_COMPRAS_3_5", nombre: "Retención en la Fuente Compras Declarantes (3.5%)", porcentaje: "3.50", baseMinima: "1145000.00", cuentaPuc: "236540" },
    { codigo: "RTEFTE_SERVICIOS_4_0", nombre: "Retención en la Fuente Servicios (4.0%)", porcentaje: "4.00", baseMinima: "190000.00", cuentaPuc: "236525" },
    { codigo: "RETEIVA_15", nombre: "Retención de IVA (ReteIVA 15%)", porcentaje: "15.00", baseMinima: "0.00", cuentaPuc: "236701" },
    { codigo: "RETEICA_BOGOTA_11_04", nombre: "Retención de ICA Comercio (11.04 x 1000)", porcentaje: "1.10", baseMinima: "0.00", cuentaPuc: "236801" },
  ];

  for (const tr of tiposRetencionBase) {
    await conn.query(
      `INSERT INTO \`tipos_retencion\` (\`codigo\`, \`nombre\`, \`porcentaje\`, \`base_minima\`, \`cuenta_puc\`)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE \`nombre\`=VALUES(\`nombre\`), \`porcentaje\`=VALUES(\`porcentaje\`), \`base_minima\`=VALUES(\`base_minima\`), \`cuenta_puc\`=VALUES(\`cuenta_puc\`);`,
      [tr.codigo, tr.nombre, tr.porcentaje, tr.baseMinima, tr.cuentaPuc]
    );
  }
  console.log("  ✅ Tipos de Retención sincronizados.");

  await conn.end();
  console.log("🎉 Migración y sembrado maestro completado con éxito total en MySQL/MariaDB!");
}

run().catch((err) => {
  console.error("❌ Error ejecutando migración y sembrado:", err);
  process.exit(1);
});
