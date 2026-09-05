import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { dbMysql, schema } from "@/lib/db/mysql";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🌱 Iniciando sembrado maestro de Contabilidad y Tesorería...");

  // 1. Cuentas PUC Esenciales
  const cuentasPucBase = [
    { codigo: "110505", nombre: "Caja General", nivel: 3, naturaleza: "D", descripcion: "Efectivo en mostrador y cajas" },
    { codigo: "11050501", nombre: "Caja Mostrador 1", nivel: 4, naturaleza: "D", descripcion: "Caja principal tienda física" },
    { codigo: "11050502", nombre: "Caja Auxiliar POS", nivel: 4, naturaleza: "D", descripcion: "Caja 2 auxiliar" },
    { codigo: "110510", nombre: "Cajas Menores", nivel: 3, naturaleza: "D", descripcion: "Fondo fijo de gastos menores" },
    { codigo: "11051001", nombre: "Caja Menor Gerencia", nivel: 4, naturaleza: "D", descripcion: "Fondo de emergencia y gastos diarios" },
    { codigo: "111005", nombre: "Bancos Moneda Nacional", nivel: 3, naturaleza: "D", descripcion: "Cuentas bancarias corrientes y de ahorros" },
    { codigo: "11100501", nombre: "Bancolombia Cta Ahorros", nivel: 4, naturaleza: "D", descripcion: "Cuenta principal de recaudos y pagos" },
    { codigo: "11100502", nombre: "Nequi Cigarrería Megalider", nivel: 4, naturaleza: "D", descripcion: "Billetera digital de pagos rápidos" },
    { codigo: "11100503", nombre: "Daviplata Megalider", nivel: 4, naturaleza: "D", descripcion: "Billetera digital auxiliar" },
    { codigo: "130505", nombre: "Clientes Nacionales", nivel: 3, naturaleza: "D", descripcion: "Cuentas por cobrar a clientes" },
    { codigo: "130510", nombre: "Deudores Datáfonos y Pasarelas", nivel: 3, naturaleza: "D", descripcion: "Fondos en tránsito por tarjetas" },
    { codigo: "1435", nombre: "Mercancías no Fabricadas por la Empresa", nivel: 2, naturaleza: "D", descripcion: "Inventario de licores, cigarrillos, confitería y bebidas" },
    { codigo: "143505", nombre: "Inventario General de Mercancías", nivel: 3, naturaleza: "D", descripcion: "Stock oficial para la venta" },
    { codigo: "152405", nombre: "Muebles y Enseres del Local", nivel: 3, naturaleza: "D", descripcion: "Vitrinas, mostradores y estanterías" },
    { codigo: "152805", nombre: "Equipos de Computación y Comunicación", nivel: 3, naturaleza: "D", descripcion: "Computadores, cámaras, impresoras POS" },
    { codigo: "220505", nombre: "Proveedores Nacionales", nivel: 3, naturaleza: "C", descripcion: "Cuentas por pagar a distribuidores y terceros" },
    { codigo: "220595", nombre: "Mercancías por Facturar (Provisiones)", nivel: 3, naturaleza: "C", descripcion: "Cuenta transitoria para remisiones de compra" },
    { codigo: "233595", nombre: "Otros Costos y Gastos por Pagar", nivel: 3, naturaleza: "C", descripcion: "Acreedores varios y servicios" },
    { codigo: "236540", nombre: "Retención en la Fuente - Compras 2.5%", nivel: 3, naturaleza: "C", descripcion: "Retenciones fiscales a proveedores" },
    { codigo: "236525", nombre: "Retención en la Fuente - Servicios 3.5%", nivel: 3, naturaleza: "C", descripcion: "Retenciones por servicios y honorarios" },
    { codigo: "236701", nombre: "Retención de IVA (ReteIVA 15%)", nivel: 3, naturaleza: "C", descripcion: "Retención de IVA practicada" },
    { codigo: "236801", nombre: "Retención de ICA (ReteICA)", nivel: 3, naturaleza: "C", descripcion: "Retención de Impuesto de Industria y Comercio" },
    { codigo: "240801", nombre: "IVA Generado en Ventas (19% / 5%)", nivel: 3, naturaleza: "C", descripcion: "Impuesto sobre las ventas recaudado" },
    { codigo: "240802", nombre: "IVA Descontable en Compras", nivel: 3, naturaleza: "D", descripcion: "Crédito tributario por compras a proveedores" },
    { codigo: "240810", nombre: "Impuesto Nacional al Consumo (ICO)", nivel: 3, naturaleza: "D", descripcion: "Impuesto al consumo en licores y cerveza" },
    { codigo: "4135", nombre: "Comercio al por Mayor y al por Menor", nivel: 2, naturaleza: "C", descripcion: "Ingresos operacionales por venta de mercancía" },
    { codigo: "413505", nombre: "Ventas de Licores y Cigarrería", nivel: 3, naturaleza: "C", descripcion: "Ingresos por ventas en mostrador y web" },
    { codigo: "5120", nombre: "Arrendamientos del Local", nivel: 2, naturaleza: "D", descripcion: "Canon de arrendamiento del establecimiento" },
    { codigo: "5135", nombre: "Servicios Operativos y Públicos", nivel: 2, naturaleza: "D", descripcion: "Energía, acueducto, internet, telefonía" },
    { codigo: "513525", nombre: "Acueducto y Alcantarillado", nivel: 3, naturaleza: "D", descripcion: "Servicios públicos básicos" },
    { codigo: "513530", nombre: "Energía Eléctrica", nivel: 3, naturaleza: "D", descripcion: "Consumo de energía neveras y local" },
    { codigo: "513550", nombre: "Transporte, Fletes y Acarreos", nivel: 3, naturaleza: "D", descripcion: "Domicilios y transporte de mercancía" },
    { codigo: "5145", nombre: "Mantenimiento y Reparaciones", nivel: 2, naturaleza: "D", descripcion: "Reparación de vitrinas, pintura, plomería" },
    { codigo: "514510", nombre: "Mantenimiento Instalaciones del Local", nivel: 3, naturaleza: "D", descripcion: "Arreglos locativos de la cigarrería" },
    { codigo: "519525", nombre: "Elementos de Aseo y Cafetería", nivel: 3, naturaleza: "D", descripcion: "Desechables, bolsas, jabón, suministros" },
    { codigo: "530515", nombre: "Comisiones y Gastos Bancarios / Datáfonos", nivel: 3, naturaleza: "D", descripcion: "Comisiones por pasarelas y terminales POS" },
  ];

  for (const c of cuentasPucBase) {
    const existe = await dbMysql.query.pucCuentas.findFirst({ where: eq(schema.pucCuentas.codigo, c.codigo) });
    if (!existe) {
      await dbMysql.insert(schema.pucCuentas).values(c);
      console.log(`  ➕ Cuenta PUC creada: ${c.codigo} - ${c.nombre}`);
    }
  }

  // 2. Medios de Pago Macro
  const mediosPagoBase = [
    { codigo: "EFECTIVO", nombre: "Efectivo" },
    { codigo: "TRANSFERENCIA", nombre: "Transferencia / Digital" },
    { codigo: "TARJETA", nombre: "Tarjeta Débito / Crédito (Datáfono)" },
    { codigo: "CREDITO", nombre: "Crédito a Proveedor (30 Días)" },
  ];

  const mapaMediosPago: Record<string, number> = {};

  for (const mp of mediosPagoBase) {
    const existe = await dbMysql.query.mediosPago.findFirst({ where: eq(schema.mediosPago.nombre, mp.nombre) });
    if (!existe) {
      const [res] = await dbMysql.insert(schema.mediosPago).values(mp);
      mapaMediosPago[mp.codigo] = res.insertId;
      console.log(`  ➕ Medio de Pago creado: ${mp.nombre}`);
    } else {
      mapaMediosPago[mp.codigo] = existe.id;
    }
  }

  // 3. Cuentas de Tesorería Específicas
  const cuentasTesoreriaBase = [
    { medioPagoCodigo: "EFECTIVO", codigoPuc: "11050501", nombreCuenta: "Caja Principal Mostrador 1", numeroReferencia: "POS-01" },
    { medioPagoCodigo: "EFECTIVO", codigoPuc: "11050502", nombreCuenta: "Caja Auxiliar Mostrador 2", numeroReferencia: "POS-02" },
    { medioPagoCodigo: "EFECTIVO", codigoPuc: "11051001", nombreCuenta: "Caja Menor (Fondo Fijo)", numeroReferencia: "CM-01" },
    { medioPagoCodigo: "TRANSFERENCIA", codigoPuc: "11100501", nombreCuenta: "Bancolombia Cuenta Ahorros", numeroReferencia: "AH-8492" },
    { medioPagoCodigo: "TRANSFERENCIA", codigoPuc: "11100502", nombreCuenta: "Nequi Cigarrería Megalider", numeroReferencia: "NQ-3001" },
    { medioPagoCodigo: "TRANSFERENCIA", codigoPuc: "11100503", nombreCuenta: "Daviplata Tienda", numeroReferencia: "DP-3002" },
    { medioPagoCodigo: "TARJETA", codigoPuc: "130510", nombreCuenta: "Datáfono Redeban / Bold", numeroReferencia: "TER-01" },
  ];

  for (const ct of cuentasTesoreriaBase) {
    const medioId = mapaMediosPago[ct.medioPagoCodigo];
    if (medioId) {
      const existe = await dbMysql.query.cuentasTesoreria.findFirst({
        where: eq(schema.cuentasTesoreria.nombreCuenta, ct.nombreCuenta),
      });
      if (!existe) {
        await dbMysql.insert(schema.cuentasTesoreria).values({
          medioPagoId: medioId,
          codigoPuc: ct.codigoPuc,
          nombreCuenta: ct.nombreCuenta,
          numeroReferencia: ct.numeroReferencia,
          activo: true,
        });
        console.log(`  ➕ Cuenta de Tesorería creada: ${ct.nombreCuenta} (${ct.codigoPuc})`);
      }
    }
  }

  // 4. Tipos de Operación Contable
  const tiposOperacionBase = [
    {
      codigo: "COMPRA_INVENTARIO",
      nombre: "📦 Compra de Mercancía (Inventario para Venta)",
      descripcion: "Licores, cigarrillos, confitería, snacks y bebidas para el stock de tienda",
      cuentaPucDebito: "143505",
      cuentaPucCredito: "220505",
      afectaInventario: true,
      esRemision: false,
    },
    {
      codigo: "COMPRA_ACTIVO_FIJO",
      nombre: "💻 Compra de Activo Fijo (Cómputo, Muebles o Neveras)",
      descripcion: "Bienes durables para el local (no para venta)",
      cuentaPucDebito: "152805",
      cuentaPucCredito: "233595",
      afectaInventario: false,
      esRemision: false,
    },
    {
      codigo: "REPARACION_LOCAL",
      nombre: "🛠️ Mantenimiento y Reparación del Local",
      descripcion: "Arreglos locativos, pintura, plomería y reparación de vitrinas",
      cuentaPucDebito: "514510",
      cuentaPucCredito: "233595",
      afectaInventario: false,
      esRemision: false,
    },
    {
      codigo: "SERVICIOS_PUBLICOS",
      nombre: "💡 Servicios Públicos y Comunicaciones",
      descripcion: "Facturas de luz, agua, internet, telefonía del local",
      cuentaPucDebito: "513525",
      cuentaPucCredito: "233595",
      afectaInventario: false,
      esRemision: false,
    },
    {
      codigo: "REMISION_MERCANCIA",
      nombre: "📦 Remisión de Mercancía (Ingreso Provisional)",
      descripcion: "Entrega física de proveedor antes de la factura oficial",
      cuentaPucDebito: "143505",
      cuentaPucCredito: "220595",
      afectaInventario: true,
      esRemision: true,
    },
    {
      codigo: "ELEMENTOS_ASEO",
      nombre: "🧹 Elementos de Aseo y Cafetería",
      descripcion: "Bolsas, desechables, jabón, implementos de limpieza",
      cuentaPucDebito: "519525",
      cuentaPucCredito: "233595",
      afectaInventario: false,
      esRemision: false,
    },
  ];

  for (const to of tiposOperacionBase) {
    const existe = await dbMysql.query.tiposOperacion.findFirst({
      where: eq(schema.tiposOperacion.codigo, to.codigo),
    });
    if (!existe) {
      await dbMysql.insert(schema.tiposOperacion).values(to);
      console.log(`  ➕ Tipo de Operación creado: ${to.nombre}`);
    }
  }

  // 5. Tipos de Retención en la Fuente
  const tiposRetencionBase = [
    { codigo: "RTEFTE_COMPRAS_25", nombre: "Retención en la Fuente Compras (2.5%)", porcentaje: "2.50", baseMinima: "1136000.00", cuentaPuc: "236540" },
    { codigo: "RTEFTE_COMPRAS_35", nombre: "Retención en la Fuente No Declarantes (3.5%)", porcentaje: "3.50", baseMinima: "1136000.00", cuentaPuc: "236540" },
    { codigo: "RTEFTE_SERVICIOS_40", nombre: "Retención en la Fuente Servicios (4.0%)", porcentaje: "4.00", baseMinima: "189000.00", cuentaPuc: "236525" },
    { codigo: "RETE_IVA_15", nombre: "Retención de IVA (15% del IVA)", porcentaje: "15.00", baseMinima: "0.00", cuentaPuc: "236701" },
    { codigo: "RETE_ICA_1104", nombre: "Retención de ICA Comercial (11.04 x 1000)", porcentaje: "1.10", baseMinima: "0.00", cuentaPuc: "236801" },
  ];

  for (const tr of tiposRetencionBase) {
    const existe = await dbMysql.query.tiposRetencion.findFirst({
      where: eq(schema.tiposRetencion.codigo, tr.codigo),
    });
    if (!existe) {
      await dbMysql.insert(schema.tiposRetencion).values(tr);
      console.log(`  ➕ Tipo de Retención creado: ${tr.nombre}`);
    }
  }

  console.log("✅ Sembrado maestro completado con éxito.");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Error en sembrado maestro:", e);
  process.exit(1);
});
