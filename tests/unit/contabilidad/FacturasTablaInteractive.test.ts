import { describe, it, expect } from "vitest";
import { obtenerTotalesFactura, FacturaConRelaciones } from "../../../app/(admin)/contabilidad/facturas/FacturasTablaInteractive";

describe("obtenerTotalesFactura", () => {
  it("debe reflejar exactamente lo registrado en la factura en base de datos cuando los campos no son null", () => {
    const factura: FacturaConRelaciones = {
      id: 1,
      numeroFactura: "FAC-001",
      cufe: null,
      documentoReferencia: null,
      fechaEmision: "2026-08-01",
      fechaVencimiento: null,
      proveedorId: 1,
      clienteDocumento: null,
      clienteNombre: null,
      condicionPago: "Contado",
      medioPago: "Efectivo",
      subtotal: "100000",
      descuentoTotalFactura: "0",
      iva: "19000",
      impoconsumo: "5000",
      ibuaIpcu: null,
      otrosImpuestosTotal: "0",
      totalFactura: "124000",
      observaciones: null,
      creadoEn: "2026-08-01",
      items: [],
    };

    const resultado = obtenerTotalesFactura(factura);

    expect(resultado.subtotal).toBe(100000);
    expect(resultado.iva).toBe(19000);
    expect(resultado.impoconsumo).toBe(5000);
    expect(resultado.totalFactura).toBe(124000);
  });

  it("debe respetar IVA registrado en 0 cuando la factura en BD explícitamente tiene 0 de impuestos (exenta)", () => {
    const factura: FacturaConRelaciones = {
      id: 2,
      numeroFactura: "FAC-EXENTA",
      cufe: null,
      documentoReferencia: null,
      fechaEmision: "2026-08-01",
      fechaVencimiento: null,
      proveedorId: 1,
      clienteDocumento: null,
      clienteNombre: null,
      condicionPago: "Contado",
      medioPago: "Efectivo",
      subtotal: "50000",
      descuentoTotalFactura: "0",
      iva: "0.00",
      impoconsumo: "0.00",
      ibuaIpcu: null,
      otrosImpuestosTotal: "0",
      totalFactura: "50000",
      observaciones: null,
      creadoEn: "2026-08-01",
      items: [],
    };

    const resultado = obtenerTotalesFactura(factura);

    expect(resultado.subtotal).toBe(50000);
    expect(resultado.iva).toBe(0);
    expect(resultado.impoconsumo).toBe(0);
    expect(resultado.totalFactura).toBe(50000);
  });

  it("debe usar los ítems como fallback únicamente cuando los campos en BD son null o undefined", () => {
    const factura: FacturaConRelaciones = {
      id: 3,
      numeroFactura: "FAC-NULL",
      cufe: null,
      documentoReferencia: null,
      fechaEmision: "2026-08-02",
      fechaVencimiento: null,
      proveedorId: 1,
      clienteDocumento: null,
      clienteNombre: null,
      condicionPago: "Contado",
      medioPago: "Efectivo",
      subtotal: null,
      descuentoTotalFactura: "0",
      iva: null,
      impoconsumo: null,
      ibuaIpcu: null,
      otrosImpuestosTotal: "0",
      totalFactura: null,
      observaciones: null,
      creadoEn: "2026-08-02",
      items: [
        {
          id: 1,
          facturaId: 3,
          codigoBarras: "123",
          codigoProveedor: "P123",
          descripcion: "Cerveza Poker Pack x6",
          cantidadIngresada: "2",
          unidadMedida: "UN",
          costoUnitarioCompra: "20000",
          descuentoPorProducto: "0",
          ivaTotal: "7600",
          porcentajeIva: "19",
          impuestoConsumo: "1000",
          otrosImpuestos: "0",
          costoTotalLinea: "48600",
        },
      ],
    };

    const resultado = obtenerTotalesFactura(factura);

    expect(resultado.subtotal).toBe(40000);
    expect(resultado.iva).toBe(7600);
    expect(resultado.impoconsumo).toBe(1000);
    expect(resultado.totalFactura).toBe(48600);
  });

  it("debe procesar correctamente valores numéricos de BD con descuentos negativos o decimales exactos", () => {
    const factura: FacturaConRelaciones = {
      id: 4,
      numeroFactura: "FAC-DB-REAL",
      cufe: null,
      documentoReferencia: null,
      fechaEmision: "2026-08-15",
      fechaVencimiento: null,
      proveedorId: 1,
      clienteDocumento: null,
      clienteNombre: null,
      condicionPago: "Contado",
      medioPago: "Transferencia",
      subtotal: "2324603.61",
      descuentoTotalFactura: "-31345.54",
      iva: "435719.04",
      impoconsumo: "527364.48",
      ibuaIpcu: "0.00",
      otrosImpuestosTotal: "0.00",
      totalFactura: "3256341.59",
      observaciones: null,
      creadoEn: "2026-08-15",
      items: [],
    };

    const resultado = obtenerTotalesFactura(factura);

    expect(resultado.subtotal).toBe(2324603.61);
    expect(resultado.descuento).toBe(31345.54);
    expect(resultado.iva).toBe(435719.04);
    expect(resultado.impoconsumo).toBe(527364.48);
    expect(resultado.totalFactura).toBe(3256341.59);
  });
});
