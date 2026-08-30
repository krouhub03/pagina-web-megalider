// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "@/app/(auth)/register/page";
import * as authService from "@/services/auth.service";

// Mock de next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
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

// Mock simplificado de RecaptchaWidget para simular verificación inmediata
vi.mock("@/components/ui/RecaptchaWidget", () => ({
  RecaptchaWidget: ({ onVerify }: { onVerify: (token: string) => void }) => {
    return (
      <div data-testid="mock-recaptcha">
        <button
          type="button"
          onClick={() => onVerify("mock-captcha-token-123")}
        >
          Simular Check reCAPTCHA
        </button>
      </div>
    );
  },
}));

describe("<RegisterPage />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe renderizar el formulario con todos los campos requeridos", () => {
    render(<RegisterPage />);

    expect(screen.getByText(/Registro de Nueva Cuenta de Cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar Contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Crear mi Cuenta/i })
    ).toBeInTheDocument();
  });

  it("debe mostrar error si se intenta enviar sin aceptar las políticas", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/Nombre Completo/i), "Carlos Gomez");
    await user.type(screen.getByLabelText(/Correo Electrónico/i), "carlos@megalider.com");
    await user.type(screen.getByLabelText(/^Contraseña/i), "Password123*");
    await user.type(screen.getByLabelText(/Confirmar Contraseña/i), "Password123*");

    const submitBtn = screen.getByRole("button", { name: /Crear mi Cuenta/i });
    await user.click(submitBtn);

    expect(
      screen.getByText(/Debes aceptar los Términos y Condiciones/i)
    ).toBeInTheDocument();
  });

  it("debe mostrar error si se aceptan las políticas pero no se completa el captcha", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/Nombre Completo/i), "Carlos Gomez");
    await user.type(screen.getByLabelText(/Correo Electrónico/i), "carlos@megalider.com");
    await user.type(screen.getByLabelText(/^Contraseña/i), "Password123*");
    await user.type(screen.getByLabelText(/Confirmar Contraseña/i), "Password123*");

    // Marcar checkbox de políticas
    await user.click(screen.getByRole("checkbox"));

    const submitBtn = screen.getByRole("button", { name: /Crear mi Cuenta/i });
    await user.click(submitBtn);

    expect(
      screen.getByText(/Por favor completa la verificación de seguridad \(reCAPTCHA\)/i)
    ).toBeInTheDocument();
  });

  it("debe llamar a registerUserAction y redirigir tras un registro exitoso", async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, "registerUserAction").mockResolvedValue({
      success: true,
      user: {
        id: 10,
        nombre: "Carlos Gomez",
        email: "carlos@megalider.com",
        rol: "CLIENTE",
      },
    });

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/Nombre Completo/i), "Carlos Gomez");
    await user.type(screen.getByLabelText(/Correo Electrónico/i), "carlos@megalider.com");
    await user.type(screen.getByLabelText(/^Contraseña/i), "Password123*");
    await user.type(screen.getByLabelText(/Confirmar Contraseña/i), "Password123*");

    // Aceptar políticas y simular reCAPTCHA
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Simular Check reCAPTCHA/i }));

    const submitBtn = screen.getByRole("button", { name: /Crear mi Cuenta/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("debe mostrar mensaje de error del servidor si el registro falla", async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, "registerUserAction").mockResolvedValue({
      success: false,
      message: "Ya existe una cuenta registrada con este correo electrónico.",
    });

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/Nombre Completo/i), "Carlos Gomez");
    await user.type(screen.getByLabelText(/Correo Electrónico/i), "existente@megalider.com");
    await user.type(screen.getByLabelText(/^Contraseña/i), "Password123*");
    await user.type(screen.getByLabelText(/Confirmar Contraseña/i), "Password123*");

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Simular Check reCAPTCHA/i }));

    const submitBtn = screen.getByRole("button", { name: /Crear mi Cuenta/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Ya existe una cuenta registrada con este correo electrónico./i)
      ).toBeInTheDocument();
    });
  });
});
