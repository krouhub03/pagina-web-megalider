import "server-only";
import { dbMysql, schema as schemaMysql } from "@/lib/db/mysql";
import { eq, asc } from "drizzle-orm";

export async function getMediosPago(soloActivos = true) {
  try {
    const medios = await dbMysql
      .select()
      .from(schemaMysql.mediosPago)
      .where(soloActivos ? eq(schemaMysql.mediosPago.activo, true) : undefined)
      .orderBy(asc(schemaMysql.mediosPago.nombre));

    const cuentas = await dbMysql
      .select()
      .from(schemaMysql.cuentasTesoreria)
      .where(soloActivos ? eq(schemaMysql.cuentasTesoreria.activo, true) : undefined);

    const pucs = await dbMysql.select().from(schemaMysql.pucCuentas);
    const pucMap = new Map<string, any>();
    pucs.forEach((p) => pucMap.set(p.codigo, p));

    const cuentasConPuc = cuentas.map((c) => ({
      ...c,
      cuentaPuc: c.codigoPuc ? pucMap.get(c.codigoPuc) || null : null,
    }));

    const data = medios.map((m) => ({
      ...m,
      cuentasTesoreria: cuentasConPuc.filter((c) => c.medioPagoId === m.id),
    }));

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener medios de pago";
    console.error("Error en getMediosPago:", error);
    return { success: false, error: message, data: [] };
  }
}

export async function getCuentasTesoreria(soloActivos = true) {
  try {
    const cuentas = await dbMysql
      .select()
      .from(schemaMysql.cuentasTesoreria)
      .where(soloActivos ? eq(schemaMysql.cuentasTesoreria.activo, true) : undefined)
      .orderBy(asc(schemaMysql.cuentasTesoreria.nombreCuenta));

    const medios = await dbMysql.select().from(schemaMysql.mediosPago);
    const medioMap = new Map<number, any>();
    medios.forEach((m) => medioMap.set(m.id, m));

    const pucs = await dbMysql.select().from(schemaMysql.pucCuentas);
    const pucMap = new Map<string, any>();
    pucs.forEach((p) => pucMap.set(p.codigo, p));

    const data = cuentas.map((c) => ({
      ...c,
      medioPago: medioMap.get(c.medioPagoId) || null,
      cuentaPuc: c.codigoPuc ? pucMap.get(c.codigoPuc) || null : null,
    }));

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener cuentas de tesorería";
    console.error("Error en getCuentasTesoreria:", error);
    return { success: false, error: message, data: [] };
  }
}

export async function crearCuentaTesoreria(datos: {
  medioPagoId: number;
  codigoPuc: string;
  nombreCuenta: string;
  numeroReferencia?: string;
}) {
  try {
    const [insertRes] = await dbMysql.insert(schemaMysql.cuentasTesoreria).values({
      medioPagoId: datos.medioPagoId,
      codigoPuc: datos.codigoPuc.trim(),
      nombreCuenta: datos.nombreCuenta.trim(),
      numeroReferencia: datos.numeroReferencia?.trim() || null,
      activo: true,
    });

    const creada = await dbMysql
      .select()
      .from(schemaMysql.cuentasTesoreria)
      .where(eq(schemaMysql.cuentasTesoreria.id, insertRes.insertId))
      .limit(1);

    return { success: true, data: creada[0] || null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear cuenta de tesorería";
    console.error("Error en crearCuentaTesoreria:", error);
    return { success: false, error: message };
  }
}

export async function actualizarCuentaTesoreria(
  id: number,
  datos: {
    nombreCuenta?: string;
    medioPagoId?: number;
    codigoPuc?: string;
    numeroReferencia?: string;
    activo?: boolean;
  }
) {
  try {
    await dbMysql
      .update(schemaMysql.cuentasTesoreria)
      .set({
        ...(datos.nombreCuenta !== undefined && { nombreCuenta: datos.nombreCuenta.trim() }),
        ...(datos.medioPagoId !== undefined && { medioPagoId: datos.medioPagoId }),
        ...(datos.codigoPuc !== undefined && { codigoPuc: datos.codigoPuc.trim() }),
        ...(datos.numeroReferencia !== undefined && { numeroReferencia: datos.numeroReferencia.trim() || null }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      })
      .where(eq(schemaMysql.cuentasTesoreria.id, id));

    const actualizada = await dbMysql
      .select()
      .from(schemaMysql.cuentasTesoreria)
      .where(eq(schemaMysql.cuentasTesoreria.id, id))
      .limit(1);

    return { success: true, data: actualizada[0] || null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar cuenta de tesorería";
    return { success: false, error: message };
  }
}
