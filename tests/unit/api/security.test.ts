import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateRevalidateToken, validateRedirectUri } from "@/lib/api/security";

describe("lib/api/security", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.REVALIDATE_SECRET_TOKEN = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4";
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("validateRevalidateToken debe validar exitosamente con un Bearer token correcto", () => {
    const req = new Request("http://localhost/api/webhooks/revalidate", {
      headers: {
        Authorization: "Bearer a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
      },
    });

    const res = validateRevalidateToken(req);
    expect(res.valid).toBe(true);
  });

  it("validateRevalidateToken debe fallar si falta el header Authorization", () => {
    const req = new Request("http://localhost/api/webhooks/revalidate");
    const res = validateRevalidateToken(req);
    expect(res.valid).toBe(false);
  });

  it("validateRevalidateToken debe fallar si el token es incorrecto", () => {
    const req = new Request("http://localhost/api/webhooks/revalidate", {
      headers: {
        Authorization: "Bearer token_incorrecto_123456789012345",
      },
    });

    const res = validateRevalidateToken(req);
    expect(res.valid).toBe(false);
  });

  it("validateRedirectUri debe permitir rutas relativas autorizadas", () => {
    expect(validateRedirectUri("/dashboard").valid).toBe(true);
    expect(validateRedirectUri("/catalogo/licores").valid).toBe(true);
  });

  it("validateRedirectUri debe rechazar y corregir redirecciones abiertas a dominios externos o esquemas //", () => {
    const res1 = validateRedirectUri("https://sitio-malicioso.com");
    expect(res1.valid).toBe(false);
    expect(res1.safePath).toBe("/");

    const res2 = validateRedirectUri("//sitio-malicioso.com");
    expect(res2.valid).toBe(false);
    expect(res2.safePath).toBe("/");
  });
});
