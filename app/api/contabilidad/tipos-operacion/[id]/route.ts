import { z } from "zod";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { getTipoOperacionPorId, actualizarTipoOperacion } from "@/services/tipos-operacion.service";

export function OPTIONS() {
  return handleCORSPreflight();
}

const updateTipoOperacionSchema = z.object({
  nombre: z.string().min(2).max(150).optional(),
  descripcion: z.string().optional(),
  cuentaPucDebito: z.string().min(4).max(10).optional(),
  cuentaPucCredito: z.string().min(4).max(10).optional().nullable(),
  afectaInventario: z.boolean().optional(),
  esRemision: z.boolean().optional(),
  activo: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return apiError("ID de tipo de operación inválido", 400, "BAD_REQUEST");
    }

    const res = await getTipoOperacionPorId(numId);
    if (!res.success) {
      return apiError(res.error || "Error al obtener tipo de operación", 500, "INTERNAL_ERROR");
    }

    if (!res.data) {
      return apiError("Tipo de operación no encontrado", 404, "NOT_FOUND");
    }

    return apiSuccess(res.data, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return apiError("ID de tipo de operación inválido", 400, "BAD_REQUEST");
    }

    let body: unknown;
    try {
      body = await parseJSONBody(request);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cuerpo JSON inválido";
      return apiError(msg, 400, "BAD_REQUEST");
    }

    const validation = validateSchema(updateTipoOperacionSchema, body);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const res = await actualizarTipoOperacion(numId, {
      ...validation.data,
      cuentaPucCredito: validation.data.cuentaPucCredito ?? undefined,
    });

    if (!res.success) {
      return apiError(res.error || "Error al actualizar tipo de operación", 400, "VALIDATION_ERROR");
    }

    return apiSuccess(res.data, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}
