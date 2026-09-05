import { z } from "zod";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { getTiposRetencion, crearTipoRetencion } from "@/services/retenciones.service";

export function OPTIONS() {
  return handleCORSPreflight();
}

const tipoRetencionSchema = z.object({
  codigo: z.string().min(2).max(50),
  nombre: z.string().min(2).max(150),
  porcentaje: z.number().positive().max(100),
  baseMinima: z.number().nonnegative().optional(),
  cuentaPuc: z.string().min(4).max(10),
});

export async function GET() {
  try {
    const res = await getTiposRetencion();
    if (!res.success) {
      return apiError(res.error || "Error al obtener tipos de retención", 500, "INTERNAL_ERROR");
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

    const validation = validateSchema(tipoRetencionSchema, body);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const res = await crearTipoRetencion(validation.data);
    if (!res.success) {
      return apiError(res.error || "Error al crear tipo de retención", 400, "VALIDATION_ERROR");
    }

    return apiSuccess(res.data, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}
