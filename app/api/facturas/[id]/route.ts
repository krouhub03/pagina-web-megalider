import { NextRequest, NextResponse } from "next/server";
import { dbMysql, schema } from "@/lib/db/mysql";
import { eq, inArray } from "drizzle-orm";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody } from "@/lib/api/validation";
import { generarAsientoContable } from "@/lib/contabilidad/motor-asientos";

export function OPTIONS() {
  return handleCORSPreflight();
}

// GET /api/facturas/[id] - Obtener detalle completo de la factura
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const facturaId = parseInt(params.id);

    if (isNaN(facturaId)) {
      return apiError("ID de factura inválido", 400, "BAD_REQUEST");
    }

    const [factura] = await dbMysql
      .select()
      .from(schema.facturas)
      .where(eq(schema.facturas.id, facturaId))
      .limit(1);

    if (!factura) {
      return apiError("Factura no encontrada", 404, "NOT_FOUND");
    }

    const [proveedor] = factura.proveedorId
      ? await dbMysql.select().from(schema.proveedores).where(eq(schema.proveedores.id, factura.proveedorId)).limit(1)
      : [null];

    const [tipoOp] = factura.tipoOperacionId
      ? await dbMysql.select().from(schema.tiposOperacion).where(eq(schema.tiposOperacion.id, factura.tipoOperacionId)).limit(1)
      : [null];

    const [medioPago] = factura.medioPagoId
      ? await dbMysql.select().from(schema.mediosPago).where(eq(schema.mediosPago.id, factura.medioPagoId)).limit(1)
      : [null];

    const [cuentaTes] = factura.cuentaTesoreriaId
      ? await dbMysql.select().from(schema.cuentasTesoreria).where(eq(schema.cuentasTesoreria.id, factura.cuentaTesoreriaId)).limit(1)
      : [null];

    const items = await dbMysql
      .select()
      .from(schema.facturaItems)
      .where(eq(schema.facturaItems.facturaId, facturaId));

    const retenciones = await dbMysql
      .select()
      .from(schema.facturaRetenciones)
      .where(eq(schema.facturaRetenciones.facturaId, facturaId));

    const asientos = await dbMysql
      .select()
      .from(schema.facturaAsientos)
      .where(eq(schema.facturaAsientos.facturaId, facturaId));

    const archivos = await dbMysql
      .select()
      .from(schema.facturaArchivos)
      .where(eq(schema.facturaArchivos.facturaId, facturaId));

    return apiSuccess({
      ...factura,
      proveedor,
      tipoOperacion: tipoOp,
      medioPagoRel: medioPago,
      cuentaTesoreria: cuentaTes,
      items,
      retenciones,
      asientos,
      archivos,
    }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("Error al obtener factura:", err);
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}

