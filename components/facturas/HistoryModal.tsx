"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  CheckCircle2,
  Calendar,
  FileText,
  Building2,
  DollarSign,
  Wallet,
  Scale,
  Loader2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
} from "lucide-react";

export default function HistoryModal({ factura, onClose }: { factura: any; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"detalle" | "contabilidad">("detalle");
  const [asientos, setAsientos] = useState<any[]>([]);
  const [isLoadingAsientos, setIsLoadingAsientos] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Estados de Zoom, Panning y Rotación Interactiva
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const imagesList = useMemo(() => {
    const list: string[] = [];
    if (factura?.archivoUrl) list.push(factura.archivoUrl);
    if (Array.isArray(factura?.archivos)) {
      factura.archivos.forEach((a: any) => {
        const src = a.datosBase64 || a.url;
        if (src && !list.includes(src)) list.push(src);
      });
    }
    return list;
  }, [factura]);

  const currentImage = imagesList[selectedImageIndex] || imagesList[0] || null;

  // Reset de Zoom al cambiar de página o factura
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  }, [selectedImageIndex, factura?.id]);

  // Manejador de Zoom centrado en el punto del cursor con la rueda del ratón (Wheel)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;

    const zoomStep = e.deltaY < 0 ? 1.18 : 0.85;
    const newZoom = Math.min(Math.max(1, zoom * zoomStep), 5);

    if (newZoom === zoom) return;

    if (newZoom <= 1.01) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    const scaleChange = newZoom / zoom;
    const newX = cursorX - (cursorX - position.x) * scaleChange;
    const newY = cursorY - (cursorY - position.y) * scaleChange;

    setZoom(newZoom);
    setPosition({ x: newX, y: newY });
  };

  // Manejadores de Arrastre (Pan)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1 && e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoom > 1.2) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;
      const newZoom = 2.4;
      const scaleChange = newZoom / zoom;
      const newX = cursorX - (cursorX - position.x) * scaleChange;
      const newY = cursorY - (cursorY - position.y) * scaleChange;
      setZoom(newZoom);
      setPosition({ x: newX, y: newY });
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.25, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1, prev / 1.25);
      if (next <= 1.01) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  useEffect(() => {
    if (factura?.id) {
      setIsLoadingAsientos(true);
      fetch(`/api/contabilidad/asientos?facturaId=${factura.id}`)
        .then((r) => r.json())
        .then((json) => setAsientos(json?.data || []))
        .catch(console.error)
        .finally(() => setIsLoadingAsientos(false));
    }
  }, [factura?.id]);

  if (!factura) return null;

  // Asegurar que los datos vienen en snake_case del backend
  const datos = factura.datosExtraidos ? 
    (typeof factura.datosExtraidos === 'string' 
      ? JSON.parse(factura.datosExtraidos) 
      : factura.datosExtraidos
    ) : factura;

  const facturaDatos = datos.factura_compra || datos;

  const esRemision =
    factura.estadoRemision === "PENDIENTE_FACTURAR" ||
    factura.tipoDocumento === "REMISIÓN" ||
    facturaDatos?.tipo_documento === "REMISIÓN" ||
    factura.tipoOperacion?.esRemision;

  // Datos consolidados
  const tipoDocumento =
    factura.tipoDocumento ||
    facturaDatos.tipo_documento ||
    facturaDatos.tipoDocumento ||
    (factura.cufe || facturaDatos.cufe ? "Factura Electrónica de Venta" : "Factura de Venta");
  const numeroFactura = factura.numeroFactura || facturaDatos.numero_factura || facturaDatos.numeroFactura || "—";
  const fechaEmision = facturaDatos.fecha_emision 
    ? new Date(facturaDatos.fecha_emision).toLocaleDateString('es-CO')
    : (factura.fechaEmision ? new Date(factura.fechaEmision).toLocaleDateString('es-CO') : "—");
  
  const proveedor = facturaDatos.proveedor || factura.proveedor || {};
  const clienteReceptor = facturaDatos.cliente_receptor || {};
  
  const items = facturaDatos.items || factura.items || [];
  const totales = facturaDatos.totales || {};
  
  const subtotal = Number(totales.subtotal || factura.subtotal || 0);
  const descuento = Number(totales.descuento_total_factura || factura.descuentoTotalFactura || 0);
  const iva5 = Number(totales.iva_5 || 0);
  const iva19 = Number(totales.iva_19 || factura.iva || 0);
  const impoconsumo = Number(totales.impoconsumo_total || factura.impoconsumo || 0);
  const otrosImpuestos = Number(totales.otros_impuestos_total || factura.otrosImpuestosTotal || 0);
  const totalFactura = Number(totales.total_factura || factura.totalFactura || 0);

  const observacionesAuditoria = factura.observaciones || facturaDatos.observaciones || "";

  const totalDebitos = asientos.reduce((acc, a) => acc + Number(a.debito || 0), 0);
  const totalCreditos = asientos.reduce((acc, a) => acc + Number(a.credito || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-800">Factura Consolidada #{numeroFactura}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Estado: <span className="font-semibold text-emerald-700">{factura.estadoContable || "CONSOLIDADA"}</span> | {proveedor.razon_social || proveedor.razonSocial || "Proveedor"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tabs Selector */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("detalle")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === "detalle" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                📋 Detalle de Compra
              </button>
              <button
                onClick={() => setActiveTab("contabilidad")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === "contabilidad" ? "bg-[#044a23] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                📖 Libro Diario (NIIF)
              </button>
            </div>

            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body - Split View */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Lado Izquierdo: Visor de Imagen Interactivo (Zoom en Cursor + Pan) */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className={`w-1/2 bg-gray-900/95 flex items-center justify-center overflow-hidden border-r border-gray-200 relative select-none ${
              zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
            }`}
          >
            {/* Barra de Herramientas Flotante de Zoom */}
            {currentImage && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 shadow-lg text-white text-xs">
                <span className="font-mono text-[11px] font-bold px-1 text-emerald-400">
                  {Math.round(zoom * 100)}%
                </span>
                <div className="h-3 w-px bg-white/20 mx-0.5" />
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Acercar (+)"
                  className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer text-white"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Alejar (-)"
                  className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer text-white"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Girar 90°"
                  className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer text-white"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  title="Ajustar / Restablecer (100%)"
                  className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer text-emerald-300"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Paginador Inferior si hay múltiples hojas */}
            {imagesList.length > 1 && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg text-white text-xs font-semibold">
                <span className="text-gray-300 text-[11px] mr-1">Página:</span>
                {imagesList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition cursor-pointer ${
                      selectedImageIndex === idx
                        ? "bg-[#044a23] text-white font-bold ring-2 ring-emerald-400"
                        : "bg-white/20 text-gray-200 hover:bg-white/30"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Indicador de ayuda al pie */}
            {currentImage && (
              <div className="absolute bottom-3 left-4 z-20 pointer-events-none text-[11px] text-white/60 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-md">
                Rueda del ratón: Zoom en punto • Arrastrar: Mover • Doble clic: Alternar zoom
              </div>
            )}

            {/* Renderizado de la Imagen con Transformaciones Dinámicas */}
            {currentImage ? (
              <div
                className="w-full h-full flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 140ms ease-out",
                }}
              >
                <img
                  src={currentImage}
                  alt="Documento original escaneado"
                  draggable={false}
                  className="max-w-[92%] max-h-[88vh] object-contain rounded-lg shadow-2xl pointer-events-none"
                />
              </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-500" />
                </div>
                <span className="text-base font-semibold text-gray-300">Sin imagen adjunta</span>
                <span className="text-sm text-gray-500">El documento no tiene archivo digitalizado</span>
              </div>
            )}
          </div>

          {/* Lado Derecho: Contenido por Pestañas */}
          <div className="w-1/2 overflow-y-auto p-6 bg-white space-y-6">
            
            {activeTab === "detalle" ? (
              <>
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
                      <p className="text-xs text-gray-500 font-medium mb-1.5">Destino / Operación</p>
                      <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        {factura.tipoOperacion?.nombre || factura.categoria || "INVENTARIO"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sección: Proveedor */}
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    Proveedor
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1.5">Razón Social</p>
                      <p className="font-semibold text-gray-800">{proveedor.razon_social || proveedor.razonSocial || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1.5">NIT</p>
                      <p className="font-semibold text-gray-800 font-mono">{proveedor.nit || "—"}</p>
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
                            Producto
                          </th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">
                            Cant.
                          </th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">
                            Costo Unit.
                          </th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide text-right">
                            Total Línea
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 text-gray-800 font-medium">
                              {item.nombreProducto || item.nombre_producto || item.descripcion || "—"}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-center font-semibold">
                              {item.cantidad_ingresada || item.cantidadIngresada}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-right font-mono">
                              ${Number(item.costo_unitario_compra || item.costoUnitarioCompra || 0).toLocaleString('es-CO')}
                            </td>
                            <td className="px-4 py-3 text-gray-800 text-right font-bold font-mono">
                              ${Number(item.costo_total_linea || item.costoTotalLinea || 0).toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sección: Totales */}
                <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-white space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Subtotal Base:</span>
                    <span className="font-mono font-semibold">${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  {iva19 > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">IVA Total:</span>
                      <span className="font-mono font-semibold text-emerald-600">${iva19.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  {impoconsumo > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">Impoconsumo:</span>
                      <span className="font-mono font-semibold text-amber-600">${impoconsumo.toLocaleString('es-CO')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-base">Total Factura:</span>
                    <span className="font-mono font-bold text-emerald-700 text-2xl">
                      ${totalFactura.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* PESTAÑA LIBRO DIARIO (SOLO LECTURA) */
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* Resumen de Estado */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Scale className="w-5 h-5 text-[#044a23]" />
                    <div>
                      <h4 className="font-bold text-gray-800 text-xs">Comprobante de Diario (Partida Doble NIIF)</h4>
                      <p className="text-[11px] text-gray-500">
                        {asientos.length > 0
                          ? `Visualizando ${asientos.length} registros contables en firme.`
                          : "Factura pendiente de registrar comprobante."}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                    {factura.estadoContable || "CONCILIADA"}
                  </span>
                </div>

                {/* Libro Diario: Asientos Contables */}
                <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-2xs space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                      <span>Líneas Contables Registradas</span>
                    </h3>
                    <span className="text-[11px] font-mono text-gray-400">
                      {asientos.length} registros
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                          <th className="px-3 py-2 text-left">Cuenta PUC</th>
                          <th className="px-3 py-2 text-left">Concepto</th>
                          <th className="px-3 py-2 text-right">Débito</th>
                          <th className="px-3 py-2 text-right">Crédito</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                        {asientos.length > 0 ? (
                          asientos.map((a, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-blue-700 font-bold">
                                {a.cuentaPuc}
                              </td>
                              <td className="px-3 py-2 text-gray-700 font-sans">
                                {a.concepto}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                                {Number(a.debito) > 0 ? `$${Number(a.debito).toLocaleString('es-CO')}` : "—"}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-purple-700">
                                {Number(a.credito) > 0 ? `$${Number(a.credito).toLocaleString('es-CO')}` : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-3 py-8 text-center text-gray-400 font-sans">
                              {isLoadingAsientos ? (
                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                  <Loader2 className="w-4 h-4 animate-spin text-[#044a23]" />
                                  <span>Cargando asientos contables...</span>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-semibold text-gray-600 mb-1">No hay asientos contables registrados todavía.</p>
                                  <p className="text-[11px] text-gray-400">Puedes generar y asentar el movimiento contable usando el botón "Conciliar" en la tabla principal.</p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {asientos.length > 0 && (
                        <tfoot>
                          <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-[11px]">
                            <td colSpan={2} className="px-3 py-2 text-right font-sans">
                              SUMAS IGUALES:
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-800">
                              ${totalDebitos.toLocaleString('es-CO')}
                            </td>
                            <td className="px-3 py-2 text-right text-purple-800">
                              ${totalCreditos.toLocaleString('es-CO')}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}