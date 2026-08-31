import { describe, it, expect } from "vitest";
import {
  obtenerNaturalezaFinanciera,
  MAPA_NATURALEZA_FINANCIERA,
} from "@/lib/clasificacion-financiera";
import {
  obtenerInfoClasePuc,
  obtenerTipoEstadoFinanciero,
  CLASES_PUC_MAP,
} from "@/lib/puc-utils";

describe("Clasificación Financiera y PUC Clases 1 a 7", () => {
  describe("Clases PUC (Metadatos y Estado Financiero)", () => {
    it("debe clasificar correctamente las Cuentas de Balance (Clases 1, 2 y 3)", () => {
      expect(obtenerTipoEstadoFinanciero("1")).toBe("BALANCE_GENERAL");
      expect(obtenerTipoEstadoFinanciero("110505")).toBe("BALANCE_GENERAL"); // Activo
      expect(obtenerTipoEstadoFinanciero("220505")).toBe("BALANCE_GENERAL"); // Pasivo
      expect(obtenerTipoEstadoFinanciero("310505")).toBe("BALANCE_GENERAL"); // Patrimonio

      const clase1 = obtenerInfoClasePuc("1105");
      expect(clase1?.nombre).toBe("Activo");
      expect(clase1?.tipoEstado).toBe("BALANCE_GENERAL");

      const clase2 = obtenerInfoClasePuc("2205");
      expect(clase2?.nombre).toBe("Pasivo");

      const clase3 = obtenerInfoClasePuc("3105");
      expect(clase3?.nombre).toBe("Patrimonio");
    });

    it("debe clasificar correctamente las Cuentas de Resultado (Clases 4, 5, 6 y 7)", () => {
      expect(obtenerTipoEstadoFinanciero("4135")).toBe("ESTADO_RESULTADOS"); // Ingresos
      expect(obtenerTipoEstadoFinanciero("5135")).toBe("ESTADO_RESULTADOS"); // Gastos
      expect(obtenerTipoEstadoFinanciero("6135")).toBe("ESTADO_RESULTADOS"); // Costos de ventas
      expect(obtenerTipoEstadoFinanciero("7105")).toBe("ESTADO_RESULTADOS"); // Costos de operación

      const clase4 = obtenerInfoClasePuc("4135");
      expect(clase4?.nombre).toBe("Ingresos");

      const clase5 = obtenerInfoClasePuc("5105");
      expect(clase5?.nombre).toBe("Gastos");

      const clase6 = obtenerInfoClasePuc("6135");
      expect(clase6?.nombre).toBe("Costos de Ventas");

      const clase7 = obtenerInfoClasePuc("7105");
      expect(clase7?.nombre).toBe("Costos de Producción o de Operación");
    });
  });

  describe("obtenerNaturalezaFinanciera", () => {
    it("debe clasificar por código PUC para todas las 7 clases", () => {
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "1405" }).tipo).toBe("COMPRA_INVENTARIO");
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "1524" }).tipo).toBe("ACTIVO_FIJO");
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "2205" }).tipo).toBe("PAGO_DEUDA");
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "3105" }).tipo).toBe("RETIRO_PERSONAL");
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "4135" }).tipo).toBe("INGRESO_OPERATIVO");
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "5135" }).tipo).toBe("GASTO_OPERATIVO");
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "6135" }).tipo).toBe("COSTO_VENTAS");
      expect(obtenerNaturalezaFinanciera({ codigoPuc: "7105" }).tipo).toBe("COSTO_OPERACION");
    });

    it("debe clasificar semánticamente por descripción", () => {
      expect(obtenerNaturalezaFinanciera({ descripcion: "Compra de vitrina para cervezas" }).tipo).toBe("ACTIVO_FIJO");
      expect(obtenerNaturalezaFinanciera({ descripcion: "Abono cuota prestamo bancario" }).tipo).toBe("PAGO_DEUDA");
      expect(obtenerNaturalezaFinanciera({ descripcion: "Retiro personal de caja socio" }).tipo).toBe("RETIRO_PERSONAL");
    });
  });
});
