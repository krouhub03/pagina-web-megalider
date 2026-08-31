import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacturaDetalle } from "@/services/contabilidad.service";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Receipt,
  Package,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Barcode,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BotonCopiarCufe } from "../BotonCopiarCufe";
import { FacturaDetalleActions, FacturaItemAction } from "./FacturaDetalleInteractive";

export const dynamic = "force-dynamic";

interface FacturaDetallePageProps {
  params: Promise<{ id: string }>;
}

export default async function FacturaDetallePage({ params }: FacturaDetallePageProps) {
  const { id } = await params;
  const facturaId = parseInt(id, 10);

  if (isNaN(facturaId)) {
    notFound();
  }

  const result = await getFacturaDetalle(facturaId);
  const factura = result.data;

  if (!result.success || !factura) {
    notFound();
  }

  // Cálculo automático de totales desde los ítems de la factura
  const totalCantidadItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.cantidadIngresada || 0),
    0
  ) || 0;
  const totalCostoBaseItems = factura.items?.reduce(
    (acc, item) => acc + (Number(item.cantidadIngresada || 0) * Number(item.costoUnitarioCompra || 0)),
    0
  ) || 0;
  const totalDescuentosItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.descuentoPorProducto || 0),
    0
  ) || 0;
  const totalIvaItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.ivaTotal || 0),
    0
  ) || 0;
  const totalImpoconsumoItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.impuestoConsumo || 0),
    0
  ) || 0;
  const totalOtrosImpItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.otrosImpuestos || 0),
    0
  ) || 0;
  const totalLineasCalculado = factura.items?.reduce(
    (acc, item) => acc + Number(item.costoTotalLinea || 0),
    0
  ) || 0;

  const subtotal = (factura.subtotal !== null && factura.subtotal !== undefined && Number(factura.subtotal) > 0)
    ? Number(factura.subtotal)
    : (totalLineasCalculado > 0 ? (totalLineasCalculado - totalIvaItems - totalImpoconsumoItems - totalOtrosImpItems) : totalCostoBaseItems);

  const iva = (factura.iva !== null && factura.iva !== undefined)
    ? Number(factura.iva)
    : totalIvaItems;

  const impoconsumo = (factura.impoconsumo !== null && factura.impoconsumo !== undefined)
    ? Number(factura.impoconsumo)
    : totalImpoconsumoItems;

  const otrosImpuestos = (factura.otrosImpuestosTotal !== null && factura.otrosImpuestosTotal !== undefined)
    ? Number(factura.otrosImpuestosTotal)
    : totalOtrosImpItems;

  const descuentoTotal = (factura.descuentoTotalFactura !== null && factura.descuentoTotalFactura !== undefined)
    ? Number(factura.descuentoTotalFactura)
    : totalDescuentosItems;

  const totalFactura = (factura.totalFactura !== null && factura.totalFactura !== undefined && Number(factura.totalFactura) > 0)
    ? Number(factura.totalFactura)
    : (totalLineasCalculado > 0 ? totalLineasCalculado : (subtotal + iva + impoconsumo + otrosImpuestos - descuentoTotal));

  // Auditoría de Cuadre: Comparativa entre cabecera oficial BD y sumatoria de líneas de producto
  const totalUnidadesFisicas = factura.items?.reduce(
    (acc, item) => acc + Number(item.cantidadIngresada || 0),
    0
  ) || 0;

  const otrosImpuestosHeader = (factura.otrosImpuestosTotal !== null && factura.otrosImpuestosTotal !== undefined)
    ? Math.abs(Number(factura.otrosImpuestosTotal || 0))
    : ((factura.ibuaIpcu !== null && factura.ibuaIpcu !== undefined) ? Math.abs(Number(factura.ibuaIpcu || 0)) : totalOtrosImpItems);

  const difDescuento = descuentoTotal - totalDescuentosItems;
  const difSubtotal = subtotal - (totalCostoBaseItems - totalDescuentosItems);
  const difIva = iva - totalIvaItems;
  const difImpoconsumo = impoconsumo - totalImpoconsumoItems;
  const difOtrosImp = otrosImpuestosHeader - totalOtrosImpItems;
  const difTotal = totalFactura - totalLineasCalculado;

  // Inspección de consistencia matemática fila por fila (Cantidad x Costo - Desc + IVA + Impo + Otros = Total Línea)
  const filasInconsistentes = factura.items?.filter((item) => {
    const cant = Number(item.cantidadIngresada || 0);
    const costo = Number(item.costoUnitarioCompra || 0);
    const desc = Number(item.descuentoPorProducto || 0);
    const ivaLine = Number(item.ivaTotal || 0);
    const impoLine = Number(item.impuestoConsumo || 0);
    const otrosLine = Number(item.otrosImpuestos || 0);
    const totalEsperado = (cant * costo) - desc + ivaLine + impoLine + otrosLine;
    const totalRegistrado = Number(item.costoTotalLinea || 0);
    return Math.abs(totalEsperado - totalRegistrado) >= 1;
  }) || [];

  const esMatematicaFilasPerfecta = filasInconsistentes.length === 0;
  const esCuadrePerfecto = Math.abs(difTotal) < 1 && Math.abs(difSubtotal) < 1 && Math.abs(difIva) < 1 && Math.abs(difImpoconsumo) < 1 && Math.abs(difDescuento) < 1 && Math.abs(difOtrosImp) < 1 && esMatematicaFilasPerfecta;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header y Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <Link href="/dashboard" className="hover:text-slate-800 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/contabilidad/facturas" className="hover:text-slate-800 transition-colors">
              Facturas
            </Link>
            <span>/</span>
            <span className="text-[#038C3E]">N° {factura.numeroFactura}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contabilidad/facturas"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
              title="Volver a Facturas"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900 flex flex-wrap items-center gap-2.5">
                <span>Factura {factura.numeroFactura}</span>
                <span className="text-base font-mono font-bold text-[#038C3E] bg-[#A7D9BD]/20 px-3 py-1 rounded-xl border border-[#A7D9BD]/40 shadow-2xs">
                  {formatCurrency(totalFactura)}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Procesada y registrada electrónicamente para control tributario de inventario.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" className="px-3 py-1 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Registrada en Sistema
          </Badge>
          <FacturaDetalleActions factura={factura} />
        </div>
      </div>

      {/* Grid de Resumen: Proveedor, Fechas y Totales con Impuestos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tarjeta 1: Proveedor y Adquiriente */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#038C3E]" /> Proveedor & Adquiriente
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 text-xs">
              {/* Proveedor */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Proveedor (Emisor)
                </span>
                <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                  {factura.proveedor?.razonSocial || "Proveedor General"}
                </h3>
                {factura.proveedor?.nit && (
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded inline-block">
                    NIT: {factura.proveedor.nit}
                  </span>
                )}
              </div>

              {/* Adquiriente */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                  Receptor (Adquiriente)
                </span>
                <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1">
                  {factura.clienteNombre || "Cigarrería Megalider"}
                </h3>
                {factura.clienteDocumento && (
                  <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded inline-block">
                    NIT/CC: {factura.clienteDocumento}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tarjeta 2: Fechas, Pago e Identificación DIAN */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#038C3E]" /> Emisión, Pago & DIAN
              </span>
              {factura.cufe && <BotonCopiarCufe cufe={factura.cufe} />}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Emisión:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(factura.fechaEmision)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Vencimiento:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {factura.fechaVencimiento ? formatDate(factura.fechaVencimiento) : "N/A"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Medio de Pago:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  {factura.medioPago || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Condición:</span>
                <span className="mt-0.5 inline-block">
                  <Badge variant="neutral">{factura.condicionPago || "Contado"}</Badge>
                </span>
              </div>
            </div>

            {/* Fila CUFE compacto */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden pr-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase shrink-0">CUFE:</span>
                {factura.cufe ? (
                  <span className="font-mono text-[10px] text-slate-600 truncate max-w-[220px]" title={factura.cufe}>
                    {factura.cufe}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No especificado</span>
                )}
              </div>
              {factura.documentoReferencia && (
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                  Ref: {factura.documentoReferencia}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Tarjeta 3: Resumen de Totales e Impuestos */}
        <Card className="p-5 flex flex-col justify-between bg-slate-900 text-white">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Receipt className="w-3.5 h-3.5" /> Total & Impuestos
              </span>
              <Badge variant="emerald" className="text-[10px] bg-emerald-950 text-emerald-300 border-emerald-800">
                Total Facturado
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtotal (Sin Impuestos):</span>
                <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-emerald-400">
                <span>(+) IVA Descontable:</span>
                <span className="font-mono font-semibold">{formatCurrency(iva)}</span>
              </div>

              {impoconsumo > 0 && (
                <div className="flex justify-between items-center text-amber-400">
                  <span>(+) Impoconsumo:</span>
                  <span className="font-mono font-semibold">{formatCurrency(impoconsumo)}</span>
                </div>
              )}

              {otrosImpuestos > 0 && (
                <div className="flex justify-between items-center text-purple-300">
                  <span>(+) Otros Impuestos:</span>
                  <span className="font-mono font-semibold">{formatCurrency(otrosImpuestos)}</span>
                </div>
              )}

              {descuentoTotal > 0 && (
                <div className="flex justify-between items-center text-rose-400">
                  <span>(-) Descuentos:</span>
                  <span className="font-mono font-semibold">-{formatCurrency(descuentoTotal)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between items-end mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    TOTAL FACTURA (CON IMPUESTOS)
                  </span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    {formatCurrency(totalFactura)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Módulo de Auditoría de Cuadre Tributario (Factura vs. Sumatoria Productos) */}
      <Card className="p-5 border-l-4 border-l-[#038C3E] bg-white shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Auditoría de Cuadre Tributario
                {esCuadrePerfecto ? (
                  <Badge variant="emerald" className="text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Cuadre Perfecto 100%
                  </Badge>
                ) : (
                  <Badge variant="amber" className="text-[10px]">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Auditoría con Diferencias
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Comparación directa entre la cabecera oficial de la factura electrónica y la sumatoria de las líneas de productos ingresadas.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-2.5">Rubro / Concepto</th>
                <th className="p-2.5 text-right">Factura (Cabecera BD)</th>
                <th className="p-2.5 text-right">Sumatoria Productos</th>
                <th className="p-2.5 text-right">Diferencia</th>
                <th className="p-2.5 text-center">Estado Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-2.5 font-semibold text-slate-700">Unidades Físicas Ingresadas</td>
                <td className="p-2.5 text-right font-mono font-medium text-slate-500">N/A (Cabecera)</td>
                <td className="p-2.5 text-right font-mono font-bold text-slate-900">{totalUnidadesFisicas} Unidades</td>
                <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                <td className="p-2.5 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" /> {factura.items?.length || 0} Ítems Físicos</span>
                </td>
              </tr>
              {(descuentoTotal > 0 || totalDescuentosItems > 0) && (
                <tr>
                  <td className="p-2.5 font-semibold text-rose-800">Descuentos Comerciales</td>
                  <td className="p-2.5 text-right font-mono font-medium text-rose-700">-{formatCurrency(descuentoTotal)}</td>
                  <td className="p-2.5 text-right font-mono text-rose-700">-{formatCurrency(totalDescuentosItems)}</td>
                  <td className={`p-2.5 text-right font-mono font-bold ${Math.abs(difDescuento) < 1 ? "text-slate-400" : "text-amber-700"}`}>
                    {Math.abs(difDescuento) < 1 ? "$0" : (difDescuento > 0 ? `+${formatCurrency(difDescuento)}` : formatCurrency(difDescuento))}
                  </td>
                  <td className="p-2.5 text-center">
                    {Math.abs(difDescuento) < 1 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" /> Cuadrado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Dif. Descuento</span>
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <td className="p-2.5 font-semibold text-slate-700">Subtotal (Sin Impuestos)</td>
                <td className="p-2.5 text-right font-mono font-medium">{formatCurrency(subtotal)}</td>
                <td className="p-2.5 text-right font-mono text-slate-700">{formatCurrency(totalCostoBaseItems - totalDescuentosItems)}</td>
                <td className={`p-2.5 text-right font-mono font-bold ${Math.abs(difSubtotal) < 1 ? "text-slate-400" : "text-amber-700"}`}>
                  {Math.abs(difSubtotal) < 1 ? "$0" : (difSubtotal > 0 ? `+${formatCurrency(difSubtotal)}` : formatCurrency(difSubtotal))}
                </td>
                <td className="p-2.5 text-center">
                  {Math.abs(difSubtotal) < 1 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" /> Cuadrado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Diferencia Base</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-700">IVA Descontable</td>
                <td className="p-2.5 text-right font-mono font-medium">{formatCurrency(iva)}</td>
                <td className="p-2.5 text-right font-mono text-slate-700">{formatCurrency(totalIvaItems)}</td>
                <td className={`p-2.5 text-right font-mono font-bold ${Math.abs(difIva) < 1 ? "text-slate-400" : "text-amber-700"}`}>
                  {Math.abs(difIva) < 1 ? "$0" : (difIva > 0 ? `+${formatCurrency(difIva)}` : formatCurrency(difIva))}
                </td>
                <td className="p-2.5 text-center">
                  {Math.abs(difIva) < 1 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" /> Cuadrado</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> IVA en Cabecera</span>
                  )}
                </td>
              </tr>
              {(impoconsumo > 0 || totalImpoconsumoItems > 0) && (
                <tr>
                  <td className="p-2.5 font-semibold text-slate-700">Impuesto al Consumo (Impoconsumo)</td>
                  <td className="p-2.5 text-right font-mono font-medium">{formatCurrency(impoconsumo)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-700">{formatCurrency(totalImpoconsumoItems)}</td>
                  <td className={`p-2.5 text-right font-mono font-bold ${Math.abs(difImpoconsumo) < 1 ? "text-slate-400" : "text-amber-700"}`}>
                    {Math.abs(difImpoconsumo) < 1 ? "$0" : (difImpoconsumo > 0 ? `+${formatCurrency(difImpoconsumo)}` : formatCurrency(difImpoconsumo))}
                  </td>
                  <td className="p-2.5 text-center">
                    {Math.abs(difImpoconsumo) < 1 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" /> Cuadrado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Impoconsumo en Cabecera</span>
                    )}
                  </td>
                </tr>
              )}
              {(otrosImpuestosHeader > 0 || totalOtrosImpItems > 0) && (
                <tr>
                  <td className="p-2.5 font-semibold text-purple-900">IBUA / Otros Impuestos (Bebidas Azucaradas / Mecatos)</td>
                  <td className="p-2.5 text-right font-mono font-medium text-purple-700">{formatCurrency(otrosImpuestosHeader)}</td>
                  <td className="p-2.5 text-right font-mono text-purple-700">{formatCurrency(totalOtrosImpItems)}</td>
                  <td className={`p-2.5 text-right font-mono font-bold ${Math.abs(difOtrosImp) < 1 ? "text-slate-400" : "text-amber-700"}`}>
                    {Math.abs(difOtrosImp) < 1 ? "$0" : (difOtrosImp > 0 ? `+${formatCurrency(difOtrosImp)}` : formatCurrency(difOtrosImp))}
                  </td>
                  <td className="p-2.5 text-center">
                    {Math.abs(difOtrosImp) < 1 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" /> Cuadrado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> IBUA en Cabecera</span>
                    )}
                  </td>
                </tr>
              )}
              <tr>
                <td className="p-2.5 font-semibold text-slate-700">Consistencia Aritmética de Filas</td>
                <td className="p-2.5 text-right font-mono text-slate-500">Fórmula de Línea</td>
                <td className="p-2.5 text-right font-mono text-slate-700">{factura.items?.length || 0} Líneas</td>
                <td className="p-2.5 text-right font-mono text-slate-400">-</td>
                <td className="p-2.5 text-center">
                  {esMatematicaFilasPerfecta ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" /> 100% Filas Válidas</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700"><AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {filasInconsistentes.length} Error(es) en Fila</span>
                  )}
                </td>
              </tr>
              <tr className="bg-slate-50/90 font-bold border-t border-slate-200">
                <td className="p-2.5 text-slate-900 font-bold">TOTAL FACTURA (CON IMPUESTOS)</td>
                <td className="p-2.5 text-right font-mono text-slate-900 font-bold">{formatCurrency(totalFactura)}</td>
                <td className="p-2.5 text-right font-mono text-emerald-800 font-bold">{formatCurrency(totalLineasCalculado)}</td>
                <td className={`p-2.5 text-right font-mono font-bold ${Math.abs(difTotal) < 1 ? "text-emerald-700" : "text-rose-700"}`}>
                  {Math.abs(difTotal) < 1 ? "$0" : (difTotal > 0 ? `+${formatCurrency(difTotal)}` : formatCurrency(difTotal))}
                </td>
                <td className="p-2.5 text-center">
                  {Math.abs(difTotal) < 1 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#038C3E]"><CheckCircle2 className="w-4 h-4 text-[#038C3E]" /> TOTAL CUADRADO</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700"><AlertTriangle className="w-4 h-4 text-rose-600" /> DESCUADRE TOTAL</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tabla de Líneas / Items de la Factura */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Líneas de Productos ({factura.items?.length || 0})
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Desglose unitario e impuestos aplicados por ítem.
              </p>
            </div>
          </div>
          <FacturaItemAction
            mode="create"
            facturaId={factura.id}
          />
        </div>

        {!factura.items || factura.items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Esta factura no cuenta con líneas de producto registradas.</p>
            <p className="text-slate-400">Puedes agregar productos manualmente haciendo clic en el botón inferior.</p>
            <FacturaItemAction
              mode="create"
              facturaId={factura.id}
            />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] z-10 shadow-2xs">
                <tr>
                  <th className="p-3.5 w-12 text-center cursor-help" title="Número consecutivo de posición de la línea en la factura">#</th>
                  <th className="p-3.5 cursor-help" title="Código de barras EAN/PLU impreso en el producto">Código Barras</th>
                  <th className="p-3.5 cursor-help" title="Código o referencia interna asignada por el proveedor">Ref. Proveedor</th>
                  <th className="p-3.5 cursor-help" title="Descripción comercial completa del producto o mercancía">Descripción Producto</th>
                  <th className="p-3.5 text-center cursor-help" title="Cantidad física ingresada a inventario y unidad de medida">Cantidad</th>
                  <th className="p-3.5 text-right cursor-help text-slate-700 font-bold" title="Precio de compra unitario antes de impuestos y descuentos">Costo Unit. Base</th>
                  <th className="p-3.5 text-right cursor-help text-rose-800 bg-rose-50/70" title="Descuento promocional otorgado por el proveedor por cada unidad individual del producto">Desc. Unit.</th>
                  <th className="p-3.5 text-right cursor-help text-amber-900 bg-amber-50/70" title="Suma total de impuestos (IVA + Impoconsumo + Otros Impuestos) cargados a cada unidad individual del producto">Impuesto Unit. (IVA+Impo)</th>
                  <th className="p-3.5 text-right cursor-help text-emerald-950 bg-emerald-100/80 font-bold border-x border-emerald-200/80" title="Total del producto por unidad individual con todos los impuestos y descuentos incluidos (Subtotal + IVA + Impoconsumo - Descuento ÷ Cantidad). Este es el costo real final por artículo para fijar tu precio de venta al público">Total Unit. (c/Imp)</th>
                  <th className="p-3.5 text-right cursor-help" title="Descuento comercial o promocional total otorgado por el proveedor en este lote">Desc. Total</th>
                  <th className="p-3.5 text-right cursor-help" title="Monto total del lote de productos sin incluir impuestos ni IVA (Cantidad x Costo Base - Descuento)">Subtotal (Sin Impuestos)</th>
                  <th className="p-3.5 text-right cursor-help" title="Valor del IVA en pesos y porcentaje tarifario aplicado (19%, 5% o 0% Exento)">IVA (%)</th>
                  <th className="p-3.5 text-right cursor-help" title="Impuesto al consumo aplicado a licores u otros bienes específicos">Impoconsumo</th>
                  <th className="p-3.5 text-right cursor-help" title="Otros impuestos o contribuciones tributarias aplicadas a la línea">Otros Imp.</th>
                  <th className="p-3.5 text-right cursor-help" title="Monto total final de la línea con todos los impuestos y descuentos incluidos">Total Línea</th>
                  <th className="p-3.5 text-center w-14 cursor-help" title="Acciones disponibles: Editar cantidades/precios o eliminar línea">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {factura.items.map((item, index) => {
                  const cantidad = Number(item.cantidadIngresada || 0);
                  const costoUnitario = Number(item.costoUnitarioCompra || 0);
                  const descuento = Number(item.descuentoPorProducto || 0);
                  const descuentoUnitario = cantidad > 0 ? (descuento / cantidad) : 0;
                  const subtotalLinea = (cantidad * costoUnitario) - descuento;
                  const ivaTotal = Number(item.ivaTotal || 0);
                  const pctIvaCalculado = Number(item.porcentajeIva || 0) > 0
                    ? Number(item.porcentajeIva)
                    : (subtotalLinea > 0 && ivaTotal > 0 ? Math.round((ivaTotal / subtotalLinea) * 100) : 0);
                  const impoConsumoItem = Number(item.impuestoConsumo || 0);
                  const otrosImp = Number(item.otrosImpuestos || 0);
                  const totalLinea = Number(item.costoTotalLinea || 0);
                  const impuestoUnitario = cantidad > 0 ? ((ivaTotal + impoConsumoItem + otrosImp) / cantidad) : 0;
                  const totalUnitarioConImp = cantidad > 0 ? (totalLinea / cantidad) : (costoUnitario - descuentoUnitario + impuestoUnitario);
                  const totalCalculadoFila = (cantidad * costoUnitario) - descuento + ivaTotal + impoConsumoItem + otrosImp;
                  const tieneErrorAritmetico = Math.abs(totalCalculadoFila - totalLinea) >= 1;

                  return (
                    <tr
                      key={item.id || index}
                      className={
                        tieneErrorAritmetico
                          ? "bg-rose-50/70 hover:bg-rose-100/80 transition-colors border-l-4 border-l-rose-500"
                          : "hover:bg-slate-50/80 transition-colors"
                      }
                    >
                      <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="p-3.5 font-mono text-[11px]">
                        {item.codigoBarras ? (
                          <div className="flex items-center gap-1 font-bold text-slate-900" title={`Código de barras EAN/PLU: ${item.codigoBarras}`}>
                            <Barcode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{item.codigoBarras}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-700">
                        {item.codigoProveedor || "-"}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {item.descripcion}
                        {tieneErrorAritmetico && (
                          <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-800 font-bold text-[9px] rounded uppercase tracking-wider">
                            Error en Fila
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900">
                        {cantidad} {item.unidadMedida ? <span className="text-[10px] text-slate-500 font-normal">{item.unidadMedida}</span> : ""}
                      </td>
                      <td className="p-3.5 text-right font-medium text-slate-600">
                        {formatCurrency(costoUnitario)}
                      </td>
                      <td className="p-3.5 text-right font-medium text-rose-600 bg-rose-50/30">
                        {descuentoUnitario > 0 ? `-${formatCurrency(descuentoUnitario)}` : "-"}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-amber-800 bg-amber-50/30">
                        {impuestoUnitario > 0 ? `+${formatCurrency(impuestoUnitario)}` : "-"}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-800 bg-emerald-50/60 border-x border-emerald-100/60">
                        {formatCurrency(totalUnitarioConImp)}
                      </td>
                      <td className="p-3.5 text-right text-rose-600">
                        {descuento > 0 ? `-${formatCurrency(descuento)}` : "-"}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-800">
                        {formatCurrency(subtotalLinea)}
                      </td>
                      <td className="p-3.5 text-right text-emerald-700 font-medium">
                        {formatCurrency(ivaTotal)}
                        {pctIvaCalculado > 0 ? (
                          <span className="text-[10px] text-[#038C3E] font-semibold block">
                            ({pctIvaCalculado}%)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">
                            (0% Exento)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-amber-700 font-medium">
                        {impoConsumoItem > 0 ? formatCurrency(impoConsumoItem) : "-"}
                      </td>
                      <td className="p-3.5 text-right text-purple-700 font-medium">
                        {otrosImp > 0 ? formatCurrency(otrosImp) : "-"}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(totalLinea)}
                        {tieneErrorAritmetico && (
                          <span
                            className="text-rose-700 text-[10px] font-bold block"
                            title={`Inconsistencia: Fórmula calculada $${totalCalculadoFila.toLocaleString()} vs Guardado $${totalLinea.toLocaleString()}`}
                          >
                            ⚠️ Esperado {formatCurrency(totalCalculadoFila)}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <FacturaItemAction
                          mode="edit"
                          item={item}
                          facturaId={factura.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-900 text-white font-bold text-xs border-t border-slate-800 z-10 shadow-lg">
                <tr>
                  <td colSpan={9} className="p-3.5 text-right font-bold uppercase tracking-wider text-[10px] text-slate-300">
                    SUMATORIA TOTAL DE PRODUCTOS ({factura.items.length} LÍNEAS):
                  </td>
                  <td className="p-3.5 text-right text-rose-400 font-semibold">
                    {totalDescuentosItems > 0 ? `-${formatCurrency(totalDescuentosItems)}` : "-"}
                  </td>
                  <td className="p-3.5 text-right text-slate-200 font-bold">
                    {formatCurrency(totalCostoBaseItems - totalDescuentosItems)}
                  </td>
                  <td className="p-3.5 text-right text-emerald-400 font-semibold">
                    {formatCurrency(totalIvaItems)}
                  </td>
                  <td className="p-3.5 text-right text-amber-400 font-semibold">
                    {totalImpoconsumoItems > 0 ? formatCurrency(totalImpoconsumoItems) : "-"}
                  </td>
                  <td className="p-3.5 text-right text-purple-400 font-semibold">
                    {totalOtrosImpItems > 0 ? formatCurrency(totalOtrosImpItems) : "-"}
                  </td>
                  <td className="p-3.5 text-right font-black text-emerald-300 text-base">
                    {formatCurrency(totalLineasCalculado)}
                  </td>
                  <td className="p-3.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Observaciones si las hay */}
      {factura.observaciones && (
        <Card className="p-4 bg-amber-50/50 border-amber-200/60 text-amber-900 text-xs">
          <h4 className="font-bold text-amber-800 mb-1">Observaciones / Notas Adicionales</h4>
          <p>{factura.observaciones}</p>
        </Card>
      )}
    </div>
  );
}
