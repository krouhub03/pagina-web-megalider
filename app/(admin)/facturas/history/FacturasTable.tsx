"use client";

import { Loader2, Clock, Building2, Wallet, CheckCircle2, Eye, Scale, Edit, Trash2, Receipt } from "lucide-react";
import { FacturaHistorial } from "./types";

interface FacturasTableProps {
  facturas: FacturaHistorial[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onSelectFactura: (factura: FacturaHistorial) => void;
  onConciliarFactura: (factura: FacturaHistorial) => void;
  onEditarFactura: (factura: FacturaHistorial) => void;
  onEliminarFactura: (factura: FacturaHistorial) => void;
  onLimpiarFiltros: () => void;
}

export default function FacturasTable({
  facturas,
  isLoading,
  hasActiveFilters,
  onSelectFactura,
  onConciliarFactura,
  onEditarFactura,
  onEliminarFactura,
  onLimpiarFiltros,
}: FacturasTableProps) {
  return (
    <div>
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#067335]" />
          <p className="text-xs text-gray-500 font-medium">Cargando historial de compras...</p>
        </div>
      ) : facturas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-6">
          <div className="py-16 text-center text-gray-500">
            <div className="max-w-xs mx-auto flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="font-semibold text-gray-700 text-sm">No se encontraron facturas</p>
              <p className="text-xs text-gray-400">
                {hasActiveFilters
                  ? "No hay facturas aprobadas que coincidan con los criterios de búsqueda o filtros seleccionados."
                  : "Aún no se han aprobado facturas en el sistema. Puedes escanear y auditar documentos en 'Escanear Factura'."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={onLimpiarFiltros}
                  className="mt-2 text-xs font-semibold text-[#067335] hover:text-[#038C3E] hover:underline cursor-pointer"
                >
                  Restablecer todos los filtros
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* VISTA MÓVIL (Cards) - Visible solo en pantallas medianas y pequeñas (hidden md:block para la tabla) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {facturas.map((f) => {
              const estaConciliada = f.estadoContable === "CONCILIADA";

              return (
                <div
                  key={f.id}
                  className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs space-y-3 hover:border-[#067335]/40 transition-all"
                >
                  {/* Fila superior: Tipo de Documento, N° Factura y Estado Contable */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div>
                      <span className="px-2 py-0.5 bg-[#A7D9BD]/25 text-[#067335] border border-[#A7D9BD] text-[10px] font-bold rounded-md uppercase tracking-wide">
                        {f.tipoDocumento || (f.cufe ? "Factura Electrónica" : "Factura de Venta")}
                      </span>
                      <div className="font-mono text-gray-900 font-bold text-sm mt-1">
                        #{f.numeroFactura}
                      </div>
                    </div>
                    <div>
                      {estaConciliada ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#A7D9BD]/20 text-[#067335] border border-[#A7D9BD] rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-[#038C3E]" />
                          Conciliada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Por Conciliar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Datos del Proveedor y Fecha */}
                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-gray-900 flex items-start gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#067335] shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{f.proveedor?.razonSocial || "Proveedor General"}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 text-[11px]">
                      <span className="font-mono">NIT: {f.proveedor?.nit || "—"}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clasificación & Tesorería */}
                  <div className="bg-gray-50/70 p-2.5 rounded-lg space-y-1.5 text-xs border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Operación:</span>
                      {f.tipoOperacion ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200/70 rounded text-[11px] font-semibold">
                          {f.tipoOperacion.nombre}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-[11px] font-medium">Compra de Mercancía</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Pago / Tesorería:</span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-800 block">{f.medioPagoRel?.nombre || "Efectivo"}</span>
                        <span className="text-[10px] text-[#067335] font-medium">
                          {f.cuentaTesoreria ? f.cuentaTesoreria.nombreCuenta : "Sin cuenta asignada"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Total y Botones de Acción */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total Factura</span>
                      <span className="font-mono font-bold text-[#067335] text-base">
                        ${Number(f.totalFactura).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectFactura(f)}
                        className="p-2 bg-gray-50 hover:bg-[#067335] text-gray-600 hover:text-white border border-gray-200 hover:border-[#067335] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Ver Detalle"
                        aria-label="Ver Detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onConciliarFactura(f)}
                        className="p-2 bg-[#A7D9BD]/25 hover:bg-[#038C3E] text-[#067335] hover:text-white border border-[#A7D9BD] hover:border-[#038C3E] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Conciliar"
                        aria-label="Conciliar Factura"
                      >
                        <Scale className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEditarFactura(f)}
                        className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Editar"
                        aria-label="Editar Factura"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEliminarFactura(f)}
                        className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Eliminar"
                        aria-label="Eliminar Factura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA ESCRITORIO (Tabla) - Oculta en móvil, visible a partir de md */}
          <div className="hidden md:block bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="bg-[#067335]/5 border-b border-gray-200 text-[11px] uppercase text-gray-600 font-semibold tracking-wider">
                    <th className="px-4 py-3.5 cursor-help" title="Fecha en que el proveedor emitió el documento original">
                      Fecha Emisión
                    </th>
                    <th className="px-4 py-3.5 cursor-help" title="Razón social e identificación fiscal (NIT) del proveedor emisor">
                      Proveedor
                    </th>
                    <th className="px-4 py-3.5 cursor-help" title="Tipo de comprobante y número consecutivo oficial del documento">
                      Documento
                    </th>
                    <th className="px-4 py-3.5 cursor-help" title="Destino económico del gasto o inventario y su cuenta PUC de débito">
                      Tipo de Operación
                    </th>
                    <th className="px-4 py-3.5 cursor-help" title="Medio de pago utilizado y cuenta de tesorería (Caja o Banco) asociada">
                      Medio de Pago & Tesorería
                    </th>
                    <th className="px-4 py-3.5 text-center cursor-help" title="Estado de conciliación: Conciliada con cuenta de pago o Pendiente de asignar tesorería">
                      Estado Contable
                    </th>
                    <th className="px-4 py-3.5 text-right cursor-help" title="Importe total liquidado de la factura incluyendo impuestos">
                      Total Factura
                    </th>
                    <th className="px-4 py-3.5 text-center cursor-help" title="Acciones de gestión: Ver detalle, Conciliar tesorería, Editar datos o Eliminar">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {facturas.map((f) => {
                    const estaConciliada = f.estadoContable === "CONCILIADA";

                    return (
                      <tr key={f.id} className="hover:bg-emerald-50/20 transition-colors">
                        {/* 1. Fecha de Emisión */}
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{f.fechaEmision ? new Date(f.fechaEmision).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "—"}</span>
                          </div>
                        </td>

                        {/* 2. Proveedor */}
                        <td className="px-4 py-3.5 max-w-[220px]">
                          <div className="font-semibold text-gray-900 truncate flex items-center gap-1.5" title={f.proveedor?.razonSocial || "Proveedor General"}>
                            <Building2 className="w-3.5 h-3.5 text-[#067335] shrink-0" />
                            <span className="truncate">{f.proveedor?.razonSocial || "Proveedor General"}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            NIT: {f.proveedor?.nit || "—"}
                          </div>
                        </td>

                        {/* 3. Documento */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-[#A7D9BD]/25 text-[#067335] border border-[#A7D9BD] text-[10px] font-bold rounded-md uppercase tracking-wide">
                              {f.tipoDocumento || (f.cufe ? "Factura Electrónica" : "Factura de Venta")}
                            </span>
                          </div>
                          <div className="font-mono text-gray-800 font-bold text-xs mt-1">
                            #{f.numeroFactura}
                          </div>
                        </td>

                        {/* 4. Tipo de Operación */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {f.tipoOperacion ? (
                            <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200/70 rounded-lg text-xs font-semibold">
                              {f.tipoOperacion.nombre}
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                              Compra de Mercancía
                            </span>
                          )}
                        </td>

                        {/* 5. Medio de Pago y Cuenta de Tesorería */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-gray-900 text-xs">
                            <Wallet className="w-3.5 h-3.5 text-[#067335]" />
                            <span>{f.medioPagoRel?.nombre || "Efectivo"}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
                            {f.cuentaTesoreria ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#038C3E] shrink-0"></span>
                                <span className="font-medium text-[#067335]">{f.cuentaTesoreria.nombreCuenta}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 italic">Sin cuenta asignada</span>
                            )}
                          </div>
                        </td>

                        {/* 6. Estado Contable */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {estaConciliada ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A7D9BD]/20 text-[#067335] border border-[#A7D9BD] rounded-full text-xs font-bold shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#038C3E]" />
                              Conciliada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Por Conciliar
                            </span>
                          )}
                        </td>

                        {/* 7. Total Factura */}
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-[#067335] text-sm whitespace-nowrap">
                          ${Number(f.totalFactura).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>

                        {/* 8. Acciones */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onSelectFactura(f)}
                              className="p-2 bg-gray-50 hover:bg-[#067335] text-gray-600 hover:text-white border border-gray-200 hover:border-[#067335] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                              title="Ver Detalle de Compra y Comprobante Contable (Solo Lectura)"
                              aria-label="Ver Detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onConciliarFactura(f)}
                              className="p-2 bg-[#A7D9BD]/25 hover:bg-[#038C3E] text-[#067335] hover:text-white border border-[#A7D9BD] hover:border-[#038C3E] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                              title="Conciliar Tesorería y Retenciones en la Fuente"
                              aria-label="Conciliar Factura"
                            >
                              <Scale className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onEditarFactura(f)}
                              className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                              title="Modificar Factura, Items y Clasificación"
                              aria-label="Editar Factura"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onEliminarFactura(f)}
                              className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:scale-105"
                              title="Eliminar Factura del Historial"
                              aria-label="Eliminar Factura"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}