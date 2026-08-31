"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Receipt, Search, Building2, Calendar, Clock, Eye, XCircle, Percent, DollarSign, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useFacturasFiltrosStore } from "@/lib/stores/use-facturas-filtros-store";
import dynamic from "next/dynamic";
import { BotonCopiarCufe } from "./BotonCopiarCufe";
import { BotonEliminarFactura } from "./BotonEliminarFactura";

const ModalEditarFactura = dynamic(
  () => import("./ModalEditarFactura").then((mod) => mod.ModalEditarFactura),
  { ssr: false }
);

interface FacturaItemSchema {
  id: number;
  facturaId: number | null;
  codigoBarras: string | null;
  codigoProveedor: string | null;
  descripcion: string;
  cantidadIngresada: string;
  unidadMedida: string | null;
  costoUnitarioCompra: string;
  descuentoPorProducto: string | null;
  ivaTotal: string | null;
  porcentajeIva: string | null;
  impuestoConsumo: string | null;
  otrosImpuestos: string | null;
  costoTotalLinea: string;
}

interface ProveedorSchema {
  id: number;
  nit: string;
  razonSocial: string;
}

export interface FacturaConRelaciones {
  id: number;
  numeroFactura: string;
  cufe: string | null;
  documentoReferencia: string | null;
  fechaEmision: string;
  fechaVencimiento: string | null;
  proveedorId: number | null;
  clienteDocumento: string | null;
  clienteNombre: string | null;
  condicionPago: string | null;
  medioPago: string | null;
  subtotal: string | null;
  descuentoTotalFactura: string | null;
  iva: string | null;
  impoconsumo: string | null;
  ibuaIpcu: string | null;
  otrosImpuestosTotal: string | null;
  totalFactura: string | null;
  observaciones: string | null;
  creadoEn: string | null;
  proveedor?: ProveedorSchema | null;
  items?: FacturaItemSchema[];
}

interface FacturasTablaInteractiveProps {
  facturasIniciales: FacturaConRelaciones[];
}

/**
 * Obtiene los totales de la factura reflejando lo registrado en la factura en la base de datos,
 * usando el desglose de ítems únicamente si el campo en la cabecera es null/undefined.
 */
export function obtenerTotalesFactura(factura: FacturaConRelaciones) {
  const totalIvaItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.ivaTotal || 0),
    0
  ) || 0;
  const totalImpoconsumoItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.impuestoConsumo || 0),
    0
  ) || 0;
  const totalSubtotalItems = factura.items?.reduce(
    (acc, item) => acc + (Number(item.cantidadIngresada || 0) * Number(item.costoUnitarioCompra || 0) - Number(item.descuentoPorProducto || 0)),
    0
  ) || 0;
  const totalFacturaItems = factura.items?.reduce(
    (acc, item) => acc + Number(item.costoTotalLinea || 0),
    0
  ) || 0;

  const iva = (factura.iva !== null && factura.iva !== undefined) ? Math.abs(Number(factura.iva || 0)) : totalIvaItems;
  const impoconsumo = (factura.impoconsumo !== null && factura.impoconsumo !== undefined) ? Math.abs(Number(factura.impoconsumo || 0)) : totalImpoconsumoItems;
  const subtotal = (factura.subtotal !== null && factura.subtotal !== undefined) ? Math.abs(Number(factura.subtotal || 0)) : (totalSubtotalItems > 0 ? totalSubtotalItems : (totalFacturaItems - iva - impoconsumo));
  const totalFactura = (factura.totalFactura !== null && factura.totalFactura !== undefined) ? Math.abs(Number(factura.totalFactura || 0)) : totalFacturaItems;
  const descuento = (factura.descuentoTotalFactura !== null && factura.descuentoTotalFactura !== undefined) ? Math.abs(Number(factura.descuentoTotalFactura || 0)) : 0;

  return { subtotal, iva, impoconsumo, totalFactura, descuento };
}

