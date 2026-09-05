import "server-only";
import { dbMysql, schema as schemaMysql } from "@/lib/db/mysql";
import { eq, desc } from "drizzle-orm";
import { generarAsientoContable } from "@/lib/contabilidad/motor-asientos";

export async function getLibroDiario(filtros?: { facturaId?: number; limit?: number }) {
  try {
    const asientos = await dbMysql
      .select()
      .from(schemaMysql.facturaAsientos)
      .where(filtros?.facturaId ? eq(schemaMysql.facturaAsientos.facturaId, filtros.facturaId) : undefined)
      .orderBy(desc(schemaMysql.facturaAsientos.creadoEn))
      .limit(filtros?.limit || 100);

    const pucs = await dbMysql.select().from(schemaMysql.pucCuentas);
    const pucMap = new Map<string, any>();
    pucs.forEach((p) => pucMap.set(p.codigo, p));

    const facturas = await dbMysql.select().from(schemaMysql.facturas);
    const facturaMap = new Map<number, any>();
    facturas.forEach((f) => facturaMap.set(f.id, f));

    const proveedores = await dbMysql.select().from(schemaMysql.proveedores);
    const provMap = new Map<number, any>();
    proveedores.forEach((pr) => provMap.set(pr.id, pr));

    const data = asientos.map((a) => {
      const fact = facturaMap.get(a.facturaId) || null;
      const prov = fact?.proveedorId ? provMap.get(fact.proveedorId) || null : null;
      return {
        ...a,
        cuenta: a.cuentaPuc ? pucMap.get(a.cuentaPuc) || null : null,
        factura: fact ? { ...fact, proveedor: prov } : null,
      };
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener libro diario";
    console.error("Error en getLibroDiario:", error);
    return { success: false, error: message, data: [] };
  }
}

export async function conciliarFacturaContable(params: {
  facturaId: number;
  cuentaTesoreriaId?: number | null;
  retencionesIds?: number[];
}) {
  try {
    const factRows = await dbMysql
      .select()
      .from(schemaMysql.facturas)
      .where(eq(schemaMysql.facturas.id, params.facturaId))
      .limit(1);

    const factura = factRows[0] || null;

    if (!factura) {
      return { success: false, error: "Factura no encontrada" };
    }

    const provRows = factura.proveedorId
      ? await dbMysql.select().from(schemaMysql.proveedores).where(eq(schemaMysql.proveedores.id, factura.proveedorId)).limit(1)
      : [];
    const proveedor = provRows[0] || null;

    // Obtener tipo de operación o fallback por defecto (COMPRA_MERCANCIA)
    let tipoOp: any = null;
    if (factura.tipoOperacionId) {
      const tRows = await dbMysql.select().from(schemaMysql.tiposOperacion).where(eq(schemaMysql.tiposOperacion.id, factura.tipoOperacionId)).limit(1);
      tipoOp = tRows[0] || null;
    }
    if (!tipoOp) {
      const tRows = await dbMysql.select().from(schemaMysql.tiposOperacion).where(eq(schemaMysql.tiposOperacion.codigo, "COMPRA_MERCANCIA")).limit(1);
      tipoOp = tRows[0] || null;
    }
    if (!tipoOp) {
      const tRows = await dbMysql.select().from(schemaMysql.tiposOperacion).limit(1);
      tipoOp = tRows[0] || null;
    }

    if (!tipoOp) {
      return { success: false, error: "No se encontró un tipo de operación configurado" };
    }

    // Obtener cuenta de tesorería si se envió
    let cuentaTesoreria: any = null;
    const targetTesoreriaId = params.cuentaTesoreriaId || factura.cuentaTesoreriaId;
    if (targetTesoreriaId) {
      const ctRows = await dbMysql.select().from(schemaMysql.cuentasTesoreria).where(eq(schemaMysql.cuentasTesoreria.id, targetTesoreriaId)).limit(1);
      cuentaTesoreria = ctRows[0] || null;
    }

    // Obtener retenciones si se enviaron
    const retencionesAplicadas = [];
    if (params.retencionesIds && params.retencionesIds.length > 0) {
      for (const rId of params.retencionesIds) {
        const retRows = await dbMysql.select().from(schemaMysql.tiposRetencion).where(eq(schemaMysql.tiposRetencion.id, rId)).limit(1);
        const retTipo = retRows[0];
        if (retTipo) {
          const base = Number(factura.subtotal) || 0;
          const valor = base * (Number(retTipo.porcentaje) / 100);
          retencionesAplicadas.push({
            cuentaPuc: retTipo.cuentaPuc,
            nombreRetencion: retTipo.nombre,
            valorRetenido: valor,
          });
        }
      }
    }

    // Generar el asiento
    const resultado = generarAsientoContable({
      factura: {
        id: factura.id,
        numeroFactura: factura.numeroFactura,
        subtotal: factura.subtotal || "0.00",
        iva: factura.iva || "0.00",
        impoconsumo: factura.impoconsumo || "0.00",
        otrosImpuestosTotal: factura.otrosImpuestosTotal || "0.00",
        totalFactura: factura.totalFactura || "0.00",
        proveedorNombre: proveedor?.razonSocial,
      },
      tipoOperacion: {
        codigo: tipoOp.codigo,
        nombre: tipoOp.nombre,
        cuentaPucDebito: tipoOp.cuentaPucDebito,
        cuentaPucCredito: tipoOp.cuentaPucCredito,
        afectaInventario: tipoOp.afectaInventario,
        esRemision: tipoOp.esRemision,
      },
      cuentaTesoreria: cuentaTesoreria ? {
        codigoPuc: cuentaTesoreria.codigoPuc,
        nombreCuenta: cuentaTesoreria.nombreCuenta,
      } : null,
      retenciones: retencionesAplicadas,
    });

    if (!resultado.estaBalanceado) {
      return { success: false, error: "El asiento contable presenta descuadre aritmético" };
    }

    // Guardar en transacción en MySQL
    await dbMysql.transaction(async (tx) => {
      // Eliminar asientos previos de esta factura si existían
      await tx.delete(schemaMysql.facturaAsientos).where(eq(schemaMysql.facturaAsientos.facturaId, factura.id));

      // Insertar las nuevas líneas en el libro diario
      for (const l of resultado.asientos) {
        await tx.insert(schemaMysql.facturaAsientos).values({
          facturaId: factura.id,
          cuentaPuc: l.cuentaPuc,
          concepto: l.concepto,
          debito: l.debito,
          credito: l.credito,
        });
      }

      // Actualizar estado contable, estado de pago y medio de pago de la factura
      await tx.update(schemaMysql.facturas)
        .set({
          cuentaTesoreriaId: cuentaTesoreria?.id || null,
          ...(cuentaTesoreria?.medioPagoId ? { medioPagoId: cuentaTesoreria.medioPagoId } : {}),
          tipoOperacionId: tipoOp?.id || null,
          estadoContable: cuentaTesoreria ? "CONCILIADA" : "PENDIENTE_CONCILIACION",
          estadoPago: cuentaTesoreria ? "PAGADA" : "PENDIENTE",
        })
        .where(eq(schemaMysql.facturas.id, factura.id));
    });

    return { success: true, data: resultado };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al conciliar factura";
    console.error("Error en conciliarFacturaContable:", error);
    return { success: false, error: message };
  }
}
