import { z } from "zod";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { getTiposOperacion, crearTipoOperacion } from "@/services/tipos-operacion.service";

export function OPTIONS() {
  return handleCORSPreflight();
}

const tipoOperacionSchema = z.object({
  codigo: z.string().min(2).max(50),
  nombre: z.string().min(2).max(150),
  descripcion: z.string().optional(),
  cuentaPucDebito: z.string().min(4).max(10),
  cuentaPucCredito: z.string().min(4).max(10).optional(),
  afectaInventario: z.boolean().optional(),
  esRemision: z.boolean().optional(),
});

export async function GET() {
  try {
    const res = await getTiposOperacion();
    if (!res.success) {
      return apiError(res.error || "Error al obtener tipos de operación", 500, "INTERNAL_ERROR");
    }
    return apiSuccess(res.data, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await parseJSONBody(request);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cuerpo JSON inválido";
      return apiError(msg, 400, "BAD_REQUEST");
    }

    const validation = validateSchema(tipoOperacionSchema, body);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const res = await crearTipoOperacion(validation.data);
    if (!res.success) {
      return apiError(res.error || "Error al crear tipo de operación", 400, "VALIDATION_ERROR");
    }

    return apiSuccess(res.data, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}
