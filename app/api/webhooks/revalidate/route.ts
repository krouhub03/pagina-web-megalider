import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";
import { validateRevalidateToken } from "@/lib/api/security";
import { logWebhookEvent } from "@/lib/api/audit";

export function OPTIONS() {
  return handleCORSPreflight();
}

const revalidatePayloadSchema = z
  .object({
    tag: z.string().min(1).max(100).optional(),
    path: z
      .string()
      .min(1)
      .max(255)
      .regex(/^\/[a-zA-Z0-9\/_-]*$/, "Path inválido o potencial inyección de rutas")
      .optional(),
  })
  .refine((data) => data.tag || data.path, {
    message: "Debe proporcionar al menos un 'tag' o un 'path' para revalidar.",
  });

export async function POST(request: Request) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

  // 1. Validar Bearer token usando timingSafeEqual
  const tokenValidation = validateRevalidateToken(request);
  if (!tokenValidation.valid) {
    await logWebhookEvent({
      action: "revalidate_webhook",
      status: "failed",
      ipAddress,
      errorMessage: tokenValidation.error,
    });
    return apiError(tokenValidation.error || "No autorizado", 401, "UNAUTHORIZED");
  }

  // 2. Parsear JSON garantizando Content-Type application/json
  let body: unknown;
  try {
    body = await parseJSONBody(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sintaxis JSON inválida";
    return apiError(message, 400, "BAD_REQUEST");
  }

  // 3. Validar payload con esquema Zod
  const validation = validateSchema(revalidatePayloadSchema, body);
  if (!validation.success) {
    return validation.errorResponse;
  }

  const { tag, path } = validation.data;

  try {
    if (tag) {
      // En Next.js 16+, revalidateTag requiere el argumento de perfil/expiración
      revalidateTag(tag, "default");
    }
    if (path) {
      revalidatePath(path);
    }

    await logWebhookEvent({
      action: tag ? "revalidate_tag" : "revalidate_path",
      details: { tag, path },
      ipAddress,
      status: "success",
    });

    return apiSuccess({
      revalidated: true,
      tag: tag || null,
      path: path || null,
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al revalidar caché";
    await logWebhookEvent({
      action: "revalidate_webhook_error",
      status: "failed",
      ipAddress,
      errorMessage: message,
    });

    return apiError(message, 500, "INTERNAL_SERVER_ERROR");
  }
}
