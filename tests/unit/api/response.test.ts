import { describe, it, expect } from "vitest";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";

describe("lib/api/response", () => {
  it("apiSuccess debe retornar status 200 y estructura ApiResponse exitosa", async () => {
    const data = { id: 1, nombre: "Producto Test" };
    const res = apiSuccess(data);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(data);
    expect(json.meta).toBeDefined();
  });

  it("apiError debe retornar el status HTTP especificado y la estructura de error", async () => {
    const res = apiError("Acceso no autorizado", 401, "UNAUTHORIZED");

    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("Acceso no autorizado");
  });

  it("handleCORSPreflight debe retornar status 204 con cabeceras CORS", () => {
    const res = handleCORSPreflight();

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-methods")).toContain("GET, POST");
    expect(res.headers.get("access-control-allow-origin")).toBeDefined();
  });
});
