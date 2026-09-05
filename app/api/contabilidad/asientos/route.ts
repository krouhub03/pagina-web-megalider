import { z } from "zod";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { getLibroDiario, conciliarFacturaContable } from "@/services/asientos.service";

export function OPTIONS() {
  return handleCORSPreflight();
}

const conciliarSchema = z.object({
  facturaId: z.coerce.number().int().positive(),
  cuentaTesoreriaId: z.coerce.number().int().positive().nullable().optional(),
  retencionesIds: z.array(z.coerce.number().int().positive()).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facturaId = searchParams.get("facturaId") ? Number(searchParams.get("facturaId")) : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const res = await getLibroDiario({ facturaId, limit });
    if (!res.success) {
      return apiError(res.error || "Error al obtener libro diario", 500, "INTERNAL_ERROR");
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

    const validation = validateSchema(conciliarSchema, body);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const res = await conciliarFacturaContable(validation.data);
    if (!res.success) {
      return apiError(res.error || "Error al conciliar factura", 400, "VALIDATION_ERROR");
    }

    return apiSuccess(res.data, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}
