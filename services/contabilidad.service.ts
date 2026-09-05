import { dbPostgres, schema } from "@/lib/db/postgres";
import { asc, desc, eq, sql } from "drizzle-orm";

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
        archivos: true,
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
        archivos: true,
      },
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
    await dbPostgres
      .delete(schema.facturas)
      .where(eq(schema.facturas.id, facturaId));
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
    await dbPostgres
      .update(schema.facturas)
      .set({
        ...datos,
      })
      .where(eq(schema.facturas.id, facturaId));
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
    return await dbPostgres.transaction(async (tx) => {
      let proveedorId = datos.factura.proveedorId;

      // Si no hay proveedorId pero hay NIT, buscar o crear proveedor
      if (!proveedorId && datos.factura.nitProveedor && datos.factura.razonSocialProveedor) {
        const provs = await tx.select().from(schema.proveedores).where(eq(schema.proveedores.nit, datos.factura.nitProveedor));
        if (provs.length > 0) {
          proveedorId = provs[0].id;
        } else {
          const [nuevoProv] = await tx.insert(schema.proveedores).values({
            nit: datos.factura.nitProveedor,
            razonSocial: datos.factura.razonSocialProveedor,
          }).returning();
          proveedorId = nuevoProv.id;
        }
      }

      // Crear factura
      const [nuevaFactura] = await tx.insert(schema.facturas).values({
        numeroFactura: datos.factura.numeroFactura || `F-${Date.now()}`,
        fechaEmision: datos.factura.fechaEmision || new Date().toISOString().split('T')[0],
        proveedorId,
        subtotal: datos.factura.subtotal || "0",
        iva: datos.factura.iva || "0",
        impoconsumo: datos.factura.impoconsumo || "0",
        totalFactura: datos.factura.totalFactura || "0",
      }).returning();

      // Crear ítems
      if (datos.items && datos.items.length > 0) {
        await tx.insert(schema.facturaItems).values(
          datos.items.map(item => ({
            facturaId: nuevaFactura.id,
            descripcion: item.descripcion,
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
        await tx.insert(schema.facturaArchivos).values({
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
    const items = await dbPostgres.query.facturaItems.findMany({
      where: eq(schema.facturaItems.facturaId, facturaId),
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

    await dbPostgres
      .update(schema.facturas)
      .set({
        subtotal: String(subtotalAcum.toFixed(2)),
        iva: String(ivaAcum.toFixed(2)),
        impoconsumo: String(impoconsumoAcum.toFixed(2)),
        otrosImpuestosTotal: String(otrosImpAcum.toFixed(2)),
        descuentoTotalFactura: String(descuentoAcum.toFixed(2)),
        totalFactura: String(totalFacturaAcum.toFixed(2)),
      })
      .where(eq(schema.facturas.id, facturaId));

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
      const itemExistente = await dbPostgres.query.facturaItems.findFirst({
        where: eq(schema.facturaItems.id, itemId),
      });
      targetFacturaId = itemExistente?.facturaId ?? undefined;
    }

    await dbPostgres
      .update(schema.facturaItems)
      .set(datos)
      .where(eq(schema.facturaItems.id, itemId));

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
    await dbPostgres.insert(schema.facturaItems).values({
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
      const itemExistente = await dbPostgres.query.facturaItems.findFirst({
        where: eq(schema.facturaItems.id, itemId),
      });
      targetFacturaId = itemExistente?.facturaId ?? undefined;
    }

    await dbPostgres
      .delete(schema.facturaItems)
      .where(eq(schema.facturaItems.id, itemId));

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
}): Promise<{ success: boolean; error?: string }> {
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
        totalIva: sql<string>`COALESCE(SUM(${schema.egresosTienda.iva}), 0)`,
        totalOtrosImp: sql<string>`COALESCE(SUM(${schema.egresosTienda.otrosImpuestos}), 0)`,
      })
      .from(schema.egresosTienda);

    // Gastos Operativos (Clase 5 PUC o tipo GASTO_OPERATIVO) -> P&G
    const totalGastosPyGRes = await dbPostgres
      .select({
        total: sql<string>`COALESCE(SUM(${schema.egresosTienda.totalEgreso}), 0)`,
        conteo: sql<number>`COUNT(${schema.egresosTienda.id})`,
      })
      .from(schema.egresosTienda)
      .where(
        sql`${schema.egresosTienda.tipoEgreso} IN ('GASTO_OPERATIVO', 'GASTO', 'GASTO OPERATIVO') OR ${schema.egresosTienda.codigoPuc} LIKE '5%'`
      );

    // Inversiones (Activos Fijos) y Pago de Pasivos / Deudas
    const totalInversionesRes = await dbPostgres
      .select({
        total: sql<string>`COALESCE(SUM(${schema.egresosTienda.totalEgreso}), 0)`,
        conteo: sql<number>`COUNT(${schema.egresosTienda.id})`,
      })
      .from(schema.egresosTienda)
      .where(
        sql`${schema.egresosTienda.tipoEgreso} IN ('ACTIVO_FIJO', 'PAGO_DEUDA', 'ACTIVO', 'DEUDA') OR ${schema.egresosTienda.codigoPuc} LIKE '15%' OR ${schema.egresosTienda.codigoPuc} LIKE '2%'`
      );

    const egresosHermesRes = await dbPostgres
      .select({
        conteo: sql<number>`COUNT(${schema.egresosTienda.id})`,
      })
      .from(schema.egresosTienda)
      .where(
        sql`LOWER(${schema.egresosTienda.registradoPor}) LIKE '%hermes%' OR LOWER(${schema.egresosTienda.origen}) LIKE '%hermes%' OR LOWER(${schema.egresosTienda.registradoPor}) LIKE '%bot%'`
      );

    return {
      success: true,
      data: {
        totalCompras: parseFloat(totalFacturasRes[0]?.total || "0"),
        conteoFacturas: Number(totalFacturasRes[0]?.conteo || 0),
        totalEgresos: parseFloat(totalEgresosRes[0]?.total || "0"),
        conteoEgresos: Number(totalEgresosRes[0]?.conteo || 0),
        totalGastosPyG: parseFloat(totalGastosPyGRes[0]?.total || "0"),
        conteoGastosPyG: Number(totalGastosPyGRes[0]?.conteo || 0),
        totalInversionesDeuda: parseFloat(totalInversionesRes[0]?.total || "0"),
        conteoInversionesDeuda: Number(totalInversionesRes[0]?.conteo || 0),
        totalIvaDescontable: parseFloat(totalEgresosRes[0]?.totalIva || "0"),
        totalOtrosImpuestos: parseFloat(totalEgresosRes[0]?.totalOtrosImp || "0"),
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
        totalGastosPyG: 0,
        conteoGastosPyG: 0,
        totalInversionesDeuda: 0,
        conteoInversionesDeuda: 0,
        totalIvaDescontable: 0,
        totalOtrosImpuestos: 0,
        egresosPorHermes: 0,
      },
      error: message,
    };
  }
}

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

export async function crearEgreso(datos: CrearEgresoInput) {
  try {
    const [nuevoEgreso] = await dbPostgres
      .insert(schema.egresosTienda)
      .values({
        fechaEgreso: datos.fechaEgreso,
        tipoEgreso: datos.tipoEgreso,
        categoriaId: datos.categoriaId,
        codigoPuc: datos.codigoPuc || null,
        descripcion: datos.descripcion,
        proveedor: datos.proveedor || null,
        nitEmisor: datos.nitEmisor || null,
        codigoCiiu: datos.codigoCiiu || null,
        subtotal: datos.subtotal || "0",
        iva: datos.iva || "0",
        otrosImpuestos: datos.otrosImpuestos || "0",
        totalEgreso: datos.totalEgreso,
        tieneFactura: datos.tieneFactura ?? false,
        numeroComprobante: datos.numeroComprobante || null,
        origen: datos.origen || "manual",
        registradoPor: datos.registradoPor || "Manual",
      })
      .returning();

    return { success: true, data: nuevoEgreso };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al crear egreso:", error);
    return { success: false, error: message };
  }
}

// 7. Eliminar egreso por ID
export async function eliminarEgreso(egresoId: number) {
  try {
    await dbPostgres
      .delete(schema.egresosTienda)
      .where(eq(schema.egresosTienda.id, egresoId));
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`Error al eliminar egreso #${egresoId}:`, error);
    return { success: false, error: message };
  }
}

// 8. Obtener lista de Categorías de Gastos
export async function getCategoriasGastos() {
  try {
    const data = await dbPostgres.query.categoriasGastos.findMany({
      orderBy: [asc(schema.categoriasGastos.nombre)],
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al obtener categorías de gastos:", error);
    return { success: false, error: message, data: [] };
  }
}

// 9. Obtener Cuentas PUC (Plan Único de Cuentas)
export async function getPucCuentas() {
  try {
    const data = await dbPostgres.query.pucCuentas.findMany({
      orderBy: [asc(schema.pucCuentas.codigo)],
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error al obtener cuentas PUC:", error);
    return { success: false, error: message, data: [] };
  }
}