export function FacturasTablaInteractive({
  facturasIniciales,
}: FacturasTablaInteractiveProps) {
  // Suscripción granular a Zustand para filtros de búsqueda y fechas
  const busqueda = useFacturasFiltrosStore((state) => state.busqueda);
  const setBusqueda = useFacturasFiltrosStore((state) => state.setBusqueda);
  const fechaFiltro = useFacturasFiltrosStore((state) => state.fechaFiltro);
  const setFechaFiltro = useFacturasFiltrosStore((state) => state.setFechaFiltro);
  const fechaInicio = useFacturasFiltrosStore((state) => state.fechaInicio);
  const setFechaInicio = useFacturasFiltrosStore((state) => state.setFechaInicio);
  const fechaFin = useFacturasFiltrosStore((state) => state.fechaFin);
  const setFechaFin = useFacturasFiltrosStore((state) => state.setFechaFin);
  const resetFiltros = useFacturasFiltrosStore((state) => state.resetFiltros);

  // Filtrado reactivo en memoria (cliente) priorizando ordenamiento y filtrado por Fecha de Registro (creadoEn)
  const facturasFiltradas = useMemo(() => {
    // 1. Ordenar por Fecha de Registro descendente (más recientes / registradas hoy primero)
    const facturasOrdenadas = [...facturasIniciales].sort((a, b) => {
      const fechaA = new Date(a.creadoEn || a.fechaEmision || 0).getTime();
      const fechaB = new Date(b.creadoEn || b.fechaEmision || 0).getTime();
      return fechaB - fechaA; // DESC
    });

    return facturasOrdenadas.filter((f) => {
      // Coincidencia por texto de búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const numMatch = f.numeroFactura?.toLowerCase().includes(q);
        const cufeMatch = f.cufe?.toLowerCase().includes(q);
        const provMatch = f.proveedor?.razonSocial?.toLowerCase().includes(q);
        const nitMatch = f.proveedor?.nit?.toLowerCase().includes(q);
        if (!numMatch && !cufeMatch && !provMatch && !nitMatch) return false;
      }

      // Filtro estricto por FECHA DE REGISTRO (creadoEn en PostgreSQL)
      const fechaRegistroStr = f.creadoEn
        ? f.creadoEn.substring(0, 10)
        : (f.fechaEmision || "");

      const hoyStr = new Date().toISOString().substring(0, 10);
      const ayerDate = new Date();
      ayerDate.setDate(ayerDate.getDate() - 1);
      const ayerStr = ayerDate.toISOString().substring(0, 10);

      if (fechaFiltro === "hoy") {
        if (fechaRegistroStr !== hoyStr && !f.creadoEn?.startsWith(hoyStr)) return false;
      } else if (fechaFiltro === "ayer") {
        if (fechaRegistroStr !== ayerStr && !f.creadoEn?.startsWith(ayerStr)) return false;
      } else if (fechaFiltro === "7dias") {
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        const fechaF = new Date(fechaRegistroStr);
        if (isNaN(fechaF.getTime()) || fechaF < hace7Dias) return false;
      } else if (fechaFiltro === "este_mes") {
        const mesActualStr = new Date().toISOString().substring(0, 7);
        if (!fechaRegistroStr.startsWith(mesActualStr)) return false;
      } else if (fechaFiltro === "personalizado") {
        if (fechaInicio && fechaRegistroStr < fechaInicio) return false;
        if (fechaFin && fechaRegistroStr > fechaFin) return false;
      }

      return true;
    });
  }, [facturasIniciales, busqueda, fechaFiltro, fechaInicio, fechaFin]);

  // Totales acumulados reactivos
  const resumenTotales = useMemo(() => {
    return facturasFiltradas.reduce(
      (acc, f) => {
        const { subtotal, iva, impoconsumo, totalFactura, descuento } = obtenerTotalesFactura(f);
        const cantItems = f.items?.length || 0;
        return {
          totalSubtotal: acc.totalSubtotal + subtotal,
          totalDescuento: acc.totalDescuento + descuento,
          totalIva: acc.totalIva + iva,
          totalImpoconsumo: acc.totalImpoconsumo + impoconsumo,
          totalFacturas: acc.totalFacturas + totalFactura,
          totalItemsCount: acc.totalItemsCount + cantItems,
        };
      },
      { totalSubtotal: 0, totalDescuento: 0, totalIva: 0, totalImpoconsumo: 0, totalFacturas: 0, totalItemsCount: 0 }
    );
  }, [facturasFiltradas]);

  return (
    <Card className="overflow-hidden">
      {/* Tarjetas de Resumen KPI de Totales e IVA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-slate-50/80 border-b border-slate-100">
        {/* Total Facturas */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Receipt className="w-3.5 h-3.5 text-slate-400" /> Registradas
          </div>
          <div className="text-xl font-serif font-bold text-slate-900">
            {facturasFiltradas.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
            {resumenTotales.totalItemsCount} ítems
          </div>
        </div>

        {/* Subtotal (Sin Impuestos) */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Subtotal (Sin Impuestos)
          </div>
          <div className="text-lg font-bold text-slate-800">
            {formatCurrency(resumenTotales.totalSubtotal)}
          </div>
          {resumenTotales.totalDescuento > 0 ? (
            <div className="text-[10px] text-rose-600 font-medium">
              Desc: -{formatCurrency(resumenTotales.totalDescuento)}
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Base imponible</div>
          )}
        </div>

        {/* IVA Total Descontable */}
        <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-800 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Percent className="w-3.5 h-3.5 text-[#038C3E]" /> IVA Descontable
          </div>
          <div className="text-lg font-black text-[#038C3E]">
            {formatCurrency(resumenTotales.totalIva)}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
            IVA acumulado
          </div>
        </div>

        {/* Impoconsumo */}
        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Percent className="w-3.5 h-3.5 text-amber-700" /> Impoconsumo
          </div>
          <div className="text-lg font-bold text-amber-800">
            {formatCurrency(resumenTotales.totalImpoconsumo)}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
            Impuesto al consumo
          </div>
        </div>

        {/* Total Facturado */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Total Compra
          </div>
          <div className="text-lg font-bold text-slate-900">
            {formatCurrency(resumenTotales.totalFacturas)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Total con impuestos</div>
        </div>
      </div>

      {/* Filter bar responsiva con multilínea para dispositivos móviles y tablets */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° factura, CUFE, NIT..."
              leftIcon={<Search className="w-4 h-4" />}
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Limpiar búsqueda"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selector Rápido de Fecha de Registro */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1" title="Filtrando por Fecha de Registro en el sistema">
              <Calendar className="w-3.5 h-3.5 text-[#038C3E]" /> Reg:
            </span>
            <button
              type="button"
              onClick={() => setFechaFiltro("todas")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                fechaFiltro === "todas"
                  ? "bg-[#038C3E] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFechaFiltro("hoy")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                fechaFiltro === "hoy"
                  ? "bg-[#038C3E] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setFechaFiltro("ayer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                fechaFiltro === "ayer"
                  ? "bg-[#038C3E] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => setFechaFiltro("7dias")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                fechaFiltro === "7dias"
                  ? "bg-[#038C3E] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Últimos 7 días
            </button>
            <button
              type="button"
              onClick={() => setFechaFiltro("este_mes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                fechaFiltro === "este_mes"
                  ? "bg-[#038C3E] text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => setFechaFiltro(fechaFiltro === "personalizado" ? "todas" : "personalizado")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                fechaFiltro === "personalizado"
                  ? "bg-slate-800 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Rango
            </button>
          </div>
        </div>

        {/* Fila Inferior: Rango de Fechas Personalizado y Contador */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {fechaFiltro === "personalizado" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Desde:</span>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-36 text-xs"
                title="Fecha Inicial"
              />
              <span className="text-xs text-slate-500 font-medium">Hasta:</span>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-36 text-xs"
                title="Fecha Final"
              />
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium ml-auto">
            {(busqueda || fechaFiltro !== "todas" || fechaInicio || fechaFin) && (
              <button
                type="button"
                onClick={resetFiltros}
                className="text-xs text-slate-500 hover:text-rose-600 underline font-semibold transition-colors"
              >
                Restablecer filtros
              </button>
            )}
            <div>
              Mostrando <span className="font-bold text-slate-800">{facturasFiltradas.length}</span> de <span className="font-bold text-slate-800">{facturasIniciales.length}</span> facturas
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Facturas */}
      {facturasIniciales.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">No hay facturas registradas aún</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Cuando Hermes IA procese facturas de compra o agregues una nueva, aparecerán listadas aquí con su desglose de IVA, Impoconsumo y CUFE.
          </p>
        </div>
      ) : facturasFiltradas.length === 0 ? (
        <div className="p-10 text-center text-xs text-slate-500 space-y-2">
          <Search className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700">No se encontraron facturas coincidentes</p>
          <p>Prueba buscando con otro término o limpia la barra de búsqueda.</p>
          <button
            type="button"
            onClick={resetFiltros}
            className="text-xs font-semibold text-[#038C3E] hover:underline pt-1 inline-block"
          >
            Limpiar Búsqueda
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600 min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] z-10 shadow-2xs">
              <tr>
                <th className="p-4 whitespace-nowrap cursor-help" title="Número consecutivo oficial asignado a la factura electrónica por el proveedor emisor y código CUFE DIAN">N° Factura</th>
                <th className="p-4 whitespace-nowrap cursor-help" title="Fecha oficial en la que el emisor expidió el comprobante fiscal">Fecha Emisión</th>
                <th className="p-4 whitespace-nowrap cursor-help" title="Fecha y hora exacta en la que la factura fue registrada en el sistema de la cigarrería">Fecha Registro</th>
                <th className="p-4 whitespace-nowrap cursor-help" title="Razón social del proveedor o emisor comercial y número de NIT">Proveedor</th>
                <th className="p-4 whitespace-nowrap cursor-help" title="Monto acumulado de la compra sin incluir IVA ni impuestos al consumo">Subtotal (Sin Impuestos)</th>
                <th className="p-4 whitespace-nowrap cursor-help" title="Desglose tributario de IVA descontable pagado en compras e Impoconsumo">Impuestos</th>
                <th className="p-4 whitespace-nowrap cursor-help" title="Monto total final facturado a pagar con todos los impuestos incluidos">Total Factura</th>
                <th className="p-4 text-center whitespace-nowrap cursor-help" title="Cantidad total de productos o líneas registradas en la factura">Líneas</th>
                <th className="p-4 text-right whitespace-nowrap cursor-help" title="Opciones disponibles: Ver detalle completo, corregir datos o eliminar registro">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facturasFiltradas.map((factura) => {
                const { subtotal, iva, impoconsumo, totalFactura } = obtenerTotalesFactura(factura);

                return (
                  <tr key={factura.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-800 font-mono whitespace-nowrap">
                      <Link
                        href={`/contabilidad/facturas/${factura.id}`}
                        className="hover:text-[#038C3E] hover:underline"
                      >
                        {factura.numeroFactura}
                      </Link>
                      {factura.cufe && (
                        <div className="mt-1">
                          <BotonCopiarCufe cufe={factura.cufe} />
                        </div>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(factura.fechaEmision)}</span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5" title="Fecha de creación/ingreso en la base de datos">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(factura.creadoEn)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {factura.proveedor?.razonSocial || "Proveedor General"}
                      </div>
                      {factura.proveedor?.nit && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          NIT: {factura.proveedor.nit}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(subtotal)}</td>
                    <td className="p-4">
                      <div className="text-emerald-700 font-medium">
                        IVA: {formatCurrency(iva)}
                      </div>
                      {impoconsumo > 0 && (
                        <div className="text-[10px] text-amber-700 font-medium">
                          Impoconsumo: {formatCurrency(impoconsumo)}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {formatCurrency(totalFactura)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="neutral" className="bg-slate-100 text-slate-700 font-mono">
                        {factura.items?.length || 0}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/contabilidad/facturas/${factura.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#038C3E] hover:text-[#067335] bg-[#A7D9BD]/20 hover:bg-[#A7D9BD]/35 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </Link>
                        <ModalEditarFactura
                          factura={factura}
                          variant="icon"
                        />
                        <BotonEliminarFactura
                          facturaId={factura.id}
                          numeroFactura={factura.numeroFactura}
                          variant="table"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-900 text-white font-bold text-xs border-t border-slate-800 z-10 shadow-lg">
              <tr>
                <td colSpan={4} className="p-4 text-right font-bold uppercase tracking-wider text-[10px] text-slate-300">
                  TOTALES ACUMULADOS ({facturasFiltradas.length} FACTURAS):
                </td>
                <td className="p-4 font-semibold text-slate-200">
                  {formatCurrency(resumenTotales.totalSubtotal)}
                </td>
                <td className="p-4">
                  <div className="text-emerald-300 font-bold">
                    IVA: {formatCurrency(resumenTotales.totalIva)}
                  </div>
                  {resumenTotales.totalImpoconsumo > 0 && (
                    <div className="text-[10px] text-amber-300 font-semibold">
                      Impoconsumo: {formatCurrency(resumenTotales.totalImpoconsumo)}
                    </div>
                  )}
                </td>
                <td className="p-4 font-black text-emerald-400 text-sm">
                  {formatCurrency(resumenTotales.totalFacturas)}
                </td>
                <td className="p-4 text-center">
                  <Badge variant="neutral" className="bg-slate-800 text-slate-200 border-slate-700">
                    {resumenTotales.totalItemsCount} items
                  </Badge>
                </td>
                <td className="p-4 text-right" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Card>
  );
}

