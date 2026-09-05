import "server-only";
import { dbMysql, schema as schemaMysql } from "@/lib/db/mysql";
import { eq, asc } from "drizzle-orm";

export interface TipoOperacionItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  cuentaPucDebito: string;
  cuentaPucCredito: string | null;
  afectaInventario: boolean;
  esRemision: boolean;
  activo: boolean;
  creadoEn: Date;
}

export async function getTiposOperacion(soloActivos = true) {
  try {
    const items = await dbMysql
      .select()
      .from(schemaMysql.tiposOperacion)
      .where(soloActivos ? eq(schemaMysql.tiposOperacion.activo, true) : undefined)
      .orderBy(asc(schemaMysql.tiposOperacion.nombre));

    const pucs = await dbMysql.select().from(schemaMysql.pucCuentas);
    const pucMap = new Map<string, any>();
    pucs.forEach((p) => pucMap.set(p.codigo, p));

    const data = items.map((it) => ({
      ...it,
      cuentaDebito: it.cuentaPucDebito ? pucMap.get(it.cuentaPucDebito) || null : null,
      cuentaCredito: it.cuentaPucCredito ? pucMap.get(it.cuentaPucCredito) || null : null,
    }));

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener tipos de operación";
    console.error("Error en getTiposOperacion:", error);
    return { success: false, error: message, data: [] };
  }
}

export async function getTipoOperacionPorId(id: number) {
  try {
    const rows = await dbMysql
      .select()
      .from(schemaMysql.tiposOperacion)
      .where(eq(schemaMysql.tiposOperacion.id, id))
      .limit(1);

    if (rows.length === 0) {
      return { success: true, data: null };
    }

    const item = rows[0];
    const pucs = await dbMysql.select().from(schemaMysql.pucCuentas);
    const pucMap = new Map<string, any>();
    pucs.forEach((p) => pucMap.set(p.codigo, p));

    const data = {
      ...item,
      cuentaDebito: item.cuentaPucDebito ? pucMap.get(item.cuentaPucDebito) || null : null,
      cuentaCredito: item.cuentaPucCredito ? pucMap.get(item.cuentaPucCredito) || null : null,
    };

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener tipo de operación";
    return { success: false, error: message, data: null };
  }
}

export async function crearTipoOperacion(datos: {
  codigo: string;
  nombre: string;
  descripcion?: string;
  cuentaPucDebito: string;
  cuentaPucCredito?: string;
  afectaInventario?: boolean;
  esRemision?: boolean;
}) {
  try {
    const existente = await dbMysql.query.tiposOperacion.findFirst({
      where: eq(schemaMysql.tiposOperacion.codigo, datos.codigo.trim().toUpperCase()),
    });

    if (existente) {
      return { success: false, error: `Ya existe un tipo de operación con el código ${datos.codigo}` };
    }

    const [insertRes] = await dbMysql.insert(schemaMysql.tiposOperacion).values({
      codigo: datos.codigo.trim().toUpperCase(),
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      cuentaPucDebito: datos.cuentaPucDebito.trim(),
      cuentaPucCredito: datos.cuentaPucCredito?.trim() || null,
      afectaInventario: Boolean(datos.afectaInventario),
      esRemision: Boolean(datos.esRemision),
      activo: true,
    });

    const nuevo = await getTipoOperacionPorId(insertRes.insertId);
    return { success: true, data: nuevo.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear tipo de operación";
    console.error("Error en crearTipoOperacion:", error);
    return { success: false, error: message };
  }
}

export async function actualizarTipoOperacion(
  id: number,
  datos: {
    nombre?: string;
    descripcion?: string;
    cuentaPucDebito?: string;
    cuentaPucCredito?: string;
    afectaInventario?: boolean;
    esRemision?: boolean;
    activo?: boolean;
  }
) {
  try {
    await dbMysql
      .update(schemaMysql.tiposOperacion)
      .set({
        ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion.trim() || null }),
        ...(datos.cuentaPucDebito !== undefined && { cuentaPucDebito: datos.cuentaPucDebito.trim() }),
        ...(datos.cuentaPucCredito !== undefined && { cuentaPucCredito: datos.cuentaPucCredito.trim() || null }),
        ...(datos.afectaInventario !== undefined && { afectaInventario: datos.afectaInventario }),
        ...(datos.esRemision !== undefined && { esRemision: datos.esRemision }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      })
      .where(eq(schemaMysql.tiposOperacion.id, id));

    const actualizado = await getTipoOperacionPorId(id);
    return { success: true, data: actualizado.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar tipo de operación";
    return { success: false, error: message };
  }
}