// PUT /api/facturas/[id] - Actualizar/Modificar datos de la factura e ítems
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const facturaId = parseInt(params.id);

    if (isNaN(facturaId)) {
      return apiError("ID de factura inválido", 400, "BAD_REQUEST");
    }

    let body: any;
    try {
      body = await parseJSONBody(request);
    } catch {
      return apiError("Cuerpo JSON inválido", 400, "BAD_REQUEST");
    }

    const [facturaExistente] = await dbMysql
      .select()
      .from(schema.facturas)
      .where(eq(schema.facturas.id, facturaId))
      .limit(1);

    if (!facturaExistente) {
      return apiError("Factura no encontrada", 404, "NOT_FOUND");
    }

    const res = await dbMysql.transaction(async (tx) => {
      // 1. Manejo de ítems si se envían
      let nuevoSubtotal = Number(body.subtotal ?? facturaExistente.subtotal ?? 0);
      let nuevoIva = Number(body.iva ?? facturaExistente.iva ?? 0);
      let nuevoImpoconsumo = Number(body.impoconsumo ?? facturaExistente.impoconsumo ?? 0);
      let nuevoOtrosImp = Number(body.otrosImpuestosTotal ?? facturaExistente.otrosImpuestosTotal ?? 0);
      let nuevoTotal = Number(body.totalFactura ?? facturaExistente.totalFactura ?? 0);

      if (Array.isArray(body.items)) {
        // Eliminar ítems existentes
        await tx.delete(schema.facturaItems).where(eq(schema.facturaItems.facturaId, facturaId));

        if (body.items.length > 0) {
          let calcSubtotal = 0;
          let calcIva = 0;
          let calcImpo = 0;
          let calcOtros = 0;
          let calcTotal = 0;

          const itemsToInsert = body.items.map((item: any) => {
            const cant = Number(item.cantidadIngresada || item.cantidad || 1);
            const costo = Number(item.costoUnitarioCompra || item.costoUnitario || 0);
            const desc = Number(item.descuentoPorProducto || 0);
            const iva = Number(item.ivaTotal || item.iva || 0);
            const impo = Number(item.impuestoConsumo || item.impoconsumo || 0);
            const otros = Number(item.otrosImpuestos || 0);
            const totalLin = Number(item.costoTotalLinea || (cant * costo - desc + iva + impo + otros));

            calcSubtotal += (cant * costo) - desc;
            calcIva += iva;
            calcImpo += impo;
            calcOtros += otros;
            calcTotal += totalLin;

            return {
              facturaId,
              nombreProducto: item.nombreProducto || item.descripcion || "Ítem de compra",
              codigoBarras: item.codigoBarras || null,
              codigoProveedor: item.codigoProveedor || null,
              cantidadIngresada: String(cant),
              unidadMedida: item.unidadMedida || null,
              costoUnitarioCompra: String(costo.toFixed(2)),
              descuentoPorProducto: String(desc.toFixed(2)),
              ivaTotal: String(iva.toFixed(2)),
              porcentajeIva: String(item.porcentajeIva || "19.00"),
              impuestoConsumo: String(impo.toFixed(2)),
              otrosImpuestos: String(otros.toFixed(2)),
              costoTotalLinea: String(totalLin.toFixed(2)),
            };
          });

          await tx.insert(schema.facturaItems).values(itemsToInsert);

          nuevoSubtotal = calcSubtotal;
          nuevoIva = calcIva;
          nuevoImpoconsumo = calcImpo;
          nuevoOtrosImp = calcOtros;
          nuevoTotal = calcTotal;
        }
      }

      // 2. Actualizar cabecera de la factura
      const updateData: any = {};
      if (body.numeroFactura !== undefined) updateData.numeroFactura = body.numeroFactura.trim();
      if (body.tipoDocumento !== undefined) updateData.tipoDocumento = body.tipoDocumento;
      if (body.fechaEmision !== undefined) updateData.fechaEmision = body.fechaEmision;
      if (body.fechaVencimiento !== undefined) updateData.fechaVencimiento = body.fechaVencimiento || null;
      if (body.cufe !== undefined) updateData.cufe = body.cufe?.trim() || null;
      if (body.documentoReferencia !== undefined) updateData.documentoReferencia = body.documentoReferencia?.trim() || null;
      if (body.tipoOperacionId !== undefined) updateData.tipoOperacionId = body.tipoOperacionId ? Number(body.tipoOperacionId) : null;
      if (body.medioPagoId !== undefined) updateData.medioPagoId = body.medioPagoId ? Number(body.medioPagoId) : null;
      if (body.cuentaTesoreriaId !== undefined) updateData.cuentaTesoreriaId = body.cuentaTesoreriaId ? Number(body.cuentaTesoreriaId) : null;
      if (body.observaciones !== undefined) updateData.observaciones = body.observaciones?.trim() || null;

      updateData.subtotal = String(nuevoSubtotal.toFixed(2));
      updateData.iva = String(nuevoIva.toFixed(2));
      updateData.impoconsumo = String(nuevoImpoconsumo.toFixed(2));
      updateData.otrosImpuestosTotal = String(nuevoOtrosImp.toFixed(2));
      updateData.totalFactura = String(nuevoTotal.toFixed(2));

      await tx.update(schema.facturas).set(updateData).where(eq(schema.facturas.id, facturaId));

      // 3. Sincronizar Asientos de Partida Doble en el Libro Diario
      const targetTipoOpId = updateData.tipoOperacionId || facturaExistente.tipoOperacionId;
      const targetTesoreriaId = updateData.cuentaTesoreriaId || facturaExistente.cuentaTesoreriaId;

      const [tipoOp] = targetTipoOpId
        ? await tx.select().from(schema.tiposOperacion).where(eq(schema.tiposOperacion.id, targetTipoOpId)).limit(1)
        : [null];

      const [cuentaTes] = targetTesoreriaId
        ? await tx.select().from(schema.cuentasTesoreria).where(eq(schema.cuentasTesoreria.id, targetTesoreriaId)).limit(1)
        : [null];

      const [prov] = facturaExistente.proveedorId
        ? await tx.select().from(schema.proveedores).where(eq(schema.proveedores.id, facturaExistente.proveedorId)).limit(1)
        : [null];

      if (tipoOp) {
        const resultadoAsientos = generarAsientoContable({
          factura: {
            id: facturaId,
            numeroFactura: updateData.numeroFactura || facturaExistente.numeroFactura,
            subtotal: nuevoSubtotal,
            iva: nuevoIva,
            impoconsumo: nuevoImpoconsumo,
            otrosImpuestosTotal: nuevoOtrosImp,
            totalFactura: nuevoTotal,
            proveedorNombre: prov?.razonSocial,
          },
          tipoOperacion: {
            codigo: tipoOp.codigo,
            nombre: tipoOp.nombre,
            cuentaPucDebito: tipoOp.cuentaPucDebito,
            cuentaPucCredito: tipoOp.cuentaPucCredito,
            afectaInventario: tipoOp.afectaInventario,
            esRemision: tipoOp.esRemision,
          },
          cuentaTesoreria: cuentaTes ? {
            codigoPuc: cuentaTes.codigoPuc,
            nombreCuenta: cuentaTes.nombreCuenta,
          } : null,
        });

        if (resultadoAsientos.estaBalanceado) {
          // Reemplazar asientos
          await tx.delete(schema.facturaAsientos).where(eq(schema.facturaAsientos.facturaId, facturaId));

          for (const a of resultadoAsientos.asientos) {
            await tx.insert(schema.facturaAsientos).values({
              facturaId,
              cuentaPuc: a.cuentaPuc,
              concepto: a.concepto,
              debito: a.debito,
              credito: a.credito,
            });
          }
        }
      }

      return { id: facturaId, total: nuevoTotal };
    });

    return apiSuccess(res, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al actualizar factura";
    console.error("Error en PUT /api/facturas/[id]:", err);
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}

