import "server-only";
import { dbMysql, schema as schemaMysql } from "@/lib/db/mysql";
import { eq, desc } from "drizzle-orm";
import { generarAsientoContable } from "@/lib/contabilidad/motor-asientos";

export interface FiltrosLibroDiario {
  facturaId?: number;
  cuentaPuc?: string;
  fechaInicio?: string;
  fechaFin?: string;
  search?: string;
  estado?: string;
  incluirAnulados?: boolean;
  limit?: number;
  offset?: number;
}

export async function getLibroDiario(filtros?: FiltrosLibroDiario) {
  try {
    const condiciones = [];
    if (filtros?.facturaId) {
      condiciones.push(eq(schemaMysql.facturaAsientos.facturaId, filtros.facturaId));
    }
    if (filtros?.estado) {
      condiciones.push(eq(schemaMysql.facturaAsientos.estado, filtros.estado));
    } else if (!filtros?.incluirAnulados) {
      // Por defecto mostrar únicamente asientos activos vigentes
      condiciones.push(eq(schemaMysql.facturaAsientos.estado, "ACTIVO"));
    }

    const whereClause = condiciones.length === 1 ? condiciones[0] : undefined;

    const asientos = await dbMysql
      .select()
      .from(schemaMysql.facturaAsientos)
      .where(whereClause)
      .orderBy(desc(schemaMysql.facturaAsientos.creadoEn), desc(schemaMysql.facturaAsientos.id))
      .limit(filtros?.limit || 500);

    const pucs = await dbMysql.select().from(schemaMysql.pucCuentas);
    const pucMap = new Map<string, any>();
    pucs.forEach((p) => pucMap.set(p.codigo, p));

    const facturas = await dbMysql.select().from(schemaMysql.facturas);
    const facturaMap = new Map<number, any>();
    facturas.forEach((f) => facturaMap.set(f.id, f));

    const proveedores = await dbMysql.select().from(schemaMysql.proveedores);
    const provMap = new Map<number, any>();
    proveedores.forEach((pr) => provMap.set(pr.id, pr));

    let data = asientos.map((a) => {
      const fact = facturaMap.get(a.facturaId) || null;
      const prov = fact?.proveedorId ? provMap.get(fact.proveedorId) || null : null;
      return {
        ...a,
        estado: a.estado || "ACTIVO",
        anuladoEn: a.anuladoEn || null,
        motivoAnulacion: a.motivoAnulacion || null,
        cuenta: a.cuentaPuc ? pucMap.get(a.cuentaPuc) || null : null,
        factura: fact ? { ...fact, proveedor: prov } : null,
      };
    });

    if (filtros?.fechaInicio) {
      const fIni = new Date(filtros.fechaInicio);
      data = data.filter((d) => new Date(d.creadoEn) >= fIni);
    }

    if (filtros?.fechaFin) {
      const fFin = new Date(filtros.fechaFin);
      fFin.setHours(23, 59, 59, 999);
      data = data.filter((d) => new Date(d.creadoEn) <= fFin);
    }

    if (filtros?.cuentaPuc) {
      data = data.filter((d) => d.cuentaPuc.startsWith(filtros.cuentaPuc!));
    }

    if (filtros?.search && filtros.search.trim() !== "") {
      const q = filtros.search.toLowerCase().trim();
      data = data.filter(
        (d) =>
          d.concepto.toLowerCase().includes(q) ||
          d.cuentaPuc.includes(q) ||
          d.cuenta?.nombre?.toLowerCase().includes(q) ||
          d.factura?.numeroFactura?.toLowerCase().includes(q) ||
          d.factura?.proveedor?.razonSocial?.toLowerCase().includes(q)
      );
    }

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener libro diario";
    console.error("Error en getLibroDiario:", error);
    return { success: false, error: message, data: [] };
  }
}

export interface ItemBalanceComprobacion {
  codigoPuc: string;
  nombreCuenta: string;
  nivel: number;
  naturaleza: "D" | "C";
  totalDebitos: number;
  totalCreditos: number;
  saldoDebito: number;
  saldoCredito: number;
}

