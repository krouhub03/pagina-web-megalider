import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginWithCredentials, registerUserAction } from "@/services/auth.service";
import bcrypt from "bcryptjs";

// Mock de base de datos MySQL Drizzle
const mockFindFirst = vi.fn();
const mockInsertValues = vi.fn();
const mockInsert = vi.fn((_table?: unknown) => ({
  values: mockInsertValues,
}));

vi.mock("@/lib/db/mysql", () => ({
  dbMysql: {
    query: {
      usuarios: {
        findFirst: (opts?: unknown) => mockFindFirst(opts),
      },
    },
    insert: (table?: unknown) => mockInsert(table),
  },
  schema: {
    usuarios: {
      id: "id",
      email: "email",
      nombre: "nombre",
      passwordHash: "passwordHash",
      rol: "rol",
      activo: "activo",
    },
  },
}));

// Mock de cookies de Next.js
const mockCookieSet = vi.fn();
const mockCookieDelete = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mockCookieSet,
    delete: mockCookieDelete,
    get: vi.fn(),
  })),
}));

// Mock de recaptcha
const mockVerifyRecaptchaToken = vi.fn();
vi.mock("@/lib/auth/recaptcha", () => ({
  verifyRecaptchaToken: (...args: unknown[]) => mockVerifyRecaptchaToken(...args),
}));

