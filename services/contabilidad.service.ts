import { dbPostgres, schema } from "@/lib/db/postgres";
import { desc, eq, sql } from "drizzle-orm";

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
    const data = await dbPostgres.query.facturas.findMany({
      orderBy: [desc(schema.facturas.fechaEmision), desc(schema.facturas.id)],
      with: {
        proveedor: true,
        items: true,
      },
      limit: filtros.limit ?? 50,
      offset: filtros.offset ?? 0,
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al obtener facturas:", error);
    return { success: false, error: message, data: [] };
  }
}

// 2. Obtener detalle de una Factura específica con sus Items
export async function getFacturaDetalle(facturaId: number) {
  try {
    const data = await dbPostgres.query.facturas.findFirst({
      where: eq(schema.facturas.id, facturaId),
      with: {
        proveedor: true,
        items: true,
      },
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`Error al obtener factura #${facturaId}:`, error);
    return { success: false, error: message, data: null };
  }
}

// 3. Obtener listado de Egresos / Gastos de la Tienda
export async function getEgresosTienda(filtros: FiltrosEgresos = {}) {
  try {
    const data = await dbPostgres.query.egresosTienda.findMany({
      orderBy: [desc(schema.egresosTienda.fechaEgreso), desc(schema.egresosTienda.id)],
      with: {
        categoria: true,
        puc: true,
        correcciones: {
          orderBy: [desc(schema.historialCorrecciones.corregidoEn)],
        },
      },
      limit: filtros.limit ?? 50,
      offset: filtros.offset ?? 0,
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al obtener egresos:", error);
    return { success: false, error: message, data: [] };
  }
}

// 4. Registrar corrección o ajuste manual a un Egreso (Trazabilidad con historial_correcciones)
export async function corregirEgreso(params: {
  egresoId: number;
  campoModificado: string;
  valorAnterior: string;
  valorNuevo: string;
  motivo: string;
  corregidoPor: string;
}) {
  try {
    const result = await dbPostgres.transaction(async (tx) => {
      // Registrar en la tabla de auditoría
      await tx.insert(schema.historialCorrecciones).values({
        egresoId: params.egresoId,
        campoModificado: params.campoModificado,
        valorAnterior: params.valorAnterior,
        valorNuevo: params.valorNuevo,
        motivo: params.motivo,
        corregidoPor: params.corregidoPor,
      });

      // Actualizar el campo en egresos_tienda si aplica
      const updateData: Partial<typeof schema.egresosTienda.$inferInsert> = {};
      if (params.campoModificado === "total_egreso") {
        updateData.totalEgreso = params.valorNuevo;
      } else if (params.campoModificado === "descripcion") {
        updateData.descripcion = params.valorNuevo;
      } else if (params.campoModificado === "proveedor") {
        updateData.proveedor = params.valorNuevo;
      }

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(schema.egresosTienda)
          .set(updateData)
          .where(eq(schema.egresosTienda.id, params.egresoId));
      }

      return { success: true };
    });

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al corregir egreso:", error);
    return { success: false, error: message };
  }
}

// 5. Métricas y Balance Financiero General
export async function getMetricasContables() {
  try {
    const totalFacturasRes = await dbPostgres
      .select({
        total: sql<string>`COALESCE(SUM(${schema.facturas.totalFactura}), 0)`,
        conteo: sql<number>`COUNT(${schema.facturas.id})`,
      })
      .from(schema.facturas);

    const totalEgresosRes = await dbPostgres
      .select({
        total: sql<string>`COALESCE(SUM(${schema.egresosTienda.totalEgreso}), 0)`,
        conteo: sql<number>`COUNT(${schema.egresosTienda.id})`,
      })
      .from(schema.egresosTienda);

    const egresosHermesRes = await dbPostgres
      .select({
        conteo: sql<number>`COUNT(${schema.egresosTienda.id})`,
      })
      .from(schema.egresosTienda)
      .where(eq(schema.egresosTienda.registradoPor, "Hermes Bot"));

    return {
      success: true,
      data: {
        totalCompras: parseFloat(totalFacturasRes[0]?.total || "0"),
        conteoFacturas: Number(totalFacturasRes[0]?.conteo || 0),
        totalEgresos: parseFloat(totalEgresosRes[0]?.total || "0"),
        conteoEgresos: Number(totalEgresosRes[0]?.conteo || 0),
        egresosPorHermes: Number(egresosHermesRes[0]?.conteo || 0),
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al obtener métricas contables:", error);
    return {
      success: false,
      data: {
        totalCompras: 0,
        conteoFacturas: 0,
        totalEgresos: 0,
        conteoEgresos: 0,
        egresosPorHermes: 0,
      },
      error: message,
    };
  }
}
