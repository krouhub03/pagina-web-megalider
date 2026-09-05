import { describe, it, expect } from "vitest";
import { generarAsientoContable } from "@/lib/contabilidad/motor-asientos";

describe("Motor Contable NIIF Colombia - Partida Doble", () => {
  it("debe generar un asiento cuadrado para Compra de Inventario con IVA e Impoconsumo", () => {
    const res = generarAsientoContable({
      factura: {
        id: 1,
        numeroFactura: "FE-1001",
        subtotal: "1000000.00",
        iva: "190000.00",
        impoconsumo: "80000.00",
        totalFactura: "1270000.00",
        proveedorNombre: "DISTRIBUIDORA DE LICORES S.A.S",
      },
      tipoOperacion: {
        codigo: "COMPRA_INVENTARIO",
        nombre: "Compra de Mercancía",
        cuentaPucDebito: "143505",
        cuentaPucCredito: "220505",
        afectaInventario: true,
      },
    });

    expect(res.estaBalanceado).toBe(true);
    expect(res.diferencia).toBeLessThan(0.01);
    expect(res.totalDebitos).toBe(1270000);
    expect(res.totalCreditos).toBe(1270000);
    expect(res.asientos.length).toBe(4); // 143505 (1M) + 240802 (190k) + 240810 (80k) vs 220505 (1.27M)
  });

  it("debe aplicar Retención en la Fuente descontando del pasivo del proveedor", () => {
    const res = generarAsientoContable({
      factura: {
        id: 2,
        numeroFactura: "FE-1002",
        subtotal: "1000000.00",
        iva: "190000.00",
        totalFactura: "1190000.00",
        proveedorNombre: "PROVEEDOR CON RETENCIÓN",
      },
      tipoOperacion: {
        codigo: "COMPRA_INVENTARIO",
        nombre: "Compra de Mercancía",
        cuentaPucDebito: "143505",
        cuentaPucCredito: "220505",
        afectaInventario: true,
      },
      retenciones: [
        {
          cuentaPuc: "236540",
          nombreRetencion: "Retención en la Fuente Compras (2.5%)",
          valorRetenido: "25000.00",
        },
      ],
    });

    expect(res.estaBalanceado).toBe(true);
    expect(res.totalDebitos).toBe(1190000); // 1M + 190k
    expect(res.totalCreditos).toBe(1190000); // 25k (RteFte) + 1.165M (Proveedor)
  });

  it("debe generar asiento provisional para Remisión de Mercancía (143505 vs 220595)", () => {
    const res = generarAsientoContable({
      factura: {
        id: 3,
        numeroFactura: "REM-500",
        subtotal: "500000.00",
        iva: "0.00",
        totalFactura: "500000.00",
      },
      tipoOperacion: {
        codigo: "REMISION_MERCANCIA",
        nombre: "Remisión de Mercancía",
        cuentaPucDebito: "143505",
        afectaInventario: true,
        esRemision: true,
      },
    });

    expect(res.estaBalanceado).toBe(true);
    expect(res.asientos.some(a => a.cuentaPuc === "220595")).toBe(true);
    expect(res.totalDebitos).toBe(500000);
    expect(res.totalCreditos).toBe(500000);
  });

  it("debe asignar la cuenta de tesorería específica cuando se indica la caja o banco", () => {
    const res = generarAsientoContable({
      factura: {
        id: 4,
        numeroFactura: "POS-99",
        subtotal: "100000.00",
        iva: "19000.00",
        totalFactura: "119000.00",
      },
      tipoOperacion: {
        codigo: "COMPRA_INVENTARIO",
        nombre: "Compra de Mercancía",
        cuentaPucDebito: "143505",
        afectaInventario: true,
      },
      cuentaTesoreria: {
        codigoPuc: "11050501",
        nombreCuenta: "Caja Mostrador 1",
      },
    });

    expect(res.estaBalanceado).toBe(true);
    expect(res.asientos.some(a => a.cuentaPuc === "11050501" && Number(a.credito) === 119000)).toBe(true);
  });
});
