import { z } from "zod";
import { apiError, ApiErrorResponse } from "./response";
import { NextResponse } from "next/server";

export async function parseJSONBody<T = unknown>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("INVALID_CONTENT_TYPE: Esperado 'application/json'");
  }

  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("INVALID_JSON_PAYLOAD: El cuerpo de la petición no es un JSON válido");
  }
}

export interface FormattedZodError {
  field: string;
  message: string;
}

export function formatZodError(error: z.ZodError): FormattedZodError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errorResponse: NextResponse<ApiErrorResponse> };

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formattedErrors = formatZodError(result.error);
    return {
      success: false,
      errorResponse: apiError(
        "Los datos enviados en la petición no son válidos.",
        400,
        "VALIDATION_ERROR",
        formattedErrors
      ),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
