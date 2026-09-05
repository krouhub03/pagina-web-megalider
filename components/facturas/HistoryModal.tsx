import { X, CheckCircle2, Calendar, FileText, Building2, DollarSign } from "lucide-react";

export default function HistoryModal({ factura, onClose }: any) {
  if (!factura) return null;

  // Asegurar que los datos vienen en snake_case del backend
  const datos = factura.datosExtraidos ? 
    (typeof factura.datosExtraidos === 'string' 
      ? JSON.parse(factura.datosExtraidos) 
      : factura.datosExtraidos
    ) : factura;

  const facturaDatos = datos.factura_compra || datos;

  // Datos consolidados
  const tipoDocumento = facturaDatos.tipo_documento || "No especificado";
  const numeroFactura = facturaDatos.numero_factura || "—";
  const fechaEmision = facturaDatos.fecha_emision 
    ? new Date(facturaDatos.fecha_emision).toLocaleDateString('es-CO')
    : "—";
  
  const proveedor = facturaDatos.proveedor || {};
  const clienteReceptor = facturaDatos.cliente_receptor || {};
  
  const items = facturaDatos.items || [];
  const totales = facturaDatos.totales || {};
  
  const subtotal = Number(totales.subtotal || 0);
  const descuento = Number(totales.descuento_total_factura || 0);
  const iva5 = Number(totales.iva_5 || 0);
  const iva19 = Number(totales.iva_19 || 0);
  const ivaTotal = iva5 + iva19;
  const impoconsumo = Number(totales.impoconsumo_total || 0);
  const otrosImpuestos = Number(totales.otros_impuestos_total || 0);
  const totalFactura = Number(totales.total_factura || 0);

  // Observaciones
  const observacionesAuditoria = factura.observacionAuditoria || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-800">Factura Consolidada</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">Documento aprobado en auditoría - Inmutable (Solo lectura)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Split View */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Lado Izquierdo: Imagen */}
          <div className="w-1/2 bg-gray-100 flex flex-col items-center justify-center overflow-y-auto border-r border-gray-200 p-6">
            {factura.archivoUrl || factura.archivos?.[0]?.url ? (
              <div className="max-w-full h-auto">
                <img 
                  src={factura.archivoUrl || factura.archivos?.[0]?.url} 
                  alt="Documento original" 
                  className="max-w-full h-auto object-contain rounded-xl shadow-lg border border-gray-300"
                />
              </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-500" />
                </div>
                <span className="text-base font-semibold">Sin imagen adjunta</span>
                <span className="text-sm">El documento no tiene archivo</span>
              </div>
            )}
          </div>

          {/* Lado Derecho: Datos Consolidados */}
          <div className="w-1/2 overflow-y-auto p-6 bg-white space-y-6">
            
            {/* Sección: Información del Documento */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Información del Documento
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Tipo de Documento</p>
                  <p className="font-semibold text-gray-800">{tipoDocumento}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">N° Factura</p>
                  <p className="font-semibold text-gray-800 font-mono">{numeroFactura}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Fecha de Emisión</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-semibold text-gray-800">{fechaEmision}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Categoría</p>
                  <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {factura.categoria || "INVENTARIO"}
                  </span>
                </div>
              </div>

              {facturaDatos.cufe && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium mb-1.5">CUFE</p>
                  <p className="font-mono text-xs text-gray-600 break-all bg-white p-2 rounded border border-gray-200">
                    {facturaDatos.cufe}
                  </p>
                </div>
              )}
            </div>

            {/* Sección: Proveedor y Cliente */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Proveedor y Receptor
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Razón Social (Proveedor)</p>
                  <p className="font-semibold text-gray-800">{proveedor.razon_social || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">NIT Proveedor</p>
                  <p className="font-semibold text-gray-800 font-mono">{proveedor.nit || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Receptor (Cliente)</p>
                  <p className="font-semibold text-gray-800">{clienteReceptor.nombre || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">NIT/CC Receptor</p>
                  <p className="font-semibold text-gray-800 font-mono">{clienteReceptor.documento || "—"}</p>
                </div>
              </div>
            </div>

            {/* Sección: Condiciones de Pago */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                Condiciones Comerciales
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Medio de Pago</p>
                  <p className="font-semibold text-gray-800">{facturaDatos.condiciones_comerciales?.medio_pago || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Plazo (Días)</p>
                  <p className="font-semibold text-gray-800">
                    {facturaDatos.condiciones_comerciales?.plazo_dias || "0"} días
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1.5">Estado de Pago</p>
                  <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                    factura.estadoPago === 'PAGADA' 
                      ? 'bg-green-100 text-green-800' 
                      : factura.estadoPago === 'PENDIENTE' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {factura.estadoPago || "PENDIENTE"}
                  </span>
                </div>
              </div>
            </div>

            {/* Sección: Ítems */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Detalle de Productos</h3>
              
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Descripción
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
                        Cant.
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">
                        Costo Unit.
                      </th>
                      <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length > 0 ? (
                      items.map((item: any, idx: number) => {
                        const cantidad = Number(item.cantidad_ingresada || 0);
                        const costoUnit = Number(item.costo_unitario_compra || 0);
                        const costoTotal = Number(item.costo_total_linea || 0);
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-gray-800 font-medium">
                              {item.nombreProducto || item.nombre_producto || item.descripcion || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-center font-semibold">
                              {cantidad}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-right font-mono">
                              ${costoUnit.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-4 py-3 text-gray-800 text-right font-bold font-mono">
                              ${costoTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                          No hay ítems registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sección: Totales */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white">
              <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Resumen de Totales
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <span className="font-mono font-semibold text-gray-800">
                    ${subtotal.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                  </span>
                </div>

                {descuento > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Descuento:</span>
                    <span className="font-mono font-semibold text-red-600">
                      -${descuento.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {iva5 > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">IVA 5%:</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      ${iva5.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {iva19 > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">IVA 19%:</span>
                    <span className="font-mono font-semibold text-emerald-600">
                      ${iva19.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {impoconsumo > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Impoconsumo:</span>
                    <span className="font-mono font-semibold text-amber-600">
                      ${impoconsumo.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {otrosImpuestos > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Otros Impuestos:</span>
                    <span className="font-mono font-semibold text-purple-600">
                      ${otrosImpuestos.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-300 my-3 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-lg">Total Factura:</span>
                    <span className="font-mono font-bold text-emerald-700 text-2xl">
                      ${totalFactura.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones de Auditoría */}
            {observacionesAuditoria && (
              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Observaciones de Auditoría</h3>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{observacionesAuditoria}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}