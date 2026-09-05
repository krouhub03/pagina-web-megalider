
import { asc, desc, eq, sql, inArray } from "drizzle-orm";
import { dbMysql, schema as schemaMysql } from "@/lib/db/mysql";

export interface FiltrosFacturas {
  proveedorId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  busqueda?: string;
  limit?: number;
  offset?: number;
}

export interface FiltrosEgresos {
  categoriaId?: number;
  tipoEgreso?: string;
  fechaInicio?: string;
  fechaFin?: string;
  registradoPor?: string;
  limit?: number;
  offset?: number;
}

// 1. Obtener listado de Facturas de Compras con Proveedor
export async function getFacturas(filtros: FiltrosFacturas = {}) {
  try {
    const data = await dbMysql.query.facturas.findMany({
      orderBy: [desc(schemaMysql.facturas.fechaEmision), desc(schemaMysql.facturas.id)],
      with: { proveedor: true, items: true, archivos: true },
      limit: filtros.limit ?? 50,
      offset: filtros.offset ?? 0,
    });
    
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al obtener facturas:", error);
    return { success: false, error: message, data: null };
  }
}

export async function getFacturaDetalle(facturaId: number) {
  try {
    const data = await dbMysql.query.facturas.findFirst({
      where: eq(schemaMysql.facturas.id, facturaId),
      with: { proveedor: true, items: true, archivos: true }
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`Error al obtener factura #${facturaId}:`, error);
    return { success: false, error: message, data: null };
  }
}

// 2b. Eliminar una factura de compra por su ID
export async function eliminarFactura(facturaId: number) {
  try {
    await dbMysql
      .delete(schemaMysql.facturas)
      .where(eq(schemaMysql.facturas.id, facturaId));
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`Error al eliminar factura #${facturaId}:`, error);
    return { success: false, error: message };
  }
}

// 2c. Actualizar / Corregir datos de una factura de compra por su ID
export interface ActualizarFacturaInput {
  numeroFactura?: string;
  cufe?: string | null;
  documentoReferencia?: string | null;
  fechaEmision?: string;
  fechaVencimiento?: string | null;
  condicionPago?: string | null;
  medioPago?: string | null;
  subtotal?: string;
  iva?: string;
  impoconsumo?: string;
  totalFactura?: string;
  observaciones?: string | null;
}

export async function actualizarFactura(facturaId: number, datos: ActualizarFacturaInput) {
  try {
    await dbMysql
      .update(schemaMysql.facturas)
      .set({
        ...datos,
      })
      .where(eq(schemaMysql.facturas.id, facturaId));
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`Error al actualizar factura #${facturaId}:`, error);
    return { success: false, error: message };
  }
}

export interface CrearFacturaCompletaInput {
  factura: ActualizarFacturaInput & { proveedorId?: number; nitProveedor?: string; razonSocialProveedor?: string };
  items: FacturaItemInput[];
  archivo?: {
    nombreArchivo: string;
    tipoMime: string;
    datosBase64: string;
  };
}

