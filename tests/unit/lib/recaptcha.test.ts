import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyRecaptchaToken } from "@/lib/auth/recaptcha";

describe("lib/auth/recaptcha", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("debe retornar error si el token es nulo o vacío cuando hay secret configurado", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "dummy-secret";
    const result = await verifyRecaptchaToken("");
    expect(result.success).toBe(false);
    expect(result.message).toContain("No soy un robot");
  });

  it("debe validar exitosamente cuando Google siteverify responde success: true", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "dummy-secret";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await verifyRecaptchaToken("valid-token");
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("debe retornar fallo cuando Google siteverify responde success: false", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "dummy-secret";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
    } as Response);

    const result = await verifyRecaptchaToken("expired-token");
    expect(result.success).toBe(false);
    expect(result.message).toContain("fallida o expirada");
  });

  it("debe manejar errores de conexión con Google API de forma segura", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "dummy-secret";
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection timeout"));

    const result = await verifyRecaptchaToken("some-token");
    expect(result.success).toBe(false);
    expect(result.message).toContain("conexión a internet");
  });
});
