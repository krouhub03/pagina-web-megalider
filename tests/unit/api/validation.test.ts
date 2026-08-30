import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";

describe("lib/api/validation", () => {
  it("parseJSONBody debe rechazar si Content-Type no es application/json", async () => {
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ key: "value" }),
    });

    await expect(parseJSONBody(req)).rejects.toThrow("INVALID_CONTENT_TYPE");
  });

  it("parseJSONBody debe parsear correctamente si Content-Type es application/json", async () => {
    const payload = { key: "value" };
    const req = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await parseJSONBody(req);
    expect(body).toEqual(payload);
  });

  it("validateSchema debe retornar success: true si el payload cumple con el esquema", () => {
    const schema = z.object({ email: z.string().email() });
    const result = validateSchema(schema, { email: "usuario@megalider.com" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("usuario@megalider.com");
    }
  });

  it("validateSchema debe retornar respuesta 400 VALIDATION_ERROR si el payload es inválido", async () => {
    const schema = z.object({ email: z.string().email() });
    const result = validateSchema(schema, { email: "correo_invalido" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorResponse.status).toBe(400);
      const json = await result.errorResponse.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.details).toHaveLength(1);
    }
  });
});
