import { timingSafeEqual } from "node:crypto";

export function validateRevalidateToken(
  request: Request
): { valid: boolean; error?: string } {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { valid: false, error: "Encabezado de autorización ausente o malformado." };
    }

    const token = authHeader.slice(7).trim();
    const expectedToken = process.env.REVALIDATE_SECRET_TOKEN;

    if (!expectedToken) {
      console.error("REVALIDATE_SECRET_TOKEN no está configurado en las variables de entorno.");
      return { valid: false, error: "Error de configuración del servidor." };
    }

    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedToken);

    if (tokenBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Token de autorización inválido." };
    }

    try {
      if (timingSafeEqual(tokenBuffer, expectedBuffer)) {
        return { valid: true };
      }
      return { valid: false, error: "Token de autorización inválido." };
    } catch {
      return { valid: false, error: "Error durante la verificación del token." };
    }
  } catch (error) {
    console.error("Error en validación de token de revalidación:", error);
    return { valid: false, error: "Fallo inesperado al validar token." };
  }
}

const ALLOWED_REDIRECT_PATHS = [
  "/",
  "/dashboard",
  "/catalogo",
  "/contabilidad",
  "/usuarios",
  "/admin",
];

export function validateRedirectUri(targetPath: string): { valid: boolean; safePath: string } {
  if (!targetPath || typeof targetPath !== "string") {
    return { valid: true, safePath: "/dashboard" };
  }

  // Prevenir redirección abierta (debe comenzar con / y no con // ni URL absoluta)
  if (!targetPath.startsWith("/") || targetPath.startsWith("//")) {
    return { valid: false, safePath: "/" };
  }

  // Extraer el pathname ignorando query strings
  const pathname = targetPath.split("?")[0];

  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`)
  );

  if (!isAllowed) {
    return { valid: false, safePath: "/" };
  }

  return { valid: true, safePath: targetPath };
}