export async function getBalanceComprobacion() {
  try {
    const asientos = await dbMysql
      .select()
      .from(schemaMysql.facturaAsientos)
      .where(eq(schemaMysql.facturaAsientos.estado, "ACTIVO"));
    const pucs = await dbMysql.select().from(schemaMysql.pucCuentas);

    const pucMap = new Map<string, any>();
    pucs.forEach((p) => pucMap.set(p.codigo, p));

    // Acumular débitos y créditos por cada cuenta auxiliar con movimientos activos
    const acumulador = new Map<string, { debitos: number; creditos: number }>();

    for (const a of asientos) {
      const actual = acumulador.get(a.cuentaPuc) || { debitos: 0, creditos: 0 };
      actual.debitos += Number(a.debito) || 0;
      actual.creditos += Number(a.credito) || 0;
      acumulador.set(a.cuentaPuc, actual);
    }

    const items: ItemBalanceComprobacion[] = [];
    let sumaTotalDebitos = 0;
    let sumaTotalCreditos = 0;

    for (const [codigo, movs] of acumulador.entries()) {
      const cuenta = pucMap.get(codigo);
      const clase = codigo.charAt(0);
      // Naturaleza habitual: Clases 1 (Activo), 5 (Gasto), 6 (Costo) = Débito (D)
      // Clases 2 (Pasivo), 3 (Patrimonio), 4 (Ingreso) = Crédito (C)
      const naturaleza: "D" | "C" = ["1", "5", "6", "7"].includes(clase) ? "D" : "C";

      let saldoDebito = 0;
      let saldoCredito = 0;

      if (naturaleza === "D") {
        const saldoNeto = movs.debitos - movs.creditos;
        if (saldoNeto >= 0) {
          saldoDebito = saldoNeto;
        } else {
          saldoCredito = Math.abs(saldoNeto);
        }
      } else {
        const saldoNeto = movs.creditos - movs.debitos;
        if (saldoNeto >= 0) {
          saldoCredito = saldoNeto;
        } else {
          saldoDebito = Math.abs(saldoNeto);
        }
      }

      sumaTotalDebitos += movs.debitos;
      sumaTotalCreditos += movs.creditos;

      items.push({
        codigoPuc: codigo,
        nombreCuenta: cuenta?.nombre || "Cuenta Auxiliar",
        nivel: cuenta?.nivel || (codigo.length <= 2 ? 2 : codigo.length <= 4 ? 3 : 4),
        naturaleza,
        totalDebitos: movs.debitos,
        totalCreditos: movs.creditos,
        saldoDebito,
        saldoCredito,
      });
    }

    // Ordenar por código contable ascendente
    items.sort((a, b) => a.codigoPuc.localeCompare(b.codigoPuc));

    const diferencia = Math.abs(sumaTotalDebitos - sumaTotalCreditos);
    const estaCuadrado = diferencia < 0.05;

    return {
      success: true,
      data: {
        cuentas: items,
        totalDebitos: sumaTotalDebitos,
        totalCreditos: sumaTotalCreditos,
        diferencia,
        estaCuadrado,
        totalAsientos: asientos.length,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al calcular balance de comprobación";
    console.error("Error en getBalanceComprobacion:", error);
    return {
      success: false,
      error: message,
      data: {
        cuentas: [],
        totalDebitos: 0,
        totalCreditos: 0,
        diferencia: 0,
        estaCuadrado: true,
        totalAsientos: 0,
      },
    };
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

    // Guardar en transacción en MySQL con Inmutabilidad (No DELETE físico)
    await dbMysql.transaction(async (tx) => {
      // 1. Inmutabilidad Contable: Anular asientos previos de esta factura manteniendo trazabilidad
      await tx
        .update(schemaMysql.facturaAsientos)
        .set({
          estado: "ANULADO",
          anuladoEn: new Date(),
          motivoAnulacion: "Reconciliación y reasiento de comprobante contable",
        })
        .where(eq(schemaMysql.facturaAsientos.facturaId, factura.id));

      // 2. Insertar las nuevas líneas activas en el libro diario
      for (const l of resultado.asientos) {
        await tx.insert(schemaMysql.facturaAsientos).values({
          facturaId: factura.id,
          cuentaPuc: l.cuentaPuc,
          concepto: l.concepto,
          debito: l.debito,
          credito: l.credito,
          estado: "ACTIVO",
        });
      }

      // 3. Actualizar estado contable, estado de pago y medio de pago de la factura
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

/**
 * Sincroniza y genera los asientos contables (Partida Doble NIIF) de todas las facturas
 * del historial consolidado que aún no posean registros activos en el Libro Diario.
 */
export async function sincronizarAsientosFacturasFaltantes() {
  try {
    const facturas = await dbMysql.select().from(schemaMysql.facturas);
    const proveedores = await dbMysql.select().from(schemaMysql.proveedores);
    const provMap = new Map(proveedores.map((p) => [p.id, p]));

    const tiposOp = await dbMysql.select().from(schemaMysql.tiposOperacion);
    const tipoOpMap = new Map(tiposOp.map((t) => [t.id, t]));
    const defaultTipoOp =
      tiposOp.find((t) => t.codigo === "COMPRA_MERCANCIA") ||
      tiposOp.find((t) => t.codigo === "COMPRA_INVENTARIO") ||
      tiposOp[0] ||
      null;

    const cuentasTes = await dbMysql.select().from(schemaMysql.cuentasTesoreria);
    const tesoreriaMap = new Map(cuentasTes.map((c) => [c.id, c]));

    // Obtener los facturaIds que ya tienen asientos ACTIVOS
    const asientosActivos = await dbMysql
      .select({ facturaId: schemaMysql.facturaAsientos.facturaId })
      .from(schemaMysql.facturaAsientos)
      .where(eq(schemaMysql.facturaAsientos.estado, "ACTIVO"));

    const facturasConAsientos = new Set(asientosActivos.map((a) => a.facturaId));

    let sincronizadas = 0;
    let fallidas = 0;

    for (const f of facturas) {
      if (facturasConAsientos.has(f.id)) {
        continue;
      }

      const prov = f.proveedorId ? provMap.get(f.proveedorId) || null : null;
      const tipoOp = (f.tipoOperacionId ? tipoOpMap.get(f.tipoOperacionId) : null) || defaultTipoOp;
      const cuentaTes = f.cuentaTesoreriaId ? tesoreriaMap.get(f.cuentaTesoreriaId) : null;

      if (!tipoOp) {
        fallidas++;
        continue;
      }

      const resultado = generarAsientoContable({
        factura: {
          id: f.id,
          numeroFactura: f.numeroFactura,
          subtotal: f.subtotal || "0.00",
          iva: f.iva || "0.00",
          impoconsumo: f.impoconsumo || "0.00",
          otrosImpuestosTotal: f.otrosImpuestosTotal || "0.00",
          totalFactura: f.totalFactura || "0.00",
          proveedorNombre: prov?.razonSocial || "Proveedor General",
        },
        tipoOperacion: {
          codigo: tipoOp.codigo,
          nombre: tipoOp.nombre,
          cuentaPucDebito: tipoOp.cuentaPucDebito,
          cuentaPucCredito: tipoOp.cuentaPucCredito,
          afectaInventario: tipoOp.afectaInventario,
          esRemision: tipoOp.esRemision,
        },
        cuentaTesoreria: cuentaTes
          ? {
              codigoPuc: cuentaTes.codigoPuc,
              nombreCuenta: cuentaTes.nombreCuenta,
            }
          : null,
      });

      if (resultado.estaBalanceado && resultado.asientos.length > 0) {
        for (const l of resultado.asientos) {
          await dbMysql.insert(schemaMysql.facturaAsientos).values({
            facturaId: f.id,
            cuentaPuc: l.cuentaPuc,
            concepto: l.concepto,
            debito: l.debito,
            credito: l.credito,
            estado: "ACTIVO",
          });
        }
        sincronizadas++;
      } else {
        fallidas++;
      }
    }

    return {
      success: true,
      data: {
        totalFacturas: facturas.length,
        sincronizadas,
        yaExistian: facturas.length - sincronizadas - fallidas,
        fallidas,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al sincronizar asientos contables";
    console.error("Error en sincronizarAsientosFacturasFaltantes:", error);
    return { success: false, error: message };
  }
}