// DELETE /api/facturas/[id] - Eliminar factura y sus registros asociados en cascada
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const facturaId = parseInt(params.id);

    if (isNaN(facturaId)) {
      return apiError("ID de factura inválido", 400, "BAD_REQUEST");
    }

    const [facturaExistente] = await dbMysql
      .select()
      .from(schema.facturas)
      .where(eq(schema.facturas.id, facturaId))
      .limit(1);

    if (!facturaExistente) {
      return apiError("Factura no encontrada", 404, "NOT_FOUND");
    }

    await dbMysql.transaction(async (tx) => {
      // 1. Eliminar asientos contables
      await tx.delete(schema.facturaAsientos).where(eq(schema.facturaAsientos.facturaId, facturaId));

      // 2. Eliminar retenciones
      await tx.delete(schema.facturaRetenciones).where(eq(schema.facturaRetenciones.facturaId, facturaId));

      // 3. Eliminar ítems
      await tx.delete(schema.facturaItems).where(eq(schema.facturaItems.facturaId, facturaId));

      // 4. Eliminar archivos
      await tx.delete(schema.facturaArchivos).where(eq(schema.facturaArchivos.facturaId, facturaId));

      // 5. Eliminar factura principal
      await tx.delete(schema.facturas).where(eq(schema.facturas.id, facturaId));
    });

    return apiSuccess({ message: "Factura y asientos eliminados correctamente", id: facturaId }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al eliminar factura";
    console.error("Error en DELETE /api/facturas/[id]:", err);
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}
