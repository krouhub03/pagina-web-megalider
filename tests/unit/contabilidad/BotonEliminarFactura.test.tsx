// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BotonEliminarFactura } from "@/app/(admin)/contabilidad/facturas/BotonEliminarFactura";
import { eliminarFacturaAction } from "@/app/(admin)/contabilidad/facturas/actions";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/app/(admin)/contabilidad/facturas/actions", () => ({
  eliminarFacturaAction: vi.fn(),
}));

describe("<BotonEliminarFactura />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe renderizar la variante de tabla por defecto", () => {
    render(<BotonEliminarFactura facturaId={1} numeroFactura="FAC-001" variant="table" />);

    const button = screen.getByRole("button", { name: /eliminar factura fac-001/i });
    expect(button).toBeInTheDocument();
  });

  it("debe renderizar la variante 'full'", () => {
    render(<BotonEliminarFactura facturaId={1} numeroFactura="FAC-001" variant="full" />);

    const button = screen.getByRole("button", { name: /eliminar factura/i });
    expect(button).toBeInTheDocument();
  });

  it("debe abrir el modal de confirmación al hacer clic", async () => {
    const user = userEvent.setup();
    render(<BotonEliminarFactura facturaId={1} numeroFactura="FAC-001" variant="table" />);

    const button = screen.getByRole("button", { name: /eliminar factura fac-001/i });
    await user.click(button);

    expect(screen.getByText("¿Eliminar Factura N° FAC-001?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sí, eliminar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
  });

  it("debe cerrar el modal si el usuario hace clic en 'Cancelar'", async () => {
    const user = userEvent.setup();
    render(<BotonEliminarFactura facturaId={1} numeroFactura="FAC-001" variant="table" />);

    await user.click(screen.getByRole("button", { name: /eliminar factura fac-001/i }));
    expect(screen.getByText("¿Eliminar Factura N° FAC-001?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(screen.queryByText("¿Eliminar Factura N° FAC-001?")).not.toBeInTheDocument();
  });

  it("debe ejecutar eliminarFacturaAction y redireccionar en caso de éxito", async () => {
    const user = userEvent.setup();
    vi.mocked(eliminarFacturaAction).mockResolvedValueOnce({ success: true });

    render(
      <BotonEliminarFactura
        facturaId={10}
        numeroFactura="FAC-010"
        redirectOnSuccess="/contabilidad/facturas"
      />
    );

    await user.click(screen.getByRole("button", { name: /eliminar factura fac-010/i }));
    await user.click(screen.getByRole("button", { name: /sí, eliminar/i }));

    expect(eliminarFacturaAction).toHaveBeenCalledWith(10);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/contabilidad/facturas");
    });
  });

  it("debe mostrar un mensaje de error si la acción falla", async () => {
    const user = userEvent.setup();
    vi.mocked(eliminarFacturaAction).mockResolvedValueOnce({
      success: false,
      error: "No se puede eliminar una factura contabilizada",
    });

    render(<BotonEliminarFactura facturaId={10} numeroFactura="FAC-010" />);

    await user.click(screen.getByRole("button", { name: /eliminar factura fac-010/i }));
    await user.click(screen.getByRole("button", { name: /sí, eliminar/i }));

    expect(eliminarFacturaAction).toHaveBeenCalledWith(10);
    await waitFor(() => {
      expect(screen.getByText("No se puede eliminar una factura contabilizada")).toBeInTheDocument();
    });
  });
});
