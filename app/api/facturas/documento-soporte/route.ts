import { z } from "zod";
import { dbMysql, schema as mysqlSchema } from "@/lib/db/mysql";
import { eq, like, sql, desc, and } from "drizzle-orm";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { generarAsientoContable } from "@/lib/contabilidad/motor-asientos";

export function OPTIONS() {
  return handleCORSPreflight();
}

// 1. Esquema de Validación Zod
const documentoSoporteItemSchema = z.object({
  nombreProducto: z.string().min(1, "El nombre del producto es requerido"),
  codigoBarras: z.string().optional().nullable(),
  cantidadIngresada: z.coerce.number().positive("La cantidad debe ser mayor a cero"),
  unidadMedida: z.string().optional().default("UND"),
  costoUnitarioCompra: z.coerce.number().nonnegative("El costo unitario no puede ser negativo"),
  costoTotalLinea: z.coerce.number().nonnegative("El total de línea no puede ser negativo"),
});

const documentoSoporteSchema = z.object({
  numeroDocumento: z.string().optional().nullable(),
  fechaEmision: z.string().min(1, "La fecha de emisión es requerida"),
  proveedorNit: z.string().min(1, "El NIT o cédula del vendedor es requerido"),
  proveedorNombre: z.string().min(1, "El nombre o razón social del vendedor es requerido"),
  tipoOperacionId: z.coerce.number().optional().nullable(),
  medioPagoId: z.coerce.number().optional().nullable(),
  cuentaTesoreriaId: z.coerce.number().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  subtotal: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().positive("El total debe ser mayor a cero"),
  items: z.array(documentoSoporteItemSchema).min(1, "Debe registrar al menos un producto o concepto"),
});

// GET: Obtener el siguiente consecutivo sugerido y proveedores frecuentes
export async function GET() {
  try {
    // Buscar el último documento soporte con formato DS-
    const ultimosDS = await dbMysql
      .select({ numeroFactura: mysqlSchema.facturas.numeroFactura })
      .from(mysqlSchema.facturas)
      .where(like(mysqlSchema.facturas.numeroFactura, "DS-%"))
      .orderBy(desc(mysqlSchema.facturas.id))
      .limit(20);

    let siguienteNumero = 1;
    for (const doc of ultimosDS) {
      const match = doc.numeroFactura.match(/^DS-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= siguienteNumero) {
          siguienteNumero = num + 1;
        }
      }
    }

    const consecutivoSugerido = `DS-${String(siguienteNumero).padStart(4, "0")}`;

    return apiSuccess({
      consecutivoSugerido,
    });
  } catch (error) {
    console.error("Error al calcular consecutivo de Documento Soporte:", error);
    return apiError("Error interno al obtener consecutivo", 500, "INTERNAL_SERVER_ERROR");
  }
}

