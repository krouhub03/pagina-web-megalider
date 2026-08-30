"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Receipt, Search, Building2, Calendar, Eye, XCircle } from "lucide-react";
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

export function FacturasTablaInteractive({
  facturasIniciales,
}: FacturasTablaInteractiveProps) {
  // Suscripción granular a Zustand
  const busqueda = useFacturasFiltrosStore((state) => state.busqueda);
  const setBusqueda = useFacturasFiltrosStore((state) => state.setBusqueda);
  const resetFiltros = useFacturasFiltrosStore((state) => state.resetFiltros);

  // Filtrado reactivo en memoria (cliente)
  const facturasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return facturasIniciales;
    const q = busqueda.toLowerCase().trim();
    return facturasIniciales.filter((f) => {
      const numMatch = f.numeroFactura?.toLowerCase().includes(q);
      const cufeMatch = f.cufe?.toLowerCase().includes(q);
      const provMatch = f.proveedor?.razonSocial?.toLowerCase().includes(q);
      const nitMatch = f.proveedor?.nit?.toLowerCase().includes(q);
      return numMatch || cufeMatch || provMatch || nitMatch;
    });
  }, [facturasIniciales, busqueda]);

  return (
    <Card className="overflow-hidden">
      {/* Filter bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="w-full max-w-md relative flex items-center gap-2">
          <div className="relative w-full">
            <Input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° factura, CUFE, proveedor o NIT..."
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
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          {busqueda && (
            <button
              type="button"
              onClick={resetFiltros}
              className="text-xs text-slate-500 hover:text-rose-600 underline font-semibold transition-colors"
            >
              Restablecer filtros
            </button>
          )}
          <div>
            Mostrando:{" "}
            <span className="font-bold text-slate-800">{facturasFiltradas.length}</span>{" "}
            de <span className="font-bold text-slate-800">{facturasIniciales.length}</span> facturas
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
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] z-10 shadow-2xs">
              <tr>
                <th className="p-4">N° Factura</th>
                <th className="p-4">Fecha Emisión</th>
                <th className="p-4">Proveedor</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4">Impuestos</th>
                <th className="p-4">Total Factura</th>
                <th className="p-4 text-center">Líneas</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {facturasFiltradas.map((factura) => (
                <tr key={factura.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-800 font-mono">
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
                  <td className="p-4 flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(factura.fechaEmision)}
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
                  <td className="p-4 font-medium">{formatCurrency(factura.subtotal)}</td>
                  <td className="p-4">
                    <div className="text-emerald-700 font-medium">
                      IVA: {formatCurrency(factura.iva)}
                    </div>
                    {Number(factura.impoconsumo || 0) > 0 && (
                      <div className="text-[10px] text-amber-700 font-medium">
                        Impoconsumo: {formatCurrency(factura.impoconsumo)}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-bold text-slate-900 text-sm">
                    {formatCurrency(factura.totalFactura)}
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant="neutral">
                      {factura.items?.length || 0} items
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
