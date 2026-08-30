import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import {
  eliminarFacturaAction,
  actualizarFacturaAction,
  actualizarFacturaItemAction,
  crearFacturaItemAction,
  eliminarFacturaItemAction,
} from "@/app/(admin)/contabilidad/facturas/actions";
import {
  eliminarFactura,
  actualizarFactura,
  actualizarFacturaItem,
  crearFacturaItem,
  eliminarFacturaItem,
} from "@/services/contabilidad.service";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/contabilidad.service", () => ({
  eliminarFactura: vi.fn(),
  actualizarFactura: vi.fn(),
  actualizarFacturaItem: vi.fn(),
  crearFacturaItem: vi.fn(),
  eliminarFacturaItem: vi.fn(),
}));

describe("Contabilidad Server Actions - Facturas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("eliminarFacturaAction", () => {
    it("debe revalidar la ruta /contabilidad/facturas cuando la eliminación es exitosa", async () => {
      vi.mocked(eliminarFactura).mockResolvedValueOnce({ success: true });

      const res = await eliminarFacturaAction(10);

      expect(eliminarFactura).toHaveBeenCalledWith(10);
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas");
      expect(res).toEqual({ success: true });
    });

    it("no debe revalidar si la eliminación falla", async () => {
      vi.mocked(eliminarFactura).mockResolvedValueOnce({
        success: false,
        error: "Factura no encontrada",
      });

      const res = await eliminarFacturaAction(999);

      expect(eliminarFactura).toHaveBeenCalledWith(999);
      expect(revalidatePath).not.toHaveBeenCalled();
      expect(res.success).toBe(false);
    });
  });

  describe("actualizarFacturaAction", () => {
    it("debe revalidar las rutas de facturas al actualizar con éxito", async () => {
      const inputData = { numeroFactura: "FAC-100", fechaEmision: "2026-08-01" };
      vi.mocked(actualizarFactura).mockResolvedValueOnce({ success: true });

      const res = await actualizarFacturaAction(15, inputData);

      expect(actualizarFactura).toHaveBeenCalledWith(15, inputData);
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas");
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas/15");
      expect(res).toEqual({ success: true });
    });

    it("no debe revalidar la ruta si el servicio retorna error", async () => {
      vi.mocked(actualizarFactura).mockResolvedValueOnce({
        success: false,
        error: "Error al actualizar",
      });

      const res = await actualizarFacturaAction(15, { numeroFactura: "" });

      expect(revalidatePath).not.toHaveBeenCalled();
      expect(res.success).toBe(false);
    });
  });

  describe("actualizarFacturaItemAction", () => {
    it("debe actualizar ítem y revalidar rutas", async () => {
      const itemData = { descripcion: "Producto A", cantidadIngresada: "2", costoUnitarioCompra: "5000" };
      vi.mocked(actualizarFacturaItem).mockResolvedValueOnce({ success: true });

      const res = await actualizarFacturaItemAction(101, 15, itemData);

      expect(actualizarFacturaItem).toHaveBeenCalledWith(101, itemData, 15);
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas");
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas/15");
      expect(res).toEqual({ success: true });
    });
  });

  describe("crearFacturaItemAction", () => {
    it("debe crear un ítem de factura y revalidar rutas", async () => {
      const nuevoItem = { descripcion: "Producto B", cantidadIngresada: "1", costoUnitarioCompra: "10000", costoTotalLinea: "10000" };
      vi.mocked(crearFacturaItem).mockResolvedValueOnce({ success: true });

      const res = await crearFacturaItemAction(15, nuevoItem);

      expect(crearFacturaItem).toHaveBeenCalledWith(15, nuevoItem);
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas");
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas/15");
      expect(res).toEqual({ success: true });
    });
  });

  describe("eliminarFacturaItemAction", () => {
    it("debe eliminar el ítem de la factura y revalidar rutas", async () => {
      vi.mocked(eliminarFacturaItem).mockResolvedValueOnce({ success: true });

      const res = await eliminarFacturaItemAction(101, 15);

      expect(eliminarFacturaItem).toHaveBeenCalledWith(101, 15);
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas");
      expect(revalidatePath).toHaveBeenCalledWith("/contabilidad/facturas/15");
      expect(res).toEqual({ success: true });
    });
  });
});
