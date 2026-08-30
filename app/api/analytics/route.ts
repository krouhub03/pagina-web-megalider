import { z } from "zod";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { logWebhookEvent } from "@/lib/api/audit";

export function OPTIONS() {
  return handleCORSPreflight();
}

const webVitalsSchema = z.object({
  name: z.enum(["TTFB", "LCP", "CLS", "INP", "FID", "FCP"]),
  value: z.number().nonnegative().max(60000), // Máximo 60 segundos
  rating: z.enum(["good", "needs-improvement", "poor"]),
  delta: z.number().min(-60000).max(60000),
  id: z.string().min(1).max(50),
  url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await parseJSONBody(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Cuerpo de petición inválido";
      return apiError(message, 400, "BAD_REQUEST");
    }

    const validation = validateSchema(webVitalsSchema, body);
    if (!validation.success) {
      return validation.errorResponse;
    }

    const metric = validation.data;

    // Log de telemetría de forma no bloqueante
    logWebhookEvent({
      action: "web_vitals_telemetry",
      resourceType: "metric",
      resourceId: metric.id,
      details: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: metric.url,
      },
      status: "success",
    }).catch(() => {});

    return apiSuccess({ received: true });
  } catch (error) {
    console.error("Error en endpoint /api/analytics:", error);
    return apiError("Fallo al procesar métrica de rendimiento", 500, "INTERNAL_SERVER_ERROR");
  }
}
