import "server-only";
import { dbMysql, schema as schemaMysql } from "@/lib/db/mysql";
import { asc, eq, like, or, sql } from "drizzle-orm";
import {
  type PucCuentaItem,
  type FiltrosPuc,
  calcularNivelPuc,
} from "@/lib/puc-utils";

export type { PucCuentaItem, FiltrosPuc };
export { calcularNivelPuc };

export async function getPucCuentas(filtros: FiltrosPuc = {}) {
  try {
    const conditions = [];

    if (filtros.search && filtros.search.trim() !== "") {
      const q = `%${filtros.search.trim()}%`;
      conditions.push(
        or(
          like(schemaMysql.pucCuentas.codigo, q),
          like(schemaMysql.pucCuentas.nombre, q),
          like(schemaMysql.pucCuentas.descripcion, q)
        )
      );
    }

    if (filtros.nivel && filtros.nivel > 0) {
      conditions.push(eq(schemaMysql.pucCuentas.nivel, filtros.nivel));
    }

    if (filtros.naturaleza && filtros.naturaleza.trim() !== "" && filtros.naturaleza !== "todos") {
      const nat = filtros.naturaleza.trim();
      const firstChar = nat.charAt(0).toUpperCase();
      conditions.push(
        or(
          like(schemaMysql.pucCuentas.naturaleza, `%${nat}%`),
          eq(schemaMysql.pucCuentas.naturaleza, firstChar)
        )
      );
    }

    const data = await dbMysql.query.pucCuentas.findMany({
      where: conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined,
      orderBy: [asc(schemaMysql.pucCuentas.codigo)],
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener cuentas PUC";
    console.error("Error en getPucCuentas:", error);
    return { success: false, error: message, data: [] };
  }
}

export async function getPucCuentaPorCodigo(codigo: string) {
  try {
    const data = await dbMysql.query.pucCuentas.findFirst({
      where: eq(schemaMysql.pucCuentas.codigo, codigo),
    });
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener cuenta PUC";
    console.error(`Error en getPucCuentaPorCodigo (${codigo}):`, error);
    return { success: false, error: message, data: null };
  }
}

export async function crearPucCuenta(datos: {
  codigo: string;
  nombre: string;
  nivel?: number;
  naturaleza?: string;
  descripcion?: string;
}) {
  try {
    const existente = await getPucCuentaPorCodigo(datos.codigo);
    if (existente.data) {
      return { success: false, error: `Ya existe una cuenta PUC con el código ${datos.codigo}` };
    }

    await dbMysql
      .insert(schemaMysql.pucCuentas); const nueva = await getPucCuentaPorCodigo(datos.codigo.trim()).then(r => r.data);

    return { success: true, data: nueva };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear la cuenta PUC";
    console.error("Error en crearPucCuenta:", error);
    return { success: false, error: message };
  }
}

export async function actualizarPucCuenta(
  codigo: string,
  datos: {
    nombre?: string;
    nivel?: number;
    naturaleza?: string;
    descripcion?: string;
  }
) {
  try {
    await dbMysql
      .update(schemaMysql.pucCuentas)
      .set({
        ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
        ...(datos.nivel !== undefined && { nivel: datos.nivel }),
        ...(datos.naturaleza !== undefined && { naturaleza: datos.naturaleza }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion.trim() || null }),
      })
      .where(eq(schemaMysql.pucCuentas.codigo, codigo));
    const actualizada = await getPucCuentaPorCodigo(codigo).then(res => res.data);

    if (!actualizada) {
      return { success: false, error: `No se encontró la cuenta PUC con código ${codigo}` };
    }

    return { success: true, data: actualizada };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar la cuenta PUC";
    console.error(`Error en actualizarPucCuenta (${codigo}):`, error);
    return { success: false, error: message };
  }
}

export async function eliminarPucCuenta(codigo: string) {
  try {
    // Validar si la cuenta está en uso en egresos_tienda
    const egresosAsociados = null; // dbMysql.query.egresosTienda.findFirst({ where: eq(schemaMysql.egresosTienda.codigoPuc, codigo) });

    if (egresosAsociados) {
      return {
        success: false,
        error: `No se puede eliminar la cuenta ${codigo} porque está asociada a egresos registrados.`,
      };
    }

    const eliminada = await dbMysql.delete(schemaMysql.pucCuentas).where(eq(schemaMysql.pucCuentas.codigo, codigo));

    if (!eliminada) {
      return { success: false, error: `No se encontró la cuenta PUC con código ${codigo}` };
    }

    return { success: true, data: eliminada };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar la cuenta PUC";
    console.error(`Error en eliminarPucCuenta (${codigo}):`, error);
    return { success: false, error: message };
  }
}

