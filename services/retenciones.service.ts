import "server-only";
import { dbMysql, schema as schemaMysql } from "@/lib/db/mysql";
import { eq, asc } from "drizzle-orm";

export async function getTiposRetencion(soloActivos = true) {
  try {
    const data = await dbMysql.query.tiposRetencion.findMany({
      where: soloActivos ? eq(schemaMysql.tiposRetencion.activo, true) : undefined,
      orderBy: [asc(schemaMysql.tiposRetencion.nombre)],
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener tipos de retención";
    console.error("Error en getTiposRetencion:", error);
    return { success: false, error: message, data: [] };
  }
}

export async function crearTipoRetencion(datos: {
  codigo: string;
  nombre: string;
  porcentaje: number | string;
  baseMinima?: number | string;
  cuentaPuc: string;
}) {
  try {
    const [insertRes] = await dbMysql.insert(schemaMysql.tiposRetencion).values({
      codigo: datos.codigo.trim().toUpperCase(),
      nombre: datos.nombre.trim(),
      porcentaje: String(datos.porcentaje),
      baseMinima: String(datos.baseMinima || 0),
      cuentaPuc: datos.cuentaPuc.trim(),
      activo: true,
    });

    const creada = await dbMysql.query.tiposRetencion.findFirst({
      where: eq(schemaMysql.tiposRetencion.id, insertRes.insertId),
    });

    return { success: true, data: creada };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear tipo de retención";
    console.error("Error en crearTipoRetencion:", error);
    return { success: false, error: message };
  }
}
