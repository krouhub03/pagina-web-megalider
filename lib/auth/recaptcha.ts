import "server-only";

interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Valida un token de Google reCAPTCHA v2 con los servidores de Google.
 * En modo desarrollo, si no hay secret configurado, permite bypass con advertencia en consola.
 */
export async function verifyRecaptchaToken(token: string | null | undefined): Promise<{
  success: boolean;
  message?: string;
}> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Si no hay clave secreta configurada en entorno local / desarrollo
  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("RECAPTCHA_SECRET_KEY no está configurada en producción.");
      return { success: false, message: "Error de configuración del sistema de seguridad." };
    }
    console.warn("⚠️ RECAPTCHA_SECRET_KEY no configurada. Omitiendo validación en entorno de desarrollo.");
    return { success: true };
  }

  if (!token) {
    return { success: false, message: "Por favor completa la verificación de seguridad (No soy un robot)." };
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const data: RecaptchaVerifyResponse = await response.json();

    if (data.success) {
      return { success: true };
    }

    console.warn("Fallo de verificación de reCAPTCHA:", data["error-codes"]);
    return {
      success: false,
      message: "Verificación de seguridad fallida o expirada. Intenta nuevamente.",
    };
  } catch (error) {
    console.error("Error al conectar con Google reCAPTCHA API:", error);
    return {
      success: false,
      message: "No se pudo validar el captcha. Verifica tu conexión a internet.",
    };
  }
}
