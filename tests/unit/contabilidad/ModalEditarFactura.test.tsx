// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalEditarFactura, FacturaEditarData } from "@/app/(admin)/contabilidad/facturas/ModalEditarFactura";
import { actualizarFacturaAction } from "@/app/(admin)/contabilidad/facturas/actions";

vi.mock("@/app/(admin)/contabilidad/facturas/actions", () => ({
  actualizarFacturaAction: vi.fn(),
}));

describe("<ModalEditarFactura />", () => {
  const facturaMock: FacturaEditarData = {
    id: 5,
    numeroFactura: "FAC-005",
    cufe: "CUFE-123",
    documentoReferencia: "REF-99",
    fechaEmision: "2026-08-15T00:00:00.000Z",
    fechaVencimiento: "2026-08-30T00:00:00.000Z",
    condicionPago: "30 días",
    medioPago: "Transferencia",
    subtotal: 100000,
    iva: 19000,
    totalFactura: 119000,
    observaciones: "Factura inicial",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe renderizar el botón desencadenante en variante 'icon' por defecto", () => {
    render(<ModalEditarFactura factura={facturaMock} variant="icon" />);

    const button = screen.getByRole("button", { name: /corregir datos de factura fac-005/i });
    expect(button).toBeInTheDocument();
  });

  it("debe abrir el modal precargado con los datos de la factura", async () => {
    const user = userEvent.setup();
    render(<ModalEditarFactura factura={facturaMock} variant="icon" />);

    await user.click(screen.getByRole("button", { name: /corregir datos de factura fac-005/i }));

    expect(screen.getByText("Corregir Datos de la Factura")).toBeInTheDocument();
    expect(screen.getByDisplayValue("FAC-005")).toBeInTheDocument();
    expect(screen.getByDisplayValue("REF-99")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-08-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-08-30")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30 días")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Transferencia")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CUFE-123")).toBeInTheDocument();
  });

  it("debe enviar el formulario y llamar a actualizarFacturaAction con los datos corregidos", async () => {
    const user = userEvent.setup();
    vi.mocked(actualizarFacturaAction).mockResolvedValueOnce({ success: true });

    render(<ModalEditarFactura factura={facturaMock} variant="icon" />);

    await user.click(screen.getByRole("button", { name: /corregir datos de factura fac-005/i }));

    const numInput = screen.getByDisplayValue("FAC-005");
    await user.clear(numInput);
    await user.type(numInput, "FAC-005-CORREGIDA");

    const submitBtn = screen.getByRole("button", { name: /guardar cambios/i });
    await user.click(submitBtn);

    expect(actualizarFacturaAction).toHaveBeenCalledWith(5, expect.objectContaining({
      numeroFactura: "FAC-005-CORREGIDA",
      documentoReferencia: "REF-99",
      fechaEmision: "2026-08-15",
      fechaVencimiento: "2026-08-30",
      condicionPago: "30 días",
      medioPago: "Transferencia",
      cufe: "CUFE-123",
      observaciones: "Factura inicial",
    }));

    await waitFor(() => {
      expect(screen.queryByText("Corregir Datos de la Factura")).not.toBeInTheDocument();
    });
  });

  it("debe mostrar un mensaje de error en el modal si actualizarFacturaAction falla", async () => {
    const user = userEvent.setup();
    vi.mocked(actualizarFacturaAction).mockResolvedValueOnce({
      success: false,
      error: "Número de factura ya existe",
    });

    render(<ModalEditarFactura factura={facturaMock} variant="icon" />);

    await user.click(screen.getByRole("button", { name: /corregir datos de factura fac-005/i }));
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText("Número de factura ya existe")).toBeInTheDocument();
    });
  });
});