describe("services/auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loginWithCredentials", () => {
    it("debe rechazar si falta el correo o la contraseña", async () => {
      const formData = new FormData();
      formData.append("email", "");
      formData.append("password", "");

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("ingresa tu correo y contraseña");
    });

    it("debe rechazar si el usuario no existe en la base de datos", async () => {
      mockFindFirst.mockResolvedValue(null);

      const formData = new FormData();
      formData.append("email", "inexistente@megalider.com");
      formData.append("password", "password123");

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Credenciales inválidas o usuario no registrado");
    });

    it("debe rechazar si el usuario está inactivo", async () => {
      mockFindFirst.mockResolvedValue({
        id: 2,
        nombre: "Inactivo User",
        email: "inactivo@megalider.com",
        activo: false,
        passwordHash: "hash123",
      });

      const formData = new FormData();
      formData.append("email", "inactivo@megalider.com");
      formData.append("password", "password123");

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("cuenta se encuentra inactiva");
    });

    it("debe sugerir iniciar con Google si el usuario no tiene passwordHash", async () => {
      mockFindFirst.mockResolvedValue({
        id: 3,
        nombre: "Google User",
        email: "google@megalider.com",
        activo: true,
        passwordHash: null,
      });

      const formData = new FormData();
      formData.append("email", "google@megalider.com");
      formData.append("password", "password123");

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("inicia sesión con Google");
    });

    it("debe rechazar si la contraseña no coincide", async () => {
      const hashed = await bcrypt.hash("correct-pass-123", 10);
      mockFindFirst.mockResolvedValue({
        id: 1,
        nombre: "Admin User",
        email: "admin@megalider.com",
        activo: true,
        passwordHash: hashed,
        rol: "ADMIN",
      });

      const formData = new FormData();
      formData.append("email", "admin@megalider.com");
      formData.append("password", "wrong-password");

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Verifica tu contraseña");
    });

    it("debe autenticar exitosamente, setear cookie HttpOnly y retornar usuario", async () => {
      const plainPassword = "valid-password-2026";
      const hashed = await bcrypt.hash(plainPassword, 10);
      mockFindFirst.mockResolvedValue({
        id: 5,
        nombre: "Juan Perez",
        email: "juan@megalider.com",
        activo: true,
        passwordHash: hashed,
        rol: "CLIENTE",
        avatarUrl: null,
      });

      const formData = new FormData();
      formData.append("email", "juan@megalider.com");
      formData.append("password", plainPassword);

      const result = await loginWithCredentials(formData);
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(5);
      expect(result.user?.email).toBe("juan@megalider.com");
      expect(result.user?.rol).toBe("CLIENTE");
      expect(mockCookieSet).toHaveBeenCalledWith(
        "auth_token",
        expect.any(String),
        expect.objectContaining({ httpOnly: true, path: "/" })
      );
    });
  });

  describe("registerUserAction", () => {
    it("debe fallar si el nombre tiene menos de 2 caracteres", async () => {
      const formData = new FormData();
      formData.append("nombre", "A");
      formData.append("email", "test@megalider.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("aceptaPoliticas", "true");
      formData.append("captchaToken", "token123");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("mínimo 2 caracteres");
    });

    it("debe fallar si el correo no tiene formato válido", async () => {
      const formData = new FormData();
      formData.append("nombre", "Carlos Gómez");
      formData.append("email", "correo-invalido");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("aceptaPoliticas", "true");
      formData.append("captchaToken", "token123");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("correo electrónico válido");
    });

    it("debe fallar si la contraseña tiene menos de 8 caracteres", async () => {
      const formData = new FormData();
      formData.append("nombre", "Carlos Gómez");
      formData.append("email", "carlos@megalider.com");
      formData.append("password", "12345");
      formData.append("confirmPassword", "12345");
      formData.append("aceptaPoliticas", "true");
      formData.append("captchaToken", "token123");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("al menos 8 caracteres");
    });

    it("debe fallar si las contraseñas no coinciden", async () => {
      const formData = new FormData();
      formData.append("nombre", "Carlos Gómez");
      formData.append("email", "carlos@megalider.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password456");
      formData.append("aceptaPoliticas", "true");
      formData.append("captchaToken", "token123");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Las contraseñas no coinciden");
    });

    it("debe fallar si no acepta las políticas de privacidad", async () => {
      const formData = new FormData();
      formData.append("nombre", "Carlos Gómez");
      formData.append("email", "carlos@megalider.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("aceptaPoliticas", "false");
      formData.append("captchaToken", "token123");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Términos y Condiciones");
    });

    it("debe fallar si la verificación de reCAPTCHA no es exitosa", async () => {
      mockVerifyRecaptchaToken.mockResolvedValue({
        success: false,
        message: "Error de verificación reCAPTCHA",
      });

      const formData = new FormData();
      formData.append("nombre", "Carlos Gómez");
      formData.append("email", "carlos@megalider.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("aceptaPoliticas", "true");
      formData.append("captchaToken", "bad-token");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Error de verificación reCAPTCHA");
    });

    it("debe fallar si el correo ya existe", async () => {
      mockVerifyRecaptchaToken.mockResolvedValue({ success: true });
      mockFindFirst.mockResolvedValue({ id: 10, email: "carlos@megalider.com" });

      const formData = new FormData();
      formData.append("nombre", "Carlos Gómez");
      formData.append("email", "carlos@megalider.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("aceptaPoliticas", "true");
      formData.append("captchaToken", "valid-token");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Ya existe una cuenta registrada con este correo");
    });

    it("debe registrar con éxito, crear usuario CLIENTE y asignar cookie", async () => {
      mockVerifyRecaptchaToken.mockResolvedValue({ success: true });
      mockFindFirst.mockResolvedValue(null);
      mockInsertValues.mockResolvedValue([{ insertId: 77 }]);

      const formData = new FormData();
      formData.append("nombre", "Nuevo Cliente");
      formData.append("email", "cliente@megalider.com");
      formData.append("password", "password123");
      formData.append("confirmPassword", "password123");
      formData.append("aceptaPoliticas", "true");
      formData.append("captchaToken", "valid-token");

      const result = await registerUserAction(formData);
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe(77);
      expect(result.user?.nombre).toBe("Nuevo Cliente");
      expect(result.user?.rol).toBe("CLIENTE");
      expect(mockCookieSet).toHaveBeenCalledWith(
        "auth_token",
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
    });
  });
});
