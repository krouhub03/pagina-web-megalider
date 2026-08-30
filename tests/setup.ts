import { afterEach, vi } from "vitest";

// Solo ejecutar cleanup de DOM si estamos en entorno con window (jsdom)
if (typeof window !== "undefined") {
  import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
  });
}

// Variables de entorno de prueba por defecto
process.env.NEXTAUTH_SECRET = "test_super_secret_jwt_key_2026_x7a9q_vitest";
process.env.JWT_SECRET = "test_super_secret_jwt_key_2026_x7a9q_vitest";
process.env.RECAPTCHA_SECRET_KEY = "test_recaptcha_secret_key";
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

// Mock de `server-only` para entorno de pruebas
vi.mock("server-only", () => ({}));