export async function crearFacturaCompleta(datos: CrearFacturaCompletaInput) {
  try {
    let proveedorId = datos.factura.proveedorId;

    if (!proveedorId && datos.factura.nitProveedor && datos.factura.razonSocialProveedor) {
      const provs = await dbMysql.select().from(schemaMysql.proveedores).where(eq(schemaMysql.proveedores.nit, datos.factura.nitProveedor));
      if (provs.length > 0) {
        proveedorId = provs[0].id;
      } else {
        const result = await dbMysql.insert(schemaMysql.proveedores).values({
          nit: datos.factura.nitProveedor,
          razonSocial: datos.factura.razonSocialProveedor,
        });
        proveedorId = result[0].insertId;
      }
    }

    return await dbMysql.transaction(async (tx) => {

      // Crear factura
      const [insertRes] = await tx.insert(schemaMysql.facturas).values(); const nuevaFactura = { id: insertRes.insertId };

      // Crear ítems
      if (datos.items && datos.items.length > 0) {
        await tx.insert(schemaMysql.facturaItems).values(
          datos.items.map(item => ({
            facturaId: nuevaFactura.id,
            nombreProducto: item.nombreProducto || (item as any).descripcion || "",
            cantidadIngresada: item.cantidadIngresada,
            costoUnitarioCompra: item.costoUnitarioCompra,
            costoTotalLinea: item.costoTotalLinea,
            ivaTotal: item.ivaTotal,
            porcentajeIva: item.porcentajeIva,
          }))
        );
      }

      // Guardar archivo si existe
      if (datos.archivo) {
        await tx.insert(schemaMysql.facturaArchivos).values({
          facturaId: nuevaFactura.id,
          nombreArchivo: datos.archivo.nombreArchivo,
          tipoMime: datos.archivo.tipoMime,
          datosBase64: datos.archivo.datosBase64,
        });
      }

      return { success: true, data: nuevaFactura };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al crear factura completa:", error);
    return { success: false, error: message };
  }
}

// 2d. Gestión de Ítems / Productos de la Factura
export interface FacturaItemInput {
  codigoBarras?: string | null;
  codigoProveedor?: string | null;
  descripcion: string;
  cantidadIngresada: string;
  unidadMedida?: string | null;
  costoUnitarioCompra: string;
  descuentoPorProducto?: string;
  ivaTotal?: string;
  porcentajeIva?: string;
  impuestoConsumo?: string;
  otrosImpuestos?: string;
  costoTotalLinea: string;
}

// Función auxiliar para recalcular y sincronizar automáticamente en BD los totales de la factura
export async function recalcularTotalesFactura(facturaId: number) {
  try {
    const items = await dbMysql.query.facturaItems.findMany({
      where: eq(schemaMysql.facturaItems.facturaId, facturaId),
    });

    let subtotalAcum = 0;
    let ivaAcum = 0;
    let impoconsumoAcum = 0;
    let otrosImpAcum = 0;
    let descuentoAcum = 0;
    let totalFacturaAcum = 0;

    for (const item of items) {
      const cant = Number(item.cantidadIngresada || 0);
      const costo = Number(item.costoUnitarioCompra || 0);
      const desc = Number(item.descuentoPorProducto || 0);
      const iva = Number(item.ivaTotal || 0);
      const impo = Number(item.impuestoConsumo || 0);
      const otros = Number(item.otrosImpuestos || 0);
      const totalLinea = Number(item.costoTotalLinea || 0);

      subtotalAcum += (cant * costo) - desc;
      ivaAcum += iva;
      impoconsumoAcum += impo;
      otrosImpAcum += otros;
      descuentoAcum += desc;
      totalFacturaAcum += totalLinea;
    }

    await dbMysql
      .update(schemaMysql.facturas)
      .set({
        subtotal: String(subtotalAcum.toFixed(2)),
        iva: String(ivaAcum.toFixed(2)),
        impoconsumo: String(impoconsumoAcum.toFixed(2)),
        otrosImpuestosTotal: String(otrosImpAcum.toFixed(2)),
        descuentoTotalFactura: String(descuentoAcum.toFixed(2)),
        totalFactura: String(totalFacturaAcum.toFixed(2)),
      })
      .where(eq(schemaMysql.facturas.id, facturaId));

    return { success: true };
  } catch (error) {
    console.error(`Error al recalcular totales para la factura #${facturaId}:`, error);
    return { success: false };
  }
}

export async function actualizarFacturaItem(
  itemId: number,
  datos: Partial<FacturaItemInput>,
  facturaId?: number
) {
  try {
    let targetFacturaId = facturaId;
    if (!targetFacturaId) {
      const itemExistente = await dbMysql.query.facturaItems.findFirst({
        where: eq(schemaMysql.facturaItems.id, itemId),
      });
      targetFacturaId = itemExistente?.facturaId ?? undefined;
    }

    await dbMysql
      .update(schemaMysql.facturaItems)
      .set(datos)
      .where(eq(schemaMysql.facturaItems.id, itemId));

    if (targetFacturaId) {
      await recalcularTotalesFactura(targetFacturaId);
    }
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`Error al actualizar ítem #${itemId}:`, error);
    return { success: false, error: message };
  }
}

export async function crearFacturaItem(facturaId: number, datos: FacturaItemInput) {
  try {
    await dbMysql.insert(schemaMysql.facturaItems).values({
      facturaId,
      ...datos,
    });

    await recalcularTotalesFactura(facturaId);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al crear ítem de factura:", error);
    return { success: false, error: message };
  }
}

export async function eliminarFacturaItem(itemId: number, facturaId?: number) {
  try {
    let targetFacturaId = facturaId;
    if (!targetFacturaId) {
      const itemExistente = await dbMysql.query.facturaItems.findFirst({
        where: eq(schemaMysql.facturaItems.id, itemId),
      });
      targetFacturaId = itemExistente?.facturaId ?? undefined;
    }

    await dbMysql
      .delete(schemaMysql.facturaItems)
      .where(eq(schemaMysql.facturaItems.id, itemId));

    if (targetFacturaId) {
      await recalcularTotalesFactura(targetFacturaId);
    }
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`Error al eliminar ítem #${itemId}:`, error);
    return { success: false, error: message };
  }
}




// 3. Obtener listado de Egresos / Gastos de la Tienda
export async function getEgresos() { return { success: false, data: [], error: 'Migración en progreso' }; }

// 4. Registrar corrección o ajuste manual a un Egreso (Trazabilidad con historial_correcciones)
export async function corregirEgreso(params: any) { return { success: false, error: 'Migración en progreso' }; }

// 5. Métricas y Balance Financiero General
export async function getMetricasContables() { return { success: false, error: 'Migración en progreso', data: {} as any }; }

// 6. Crear un nuevo egreso / gasto de tienda
export interface CrearEgresoInput {
  fechaEgreso: string;
  tipoEgreso: string;
  categoriaId: number;
  codigoPuc?: string | null;
  descripcion: string;
  proveedor?: string | null;
  nitEmisor?: string | null;
  codigoCiiu?: string | null;
  subtotal?: string;
  iva?: string;
  otrosImpuestos?: string;
  totalEgreso: string;
  tieneFactura?: boolean;
  numeroComprobante?: string | null;
  origen?: string;
  registradoPor?: string;
}

export async function crearEgreso(datos: any) { return { success: false, error: 'Migración en progreso' }; }

// 7. Eliminar egreso por ID
export async function eliminarEgreso(egresoId: number) { return { success: false, error: 'Migración en progreso' }; }

// 8. Obtener lista de Categorías de Gastos
export async function getCategoriasGastos() { return { success: false, error: 'Migración en progreso', data: [] }; }

// 9. Obtener Cuentas PUC (Plan Único de Cuentas)
export async function getPucCuentas() { try { const data = await dbMysql.query.pucCuentas.findMany({ orderBy: [asc(schemaMysql.pucCuentas.codigo)] }); return { success: true, data }; } catch (e: any) { return { success: false, error: e.message, data: [] }; } }

