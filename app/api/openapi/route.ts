import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { getOpenAPISpecification } from "@/lib/api/openapi";

export function OPTIONS() {
  return handleCORSPreflight();
}

export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV !== "production";
  const apiKeyHeader = request.headers.get("X-API-Key");
  const expectedApiKey = process.env.OPENAPI_API_KEY;

  // Permitir en desarrollo o si la API key coincide si está configurada
  if (!isDev) {
    if (expectedApiKey && apiKeyHeader !== expectedApiKey) {
      return apiError("Acceso no autorizado al documento OpenAPI", 403, "FORBIDDEN");
    }
    if (!expectedApiKey) {
      return apiError("Recurso no disponible en producción", 404, "NOT_FOUND");
    }
  }

  const spec = getOpenAPISpecification();
  return apiSuccess(spec);
}
