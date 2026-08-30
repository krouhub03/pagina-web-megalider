import { describe, it, expect, vi, beforeEach } from "vitest";
import { signJWT, verifyJWT, getSession, UserSessionPayload } from "@/lib/auth/jwt";

// Mock de next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("lib/auth/jwt", () => {
  const mockUser: UserSessionPayload = {
    id: 1,
    nombre: "Administrador Megalider",
    email: "admin@megalider.com",
    rol: "ADMIN",
    avatarUrl: null,
  };

  it("debe firmar y verificar un token JWT válido", async () => {
    const token = await signJWT(mockUser, "1h");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);

    const decoded = await verifyJWT(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(mockUser.id);
    expect(decoded?.email).toBe(mockUser.email);
    expect(decoded?.rol).toBe("ADMIN");
  });

  it("debe retornar null cuando el token es inválido o corrupto", async () => {
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
    const result = await verifyJWT(invalidToken);
    expect(result).toBeNull();
  });

  it("debe retornar la sesión desde cookies cuando auth_token existe", async () => {
    const token = await signJWT(mockUser, "1h");
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: token }),
    });

    const session = await getSession();
    expect(session).not.toBeNull();
    expect(session?.email).toBe("admin@megalider.com");
  });

  it("debe retornar null cuando no existe la cookie auth_token", async () => {
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    });

    const session = await getSession();
    expect(session).toBeNull();
  });
});