// POST: Registrar Documento Soporte
export async function POST(request: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await parseJSONBody(request);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cuerpo JSON inválido";
      return apiError(msg, 400, "BAD_REQUEST");
    }

    const validation = validateSchema(documentoSoporteSchema, rawBody);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const data = validation.data;

    // Determinar consecutivo oficial
    let numeroFinal = data.numeroDocumento?.trim();
    if (!numeroFinal) {
      const ultimosDS = await dbMysql
        .select({ numeroFactura: mysqlSchema.facturas.numeroFactura })
        .from(mysqlSchema.facturas)
        .where(like(mysqlSchema.facturas.numeroFactura, "DS-%"))
        .orderBy(desc(mysqlSchema.facturas.id))
        .limit(20);

      let siguienteNumero = 1;
      for (const doc of ultimosDS) {
        const match = doc.numeroFactura.match(/^DS-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num >= siguienteNumero) {
            siguienteNumero = num + 1;
          }
        }
      }
      numeroFinal = `DS-${String(siguienteNumero).padStart(4, "0")}`;
    }

    // 1. Obtener o crear proveedor informal
    let proveedorId: number;
    const existingProveedor = await dbMysql.query.proveedores.findFirst({
      where: eq(mysqlSchema.proveedores.nit, data.proveedorNit.trim()),
    });

    if (existingProveedor) {
      proveedorId = existingProveedor.id;
    } else {
      const insertProv = await dbMysql.insert(mysqlSchema.proveedores).values({
        nit: data.proveedorNit.trim(),
        razonSocial: data.proveedorNombre.trim(),
      });
      proveedorId = insertProv[0].insertId;
    }

    // 2. Verificar duplicado de consecutivo con el mismo proveedor
    const existingDoc = await dbMysql.query.facturas.findFirst({
      where: and(
        eq(mysqlSchema.facturas.proveedorId, proveedorId),
        eq(mysqlSchema.facturas.numeroFactura, numeroFinal)
      ),
    });

    if (existingDoc) {
      return apiError(
        `Ya existe un documento con número ${numeroFinal} registrado para este proveedor`,
        400,
        "DUPLICATE_DOCUMENT"
      );
    }

    // 3. Obtener tipo de operación contable
    let tipoOp = null;
    if (data.tipoOperacionId) {
      tipoOp = await dbMysql.query.tiposOperacion.findFirst({
        where: eq(mysqlSchema.tiposOperacion.id, data.tipoOperacionId),
      });
    }

    if (!tipoOp) {
      tipoOp = await dbMysql.query.tiposOperacion.findFirst({
        where: eq(mysqlSchema.tiposOperacion.codigo, "COMPRA_INVENTARIO"),
      });
    }

    // 4. Obtener cuenta de tesorería si fue asignada
    let cuentaTesoreria = null;
    if (data.cuentaTesoreriaId) {
      cuentaTesoreria = await dbMysql.query.cuentasTesoreria.findFirst({
        where: eq(mysqlSchema.cuentasTesoreria.id, data.cuentaTesoreriaId),
      });
    }

    // 5. Estado contable y de pago
    const tieneTesoreria = Boolean(cuentaTesoreria);
    const estadoContable = tieneTesoreria ? "CONCILIADA" : "PENDIENTE_CONCILIACION";
    const estadoPago = tieneTesoreria ? "PAGADA" : "PENDIENTE";

    const subtotalStr = data.subtotal > 0 ? data.subtotal.toFixed(2) : data.total.toFixed(2);
    const totalStr = data.total.toFixed(2);

    // 6. Insertar Factura / Documento Soporte
    const insertFacturaResult = await dbMysql.insert(mysqlSchema.facturas).values({
      numeroFactura: numeroFinal,
      tipoDocumento: "Documento Soporte",
      fechaEmision: data.fechaEmision,
      proveedorId: proveedorId,
      tipoOperacionId: tipoOp?.id || null,
      medioPagoId: data.medioPagoId || (cuentaTesoreria ? cuentaTesoreria.medioPagoId : null),
      cuentaTesoreriaId: data.cuentaTesoreriaId || null,
      estadoRemision: "NO_APLICA",
      estadoContable: estadoContable,
      estadoPago: estadoPago,
      condicionPago: tieneTesoreria ? "Contado" : "Crédito",
      subtotal: subtotalStr,
      descuentoTotalFactura: "0.00",
      iva: "0.00",
      impoconsumo: "0.00",
      otrosImpuestosTotal: "0.00",
      totalFactura: totalStr,
      observaciones: data.observaciones || "Documento Soporte a No Obligados a Facturar",
    });

    const facturaId = insertFacturaResult[0].insertId;

    // 7. Insertar Items
    const itemsToInsert = data.items.map((item) => ({
      facturaId: facturaId,
      codigoBarras: item.codigoBarras?.trim() || null,
      nombreProducto: item.nombreProducto.trim(),
      cantidadIngresada: String(item.cantidadIngresada),
      unidadMedida: item.unidadMedida || "UND",
      costoUnitarioCompra: String(item.costoUnitarioCompra),
      descuentoPorProducto: "0.00",
      ivaTotal: "0.00",
      porcentajeIva: "0.00",
      impuestoConsumo: "0.00",
      otrosImpuestos: "0.00",
      costoTotalLinea: String(item.costoTotalLinea),
    }));

    await dbMysql.insert(mysqlSchema.facturaItems).values(itemsToInsert);

    // 8. Sincronizar Stock si afecta inventario
    if (tipoOp?.afectaInventario) {
      for (const item of itemsToInsert) {
        if (item.codigoBarras) {
          await dbMysql
            .update(mysqlSchema.productos)
            .set({
              stockActual: sql`${mysqlSchema.productos.stockActual} + ${Math.round(Number(item.cantidadIngresada))}`,
              precioCompra: String(item.costoUnitarioCompra),
            })
            .where(eq(mysqlSchema.productos.codigoBarras, item.codigoBarras));
        }
      }
    }

    // 9. Generar Asiento Contable Balanceado
    if (tipoOp) {
      const resultadoAsiento = generarAsientoContable({
        factura: {
          id: facturaId,
          numeroFactura: numeroFinal,
          subtotal: subtotalStr,
          iva: "0.00",
          impoconsumo: "0.00",
          otrosImpuestosTotal: "0.00",
          totalFactura: totalStr,
          proveedorNombre: data.proveedorNombre,
        },
        tipoOperacion: {
          codigo: tipoOp.codigo,
          nombre: tipoOp.nombre,
          cuentaPucDebito: tipoOp.cuentaPucDebito,
          cuentaPucCredito: tipoOp.cuentaPucCredito,
          afectaInventario: tipoOp.afectaInventario,
          esRemision: false,
        },
        cuentaTesoreria: cuentaTesoreria
          ? {
              codigoPuc: cuentaTesoreria.codigoPuc,
              nombreCuenta: cuentaTesoreria.nombreCuenta,
            }
          : null,
      });

      if (resultadoAsiento.estaBalanceado) {
        for (const linea of resultadoAsiento.asientos) {
          await dbMysql.insert(mysqlSchema.facturaAsientos).values({
            facturaId: facturaId,
            cuentaPuc: linea.cuentaPuc,
            concepto: linea.concepto,
            debito: linea.debito,
            credito: linea.credito,
          });
        }
      }
    }

    return apiSuccess(
      {
        facturaId,
        numeroDocumento: numeroFinal,
        estadoContable,
        estadoPago,
        mensaje: "Documento Soporte registrado y contabilizado correctamente.",
      },
      201
    );
  } catch (error) {
    console.error("Error al registrar Documento Soporte:", error);
    return apiError("Error interno al procesar el Documento Soporte", 500, "INTERNAL_SERVER_ERROR");
  }
}
