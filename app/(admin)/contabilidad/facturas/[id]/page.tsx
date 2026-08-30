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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BotonCopiarCufe } from "../BotonCopiarCufe";
import { BotonEliminarFactura } from "../BotonEliminarFactura";
import { ModalEditarFactura } from "../ModalEditarFactura";
import { ModalEditarFacturaItem } from "../ModalEditarFacturaItem";

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

  const subtotal = Number(factura.subtotal || 0) || (totalLineasCalculado - totalIvaItems - totalImpoconsumoItems - totalOtrosImpItems);
  const iva = Number(factura.iva || 0) || totalIvaItems;
  const impoconsumo = Number(factura.impoconsumo || 0) || totalImpoconsumoItems;
  const ibuaIpcu = Number(factura.ibuaIpcu || 0);
  const otrosImpuestos = Number(factura.otrosImpuestosTotal || 0) || totalOtrosImpItems;
  const descuentoTotal = Number(factura.descuentoTotalFactura || 0) || totalDescuentosItems;
  const totalFactura = Number(factura.totalFactura || 0) || totalLineasCalculado;

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
              <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
                Factura {factura.numeroFactura}
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
          <ModalEditarFactura
            factura={factura}
            variant="full"
          />
          <BotonEliminarFactura
            facturaId={factura.id}
            numeroFactura={factura.numeroFactura}
            redirectOnSuccess="/contabilidad/facturas"
            variant="full"
          />
        </div>
      </div>

      {/* Grid de Resumen: Proveedor y Datos Fiscales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tarjeta 1: Proveedor y Adquiriente */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#038C3E]" /> Proveedor & Adquiriente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
      </div>



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
          <ModalEditarFacturaItem
            mode="create"
            facturaId={factura.id}
          />
        </div>

        {!factura.items || factura.items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Esta factura no cuenta con líneas de producto registradas.</p>
            <p className="text-slate-400">Puedes agregar productos manualmente haciendo clic en el botón inferior.</p>
            <ModalEditarFacturaItem
              mode="create"
              facturaId={factura.id}
            />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] z-10 shadow-2xs">
                <tr>
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">Código / Ref.</th>
                  <th className="p-3.5">Descripción Producto</th>
                  <th className="p-3.5 text-center">Cantidad</th>
                  <th className="p-3.5 text-right">Costo Unitario</th>
                  <th className="p-3.5 text-right">Desc.</th>
                  <th className="p-3.5 text-right">IVA (%)</th>
                  <th className="p-3.5 text-right">Impoconsumo</th>
                  <th className="p-3.5 text-right">Otros Imp.</th>
                  <th className="p-3.5 text-right">Total Línea</th>
                  <th className="p-3.5 text-center w-14">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {factura.items.map((item, index) => {
                  const cantidad = Number(item.cantidadIngresada || 0);
                  const costoUnitario = Number(item.costoUnitarioCompra || 0);
                  const descuento = Number(item.descuentoPorProducto || 0);
                  const ivaTotal = Number(item.ivaTotal || 0);
                  const impoConsumoItem = Number(item.impuestoConsumo || 0);
                  const otrosImp = Number(item.otrosImpuestos || 0);
                  const totalLinea = Number(item.costoTotalLinea || 0);

                  return (
                    <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-700">
                        {item.codigoBarras || item.codigoProveedor || "-"}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {item.descripcion}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-900">
                        {cantidad} {item.unidadMedida ? <span className="text-[10px] text-slate-500 font-normal">{item.unidadMedida}</span> : ""}
                      </td>
                      <td className="p-3.5 text-right font-medium">
                        {formatCurrency(costoUnitario)}
                      </td>
                      <td className="p-3.5 text-right text-slate-500">
                        {descuento > 0 ? formatCurrency(descuento) : "-"}
                      </td>
                      <td className="p-3.5 text-right text-emerald-700 font-medium">
                        {formatCurrency(ivaTotal)}
                        {Number(item.porcentajeIva || 0) > 0 && (
                          <span className="text-[10px] text-slate-400 block">
                            ({item.porcentajeIva}%)
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
                      </td>
                      <td className="p-3.5 text-center">
                        <ModalEditarFacturaItem
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
                  <td colSpan={4} className="p-3.5 text-right font-bold uppercase tracking-wider text-[10px] text-slate-300">
                    TOTALES ACUMULADOS:
                  </td>
                  <td className="p-3.5 text-right text-slate-200 font-semibold">
                    {formatCurrency(totalCostoBaseItems)}
                  </td>
                  <td className="p-3.5 text-right text-rose-400 font-semibold">
                    {totalDescuentosItems > 0 ? formatCurrency(totalDescuentosItems) : "-"}
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
