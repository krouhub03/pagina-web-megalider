// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";
import * as authService from "@/services/auth.service";

// Mock de next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockGetSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: (key: string) => mockGetSearchParams(key),
  }),
}));

// Mock de next/image
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("<LoginPage />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSearchParams.mockReturnValue(null);
  });

  it("debe renderizar el título de la página, campos y botones principales", () => {
    render(<LoginPage />);

    expect(screen.getByText(/Iniciar Sesión en Cigarrería Megalider/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ingresar con correo y contraseña/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Continuar con Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Regístrate aquí/i)).toBeInTheDocument();
  });

  it("debe mostrar error de URL si proviene de un fallo en OAuth", () => {
    mockGetSearchParams.mockImplementation((key: string) => {
      if (key === "error") return "google_access_denied";
      return null;
    });

    render(<LoginPage />);
    expect(
      screen.getByText(/Inicio de sesión cancelado en Google/i)
    ).toBeInTheDocument();
  });

  it("debe permitir alternar la visibilidad de la contraseña", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    // Click en el botón de mostrar contraseña
    const toggleButton = passwordInput.parentElement?.querySelector("button");
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput.type).toBe("text");
    }
  });

  it("debe mostrar mensaje de error cuando loginWithCredentials falla", async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, "loginWithCredentials").mockResolvedValue({
      success: false,
      message: "Credenciales inválidas. Verifica tu contraseña.",
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /Ingresar con correo y contraseña/i });

    await user.type(emailInput, "test@megalider.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Credenciales inválidas. Verifica tu contraseña./i)
      ).toBeInTheDocument();
    });
  });

  it("debe redirigir al destino adecuado tras un inicio de sesión exitoso", async () => {
    const user = userEvent.setup();
    mockGetSearchParams.mockImplementation((key: string) => {
      if (key === "from") return "/admin/dashboard";
      return null;
    });

    vi.spyOn(authService, "loginWithCredentials").mockResolvedValue({
      success: true,
      user: {
        id: 1,
        nombre: "Admin",
        email: "admin@megalider.com",
        rol: "ADMIN",
      },
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    const submitBtn = screen.getByRole("button", { name: /Ingresar con correo y contraseña/i });

    await user.type(emailInput, "admin@megalider.com");
    await user.type(passwordInput, "secret1234");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
