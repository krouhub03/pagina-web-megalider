import "server-only";
import { dbPostgres, schema } from "@/lib/db/postgres";
import { asc, eq, ilike, like, or, sql } from "drizzle-orm";
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
          ilike(schema.pucCuentas.codigo, q),
          ilike(schema.pucCuentas.nombre, q),
          ilike(schema.pucCuentas.descripcion, q)
        )
      );
    }

    if (filtros.nivel && filtros.nivel > 0) {
      conditions.push(eq(schema.pucCuentas.nivel, filtros.nivel));
    }

    if (filtros.naturaleza && filtros.naturaleza.trim() !== "" && filtros.naturaleza !== "todos") {
      const nat = filtros.naturaleza.trim();
      const firstChar = nat.charAt(0).toUpperCase();
      conditions.push(
        or(
          ilike(schema.pucCuentas.naturaleza, `%${nat}%`),
          eq(schema.pucCuentas.naturaleza, firstChar)
        )
      );
    }

    const data = await dbPostgres.query.pucCuentas.findMany({
      where: conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined,
      orderBy: [asc(schema.pucCuentas.codigo)],
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
    const data = await dbPostgres.query.pucCuentas.findFirst({
      where: eq(schema.pucCuentas.codigo, codigo),
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

    const [nueva] = await dbPostgres
      .insert(schema.pucCuentas)
      .values({
        codigo: datos.codigo.trim(),
        nombre: datos.nombre.trim(),
        nivel: datos.nivel || calcularNivelPuc(datos.codigo.trim()),
        naturaleza: datos.naturaleza || "Débito",
        descripcion: datos.descripcion?.trim() || null,
      })
      .returning();

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
    const [actualizada] = await dbPostgres
      .update(schema.pucCuentas)
      .set({
        ...(datos.nombre !== undefined && { nombre: datos.nombre.trim() }),
        ...(datos.nivel !== undefined && { nivel: datos.nivel }),
        ...(datos.naturaleza !== undefined && { naturaleza: datos.naturaleza }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion.trim() || null }),
      })
      .where(eq(schema.pucCuentas.codigo, codigo))
      .returning();

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
    const egresosAsociados = await dbPostgres.query.egresosTienda.findFirst({
      where: eq(schema.egresosTienda.codigoPuc, codigo),
    });

    if (egresosAsociados) {
      return {
        success: false,
        error: `No se puede eliminar la cuenta ${codigo} porque está asociada a egresos registrados.`,
      };
    }

    const [eliminada] = await dbPostgres
      .delete(schema.pucCuentas)
      .where(eq(schema.pucCuentas.codigo, codigo))
      .returning();

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

