// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModalEditarFacturaItem, ItemFacturaData } from "@/app/(admin)/contabilidad/facturas/ModalEditarFacturaItem";
import {
  actualizarFacturaItemAction,
  crearFacturaItemAction,
  eliminarFacturaItemAction,
} from "@/app/(admin)/contabilidad/facturas/actions";

vi.mock("@/app/(admin)/contabilidad/facturas/actions", () => ({
  actualizarFacturaItemAction: vi.fn(),
  crearFacturaItemAction: vi.fn(),
  eliminarFacturaItemAction: vi.fn(),
}));

describe("<ModalEditarFacturaItem />", () => {
  const itemMock: ItemFacturaData = {
    id: 101,
    facturaId: 5,
    descripcion: "Cerveza Poker 330ml Canasta x 30",
    codigoBarras: "7701234567890",
    codigoProveedor: "PROV-100",
    cantidadIngresada: 2,
    unidadMedida: "CAN",
    costoUnitarioCompra: 45000,
    descuentoPorProducto: 0,
    porcentajeIva: 19,
    ivaTotal: 17100,
    impuestoConsumo: 0,
    otrosImpuestos: 0,
    costoTotalLinea: 107100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Modo Creación (mode='create')", () => {
    it("debe renderizar el botón 'Agregar Producto' y abrir el modal vacío", async () => {
      const user = userEvent.setup();
      render(<ModalEditarFacturaItem facturaId={5} mode="create" />);

      const triggerBtn = screen.getByRole("button", { name: /agregar producto/i });
      expect(triggerBtn).toBeInTheDocument();

      await user.click(triggerBtn);
      expect(screen.getByText("Agregar Nuevo Producto a Factura")).toBeInTheDocument();
    });

    it("debe invocar crearFacturaItemAction al guardar un nuevo ítem", async () => {
      const user = userEvent.setup();
      vi.mocked(crearFacturaItemAction).mockResolvedValueOnce({ success: true });

      render(<ModalEditarFacturaItem facturaId={5} mode="create" />);

      await user.click(screen.getByRole("button", { name: /agregar producto/i }));

      const descInput = screen.getByPlaceholderText(/cerveza poker/i);
      await user.type(descInput, "Agua Manantial 500ml Pack x 24");

      const submitBtn = screen.getByRole("button", { name: /guardar ítem/i });
      await user.click(submitBtn);

      expect(crearFacturaItemAction).toHaveBeenCalledWith(
        5,
        expect.objectContaining({
          descripcion: "Agua Manantial 500ml Pack x 24",
        })
      );

      await waitFor(() => {
        expect(screen.queryByText("Agregar Nuevo Producto a Factura")).not.toBeInTheDocument();
      });
    }, 15000);
  });

  describe("Modo Edición (mode='edit')", () => {
    it("debe abrir el modal precargado con los datos del ítem", async () => {
      const user = userEvent.setup();
      render(<ModalEditarFacturaItem item={itemMock} facturaId={5} mode="edit" />);

      const editBtn = screen.getByRole("button", { name: /editar producto cerveza poker/i });
      await user.click(editBtn);

      expect(screen.getByText("Editar Producto / Línea")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Cerveza Poker 330ml Canasta x 30")).toBeInTheDocument();
      expect(screen.getByDisplayValue("7701234567890")).toBeInTheDocument();
      expect(screen.getByDisplayValue("45000")).toBeInTheDocument();
    });

    it("debe invocar actualizarFacturaItemAction al guardar cambios del ítem", async () => {
      const user = userEvent.setup();
      vi.mocked(actualizarFacturaItemAction).mockResolvedValueOnce({ success: true });

      render(<ModalEditarFacturaItem item={itemMock} facturaId={5} mode="edit" />);

      await user.click(screen.getByRole("button", { name: /editar producto cerveza poker/i }));

      const submitBtn = screen.getByRole("button", { name: /guardar ítem/i });
      await user.click(submitBtn);

      expect(actualizarFacturaItemAction).toHaveBeenCalledWith(
        101,
        5,
        expect.objectContaining({
          descripcion: "Cerveza Poker 330ml Canasta x 30",
        })
      );
    });

    it("debe invocar eliminarFacturaItemAction al presionar 'Eliminar Ítem'", async () => {
      const user = userEvent.setup();
      vi.mocked(eliminarFacturaItemAction).mockResolvedValueOnce({ success: true });

      render(<ModalEditarFacturaItem item={itemMock} facturaId={5} mode="edit" />);

      await user.click(screen.getByRole("button", { name: /editar producto cerveza poker/i }));

      const deleteBtn = screen.getByRole("button", { name: /eliminar ítem/i });
      await user.click(deleteBtn);

      expect(eliminarFacturaItemAction).toHaveBeenCalledWith(101, 5);
    });

    it("debe ajustar la cantidad al hacer clic en los botones + y -", async () => {
      const user = userEvent.setup();
      render(<ModalEditarFacturaItem item={itemMock} facturaId={5} mode="edit" />);

      await user.click(screen.getByRole("button", { name: /editar producto cerveza poker/i }));

      const decreaseBtn = screen.getByTitle("Disminuir 1 unidad");
      const increaseBtn = screen.getByTitle("Aumentar 1 unidad");

      // Aumentar a 3
      await user.click(increaseBtn);
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();

      // Disminuir a 2
      await user.click(decreaseBtn);
      expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    });
  });
});
