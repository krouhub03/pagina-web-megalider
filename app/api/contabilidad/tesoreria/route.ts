import { z } from "zod";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { getCuentasTesoreria, getMediosPago, crearCuentaTesoreria } from "@/services/tesoreria.service";

export function OPTIONS() {
  return handleCORSPreflight();
}

const cuentaTesoreriaSchema = z.object({
  medioPagoId: z.number().int().positive(),
  codigoPuc: z.string().min(4).max(10),
  nombreCuenta: z.string().min(2).max(150),
  numeroReferencia: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    if (tipo === "medios") {
      const res = await getMediosPago();
      return apiSuccess(res.data, 200);
    }

    const res = await getCuentasTesoreria();
    if (!res.success) {
      return apiError(res.error || "Error al obtener cuentas de tesorería", 500, "INTERNAL_ERROR");
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

    const validation = validateSchema(cuentaTesoreriaSchema, body);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const res = await crearCuentaTesoreria(validation.data);
    if (!res.success) {
      return apiError(res.error || "Error al crear cuenta de tesorería", 400, "VALIDATION_ERROR");
    }

    return apiSuccess(res.data, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}
