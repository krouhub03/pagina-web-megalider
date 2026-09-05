import { NextResponse } from "next/server";
import { sincronizarAsientosFacturasFaltantes } from "@/services/asientos.service";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";

export function OPTIONS() {
  return handleCORSPreflight();
}

export async function POST() {
  try {
    const res = await sincronizarAsientosFacturasFaltantes();
    if (!res.success) {
      return apiError(res.error || "Error al sincronizar asientos contables", 500, "INTERNAL_ERROR");
    }
    return apiSuccess(res.data, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno del servidor";
    return apiError(msg, 500, "INTERNAL_ERROR");
  }
}
