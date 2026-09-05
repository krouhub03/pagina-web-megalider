"use client";

import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, Check, RefreshCw, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { DocumentImageEditor, DocumentImageEditorHandle } from "@/components/facturas/DocumentImageEditor";

/**
 * FÓRMULA DE VALIDACIÓN POR FILA:
 * Total Línea = (Cantidad × Costo Unitario) - Descuento + IVA + Impoconsumo + Otros Impuestos
 * 
 * VALIDACIONES GLOBALES:
 * - Subtotal = SUM(Cantidad × Costo Unitario de todas las filas)
 * - IVA Total = SUM(IVA de todas las filas)
 * - Total Factura = SUM(Total Línea de todas las filas)
 */

export default function AuditModal({ factura, onClose, onApprove, onDiscard, onUpdate }: any) {
  const [data, setData] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rescanFeedback, setRescanFeedback] = useState("");
  const [isRescanning, setIsRescanning] = useState(false);
  const [auditMetadata, setAuditMetadata] = useState<{
    observacionAuditoria: string;
    tipoOperacionId: number | null;
    medioPagoId: number | null;
  }>({
    observacionAuditoria: "",
    tipoOperacionId: null,
    medioPagoId: null,
  });
  const [proveedoresDB, setProveedoresDB] = useState<any[]>([]);
  const [mediosPagoDB, setMediosPagoDB] = useState<any[]>([]);
  const [tiposOperacionDB, setTiposOperacionDB] = useState<any[]>([]);
  const [showCreateProviderModal, setShowCreateProviderModal] = useState(false);
  const [newProviderData, setNewProviderData] = useState({ nit: "", razonSocial: "" });
  const [createProviderError, setCreateProviderError] = useState("");
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [showRescanModal, setShowRescanModal] = useState(false);
  
  const editorRef = useRef<DocumentImageEditorHandle>(null);

  const handleCreateProvider = async () => {
    setCreateProviderError("");
    if (!newProviderData.nit || !newProviderData.razonSocial) {
      setCreateProviderError("Por favor completa el NIT y la Razón Social.");
      return;
    }
    setIsCreatingProvider(true);
    try {
      const res = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProviderData)
      });
      if (res.ok) {
        const updatedProveedores = await fetch("/api/proveedores").then(r => r.json());
        setProveedoresDB(updatedProveedores);
        setData((prev: any) => ({
          ...prev,
          proveedor: { ...(prev.proveedor || {}), nit: newProviderData.nit, razon_social: newProviderData.razonSocial }
        }));
        setShowCreateProviderModal(false);
      } else {
        setCreateProviderError("Hubo un error al intentar crear el proveedor.");
      }
    } catch (e) {
      console.error(e);
      setCreateProviderError("Error de conexión con el servidor.");
    } finally {
      setIsCreatingProvider(false);
    }
  };

  useEffect(() => {
    fetch("/api/proveedores")
      .then(res => res.json())
      .then(data => setProveedoresDB(Array.isArray(data) ? data : []))
      .catch(console.error);
      
    fetch("/api/contabilidad/tesoreria?tipo=medios")
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.data || []);
        setMediosPagoDB(list);
        if (list.length > 0) {
          setAuditMetadata(prev => ({ ...prev, medioPagoId: prev.medioPagoId || list[0].id }));
        }
      })
      .catch(console.error);

    fetch("/api/contabilidad/tipos-operacion")
      .then(res => res.json())
      .then(json => {
        const list = json?.data || (Array.isArray(json) ? json : []);
        setTiposOperacionDB(list);
        if (list.length > 0) {
          setAuditMetadata(prev => ({ ...prev, tipoOperacionId: prev.tipoOperacionId || list[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (factura) {
      try {
        const parsed = typeof factura.datosExtraidos === 'string' ? JSON.parse(factura.datosExtraidos) : factura.datos_extraidos;
        setData(parsed.factura_compra || parsed);
      } catch (e) {
        console.error("Error parsing JSON", e);
      }
      setImages(factura.archivos || []);
      setRescanFeedback("");
    }
  }, [factura]);

  const handleRescan = async () => {
    if (!factura.id) return;
    setIsRescanning(true);
    setShowRescanModal(false);
    try {
      const allComposites = editorRef.current?.getAllCompositeDataUrls() || {};
      const drawings = editorRef.current?.getDrawings() || {};
      
      const annotatedImagesToSend: Array<{ index: number; dataUrl: string }> = [];
      Object.keys(drawings).forEach((key) => {
        const pageIdx = Number(key);
        if (drawings[pageIdx]?.length > 0 && allComposites[pageIdx]) {
          annotatedImagesToSend.push({ index: pageIdx, dataUrl: allComposites[pageIdx] });
        }
      });
      
      if (annotatedImagesToSend.length === 0) {
        const singleComposite = editorRef.current?.getCompositeDataUrl();
        if ((drawings[currentImageIndex]?.length || 0) > 0 && singleComposite) {
          annotatedImagesToSend.push({ index: currentImageIndex, dataUrl: singleComposite });
        }
      }

      const res = await fetch("/api/facturas/rescan-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaId: factura.id,
          currentData: data,
          feedback: rescanFeedback,
          annotatedImages: annotatedImagesToSend
        })
      });
      if (!res.ok) throw new Error("Error en el reescaneo");
      const result = await res.json();
      
      let finalData = null;
      if (result.data?.factura_compra) {
        finalData = result.data.factura_compra;
      } else if (result.data) {
        finalData = result.data;
      }
      
      if (finalData) {
        setData(finalData);
        if (onUpdate) onUpdate(finalData);
      }

      if (annotatedImagesToSend.length > 0) {
        setImages(prev => {
          const next = [...prev];
          annotatedImagesToSend.forEach(item => {
            if (next[item.index]) {
              next[item.index] = {
                ...next[item.index],
                datosBase64Censurada: item.dataUrl
              };
            }
          });
          return next;
        });
      }
      
      setRescanFeedback("");
      alert("¡Factura re-escaneada con éxito respetando tu censura y anotaciones!");
    } catch (err) {
      console.error(err);
      alert("Hubo un error al re-escanear.");
    } finally {
      setIsRescanning(false);
    }
  };

  const handleUpdateField = (field: string, value: string) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProvider = (field: string, value: string) => {
    setData((prev: any) => ({ 
      ...prev, 
      proveedor: { ...prev.proveedor, [field]: value } 
    }));
  };

  const handleUpdateClient = (field: string, value: string) => {
    setData((prev: any) => ({ 
      ...prev, 
      cliente_receptor: { ...(prev.cliente_receptor || {}), [field]: value } 
    }));
  };

  if (!data) return null;

  // ===== VALIDACIÓN DE FÓRMULAS =====
  // Cálculo del subtotal (Cantidad × Costo Unitario)
  const sumaCostoBase = data.items?.reduce((acc: number, item: any) => 
    acc + (Number(item.cantidad_ingresada || 0) * Number(item.costo_unitario_compra || 0)), 0) || 0;
  
  // Cálculo del total líneas (suma de Total Línea de cada fila)
  const sumaTotalLineas = data.items?.reduce((acc: number, item: any) => 
    acc + (Number(item.costo_total_linea) || 0), 0) || 0;

  // Suma de IVA de todas las filas
  const sumaIVA = data.items?.reduce((acc: number, item: any) => 
    acc + (Number(item.iva_total) || 0), 0) || 0;

  // Valores reportados en la factura
  const subtotalReportado = Number(data.totales?.subtotal || 0);
  const ivaReportado = Number(data.totales?.iva_19 || 0) + Number(data.totales?.iva_5 || 0);
  const totalReportado = Number(data.totales?.total_factura || 0);
  
  // Tolerancia de 1 para redondeos
  const warningSubtotal = Math.abs(sumaCostoBase - subtotalReportado) > 1;
  const warningIVA = Math.abs(sumaIVA - ivaReportado) > 1;
  const warningTotal = Math.abs(sumaTotalLineas - totalReportado) > 1;
  const mathWarning = warningSubtotal || warningIVA || warningTotal;
  
  // Bloqueo si la diferencia es mayor a 10
  const isSubtotalBlocked = Math.abs(sumaCostoBase - subtotalReportado) > 10;
  const isTotalBlocked = Math.abs(sumaTotalLineas - totalReportado) > 10;

  // Validación de campos críticos
  const missingCritical = !data.proveedor?.nit?.trim() || !data.proveedor?.razon_social?.trim() || 
                          !data.numero_factura?.trim() || !data.fecha_emision?.trim() || 
                          !data.items || data.items.length === 0;

  // Validación por fila
  let hasSevereRowError = false;
  data.items?.forEach((item: any) => {
    const cantidad = Number(item.cantidad_ingresada) || 0;
    const costoUnitario = Number(item.costo_unitario_compra) || 0;
    const descuento = Number(item.descuento_por_producto) || 0;
    const iva = Number(item.iva_total) || 0;
    const impoconsumo = Number(item.impoconsumo) || 0;
    const otrosImpuestos = Number(item.otros_impuestos) || 0;
    const totalLinea = Number(item.costo_total_linea) || 0;
    
    // Fórmula: (Cantidad × Costo) - Descuento + IVA + Impoconsumo + Otros
    const calculoLinea = (cantidad * costoUnitario) - descuento + iva + impoconsumo + otrosImpuestos;
    
    if (Math.abs(calculoLinea - totalLinea) > 10) {
      hasSevereRowError = true;
    }
  });

  const isMathBlocked = isSubtotalBlocked || isTotalBlocked || hasSevereRowError;
  
  // Validación de proveedor
  const currentNit = data.proveedor?.nit?.trim() || "";
  const currentName = data.proveedor?.razon_social?.trim() || "";
  
  const matchedProveedor = proveedoresDB.find(p => p.nit === currentNit);
  let proveedorStatus = "NEW";
  let dbNameHint = "";
  if (matchedProveedor) {
    dbNameHint = matchedProveedor.razonSocial;
    const dbNameLower = dbNameHint.toLowerCase();
    const currNameLower = currentName.toLowerCase();
    
    if (dbNameLower === currNameLower || dbNameLower.includes(currNameLower) || currNameLower.includes(dbNameLower)) {
      proveedorStatus = "MATCH";
    } else {
      proveedorStatus = "MISMATCH";
    }
  }

  const isProviderBlocked = proveedorStatus === "NEW";
  const canApprove = !missingCritical && !isMathBlocked && !isProviderBlocked;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Auditoría de Factura</h2>
            <p className="text-xs text-gray-500 mt-0.5">Verifica y corrige los datos extraídos antes de aprobar</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Split View) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Lado Izquierdo: Visor de Documento */}
          <div className="w-1/2 flex flex-col border-r border-gray-200 bg-gray-100">
            <DocumentImageEditor
              ref={editorRef}
              images={images}
              currentIndex={currentImageIndex}
              onIndexChange={setCurrentImageIndex}
              className="w-full h-full flex-1"
            />
          </div>

          {/* Lado Derecho: Formulario */}
          <div className="w-1/2 overflow-y-auto p-6 bg-white space-y-6">
            
            {/* Alerta de Discrepancia Matemática */}
            {mathWarning && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-900">Discrepancia Matemática Detectada</p>
                    <div className="text-red-800 text-xs mt-1 space-y-1">
                      {warningSubtotal && (
                        <p>• Subtotal calculado (${sumaCostoBase.toFixed(2)}) ≠ reportado (${subtotalReportado.toFixed(2)})</p>
                      )}
                      {warningIVA && (
                        <p>• IVA calculado (${sumaIVA.toFixed(2)}) ≠ reportado (${ivaReportado.toFixed(2)})</p>
                      )}
                      {warningTotal && (
                        <p>• Total calculado (${sumaTotalLineas.toFixed(2)}) ≠ reportado (${totalReportado.toFixed(2)})</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Proveedor y Cliente */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 text-sm">Proveedor y Receptor</h3>
                {currentNit && (
                  <div className="flex gap-2">
                    {proveedorStatus === "NEW" && (
                      <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        <AlertCircle className="w-3 h-3" /> Nuevo
                      </span>
                    )}
                    {proveedorStatus === "MATCH" && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Existe en BD
                      </span>
                    )}
                    {proveedorStatus === "MISMATCH" && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-medium" title={`BD registra: ${dbNameHint}`}>
                        <AlertTriangle className="w-3 h-3" /> Difiere
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-blue-700 mb-2">Selecciona proveedor registrado</label>
                  <select 
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                    onChange={(e) => {
                      const nit = e.target.value;
                      if (nit) {
                        const found = proveedoresDB.find(p => p.nit === nit);
                        if (found) {
                          handleUpdateProvider("nit", found.nit);
                          handleUpdateProvider("razon_social", found.razonSocial);
                        }
                      }
                    }}
                    value={proveedoresDB.some(p => p.nit === data.proveedor?.nit) ? data.proveedor?.nit : ""}
                  >
                    <option value="">— No está en la lista (ingresa abajo) —</option>
                    {proveedoresDB.map(p => (
                      <option key={p.nit} value={p.nit}>{p.razonSocial} ({p.nit})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">NIT del Proveedor</label>
                  <input 
                    type="text" 
                    value={data.proveedor?.nit || ""} 
                    onChange={(e) => handleUpdateProvider("nit", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      !data.proveedor?.nit ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 123456789"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Razón Social</label>
                  <input 
                    type="text" 
                    value={data.proveedor?.razon_social || ""} 
                    onChange={(e) => handleUpdateProvider("razon_social", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      !data.proveedor?.razon_social ? 'border-red-300 bg-red-50' : 
                      proveedorStatus === 'MISMATCH' ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de la empresa"
                  />
                  {proveedorStatus === "MISMATCH" && (
                    <p className="text-xs text-amber-700 mt-1 font-medium">💡 BD registra: {dbNameHint}</p>
                  )}
                  {proveedorStatus === "NEW" && currentNit && (
                    <button 
                      onClick={() => {
                        setNewProviderData({ nit: currentNit, razonSocial: data.proveedor?.razon_social || "" });
                        setShowCreateProviderModal(true);
                      }}
                      className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
                    >
                      + Crear Nuevo Proveedor
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">NIT/CC Receptor</label>
                  <input 
                    type="text" 
                    value={data.cliente_receptor?.documento || ""} 
                    onChange={(e) => handleUpdateClient("documento", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      !data.cliente_receptor?.documento || data.cliente_receptor?.documento !== '1032401381' ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                    }`}
                    placeholder="Documento"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre Receptor</label>
                  <input 
                    type="text" 
                    value={data.cliente_receptor?.nombre || ""} 
                    onChange={(e) => handleUpdateClient("nombre", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Documento */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-sm mb-4 pb-2 border-b border-gray-200">Datos del Documento</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de Documento</label>
                  <select 
                    value={data.tipo_documento || ""}
                    onChange={(e) => handleUpdateField("tipo_documento", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="Factura Electrónica">Factura Electrónica</option>
                    <option value="Factura POS">Factura POS</option>
                    <option value="Remision">Remisión</option>
                    <option value="Soporte de Entrega">Soporte de Entrega</option>
                    <option value="Nota Pedido">Nota Pedido</option>
                    <option value="">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">N° Factura</label>
                  <input 
                    type="text" 
                    value={data.numero_factura || ""} 
                    onChange={(e) => handleUpdateField("numero_factura", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      !data.numero_factura ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 00001234"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha Emisión</label>
                  <input 
                    type="date" 
                    value={(() => {
                      if (!data.fecha_emision) return "";
                      if (data.fecha_emision.includes('-')) return data.fecha_emision;
                      const parts = data.fecha_emision.split('/');
                      if (parts.length === 3) {
                        return parts[0].length === 4 
                          ? data.fecha_emision.replace(/\//g, '-')
                          : `${parts[2]}-${parts[1]}-${parts[0]}`;
                      }
                      return "";
                    })()} 
                    onChange={(e) => handleUpdateField("fecha_emision", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      !data.fecha_emision ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Fecha Vencimiento</label>
                  <input 
                    type="date" 
                    value={(() => {
                      if (!data.fecha_vencimiento) return "";
                      if (data.fecha_vencimiento.includes('-')) return data.fecha_vencimiento;
                      const parts = data.fecha_vencimiento.split('/');
                      if (parts.length === 3) {
                        return parts[0].length === 4 
                          ? data.fecha_vencimiento.replace(/\//g, '-')
                          : `${parts[2]}-${parts[1]}-${parts[0]}`;
                      }
                      return "";
                    })()} 
                    onChange={(e) => handleUpdateField("fecha_vencimiento", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Plazo (días)</label>
                  <select 
                    value={data.condiciones_comerciales?.plazo_dias?.toString() || ""} 
                    onChange={(e) => {
                      setData((prev: any) => ({
                        ...prev,
                        condiciones_comerciales: { ...(prev.condiciones_comerciales || {}), plazo_dias: e.target.value }
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="">Selecciona...</option>
                    <option value="0">Contado</option>
                    <option value="8">8 días</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                    <option value="45">45 días</option>
                    <option value="60">60 días</option>
                    <option value="90">90 días</option>
                  </select>
                </div>
              </div>

              {data.observaciones && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Observaciones</label>
                  <textarea 
                    value={data.observaciones || ""}
                    onChange={(e) => handleUpdateField("observaciones", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-600 bg-gray-50"
                    rows={2}
                  />
                </div>
              )}
            </div>

            {/* Sección: Detalle de Productos */}
            <div>
              <h3 className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-200">Detalle de Productos</h3>
              
              {/* TABLA DE DETALLES NETOS Y BRUTOS */}
              <div className="mb-6 overflow-x-auto bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-200">
                <div className="text-xs space-y-3">
                  <div className="font-bold text-blue-900 mb-3">Resumen por Ítem (Neto vs Bruto)</div>
                  
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-blue-100 border-b-2 border-blue-300">
                        <th className="px-2 py-2 text-left font-bold text-blue-900">Descripción</th>
                        <th className="px-2 py-2 text-center font-bold text-blue-900">Cant.</th>
                        <th className="px-2 py-2 text-right font-bold text-blue-900">Costo Unit.</th>
                        <th className="px-2 py-2 text-right font-bold text-blue-900">Subtotal (Neto)</th>
                        <th className="px-2 py-2 text-right font-bold text-blue-900">Desc.</th>
                        <th className="px-2 py-2 text-right font-bold text-blue-900">Total Impuestos</th>
                        <th className="px-2 py-2 text-right font-bold text-emerald-700">Total (Bruto)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {data.items?.map((item: any, idx: number) => {
                        const cantidad = Number(item.cantidad_ingresada || 0);
                        const costoUnit = Number(item.costo_unitario_compra || 0);
                        const subtotalNeto = cantidad * costoUnit;
                        const descuento = Number(item.descuento_por_producto || 0);
                        const iva = Number(item.iva_total || 0);
                        const impoconsumo = Number(item.impoconsumo || 0);
                        const otrosImp = Number(item.otros_impuestos || 0);
                        const totalImpuestos = iva + impoconsumo + otrosImp;
                        const totalBruto = Number(item.costo_total_linea || 0);

                        return (
                          <tr key={idx} className="hover:bg-blue-50 transition">
                            <td className="px-2 py-2 text-left font-medium text-gray-800">
                              {item.nombre_producto || item.nombreProducto || item.descripcion || "—"}
                            </td>
                            <td className="px-2 py-2 text-center font-semibold text-gray-700">
                              {cantidad}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-gray-700">
                              ${costoUnit.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-2 py-2 text-right font-mono font-semibold text-gray-900 bg-slate-100 rounded">
                              ${subtotalNeto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-red-600 font-medium">
                              {descuento > 0 ? `-$${descuento.toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : "—"}
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-amber-600 font-medium">
                              ${totalImpuestos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </td>
                            <td className="px-2 py-2 text-right font-mono font-bold text-emerald-700 bg-emerald-100 rounded">
                              ${totalBruto.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Resumen Total Neto vs Bruto */}
                  <div className="mt-4 pt-3 border-t-2 border-blue-300 bg-blue-100 rounded p-3">
                    <div className="grid grid-cols-3 gap-4 text-center font-bold">
                      <div>
                        <p className="text-blue-600 text-xs mb-1">TOTAL NETO</p>
                        <p className="text-lg text-blue-900 font-mono">
                          ${sumaCostoBase.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-amber-600 text-xs mb-1">TOTAL IMPUESTOS</p>
                        <p className="text-lg text-amber-900 font-mono">
                          ${(sumaIVA + 
                            data.items?.reduce((a: number, b: any) => a + (Number(b.impoconsumo) || 0), 0) +
                            data.items?.reduce((a: number, b: any) => a + (Number(b.otros_impuestos) || 0), 0)
                          ).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-emerald-600 text-xs mb-1">TOTAL BRUTO</p>
                        <p className="text-lg text-emerald-900 font-mono">
                          ${sumaTotalLineas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLA DE ITEMS - GRID LAYOUT CORREGIDO */}
              <div className="overflow-x-auto bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="space-y-2 min-w-max">
                  {/* Encabezado */}
                  <div className="grid gap-2 px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wide bg-gray-200/40 rounded-lg items-end"
                    style={{
                      gridTemplateColumns: "5rem 11rem 3rem 4.5rem 4.5rem 4rem 3.5rem 3.5rem 3.5rem 5rem"
                    }}>
                    <div className="text-left">Código</div>
                    <div className="text-left">Descripción</div>
                    <div className="text-center">Cant.</div>
                    <div className="text-right">Costo Unit.</div>
                    <div className="text-right">Subtotal</div>
                    <div className="text-right">Desc.</div>
                    <div className="text-right">IVA</div>
                    <div className="text-right">ICO</div>
                    <div className="text-right">Otros</div>
                    <div className="text-right">Total Línea</div>
                  </div>

                  {/* Items */}
                  {data.items?.map((item: any, idx: number) => {
                    const cantidad = Number(item.cantidad_ingresada) || 0;
                    const costoUnit = Number(item.costo_unitario_compra) || 0;
                    const subtotal = cantidad * costoUnit;
                    const descuento = Number(item.descuento_por_producto) || 0;
                    const iva = Number(item.iva_total) || 0;
                    const impoconsumo = Number(item.impoconsumo) || 0;
                    const otrosImp = Number(item.otros_impuestos) || 0;
                    const totalLinea = Number(item.costo_total_linea) || 0;
                    
                    // Fórmula: (Cant × CostoUnit) - Desc + IVA + Impoconsumo + OtrosImp
                    const calculoEsperado = (cantidad * costoUnit) - descuento + iva + impoconsumo + otrosImp;
                    const errorFila = Math.abs(calculoEsperado - totalLinea) >= 1;

                    return (
                      <div 
                        key={idx} 
                        className={`grid gap-2 p-2.5 rounded-lg border transition ${
                          errorFila 
                            ? 'bg-red-50 border-red-200 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        style={{
                          gridTemplateColumns: "5rem 11rem 3rem 4.5rem 4.5rem 4rem 3.5rem 3.5rem 3.5rem 5rem"
                        }}
                      >
                        {/* Código */}
                        <input 
                          type="text" 
                          value={item.codigo_proveedor || item.codigo_barras || ""}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].codigo_proveedor = e.target.value;
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none font-mono text-gray-600"
                          placeholder="SKU"
                        />

                        {/* Nombre del Producto */}
                        <input 
                          type="text" 
                          value={item.nombre_producto || item.nombreProducto || item.descripcion || ""}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].nombre_producto = e.target.value;
                            newItems[idx].descripcion = e.target.value;
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none font-medium text-gray-800"
                          placeholder="Nombre del Producto"
                        />

                        {/* Cantidad */}
                        <input 
                          type="number" 
                          value={item.cantidad_ingresada}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].cantidad_ingresada = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-center font-medium"
                        />

                        {/* Costo Unitario */}
                        <input 
                          type="number" 
                          value={item.costo_unitario_compra}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].costo_unitario_compra = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-right font-mono"
                        />

                        {/* Subtotal (calculado) */}
                        <div className="text-xs text-right font-mono font-semibold text-gray-700 bg-slate-100 p-1.5 rounded border border-gray-300 flex items-center justify-end">
                          ${subtotal.toFixed(0)}
                        </div>

                        {/* Descuento */}
                        <input 
                          type="number" 
                          value={item.descuento_por_producto || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].descuento_por_producto = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-right text-red-600 font-medium"
                        />

                        {/* IVA */}
                        <input 
                          type="number" 
                          value={item.iva_total || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].iva_total = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-right text-emerald-600 font-medium"
                        />

                        {/* Impoconsumo */}
                        <input 
                          type="number" 
                          value={item.impoconsumo || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].impoconsumo = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-right text-amber-600 font-medium"
                        />

                        {/* Otros Impuestos */}
                        <input 
                          type="number" 
                          value={item.otros_impuestos || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].otros_impuestos = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="text-xs bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-right text-purple-600 font-medium"
                        />

                        {/* Total Línea */}
                        <div className="relative">
                          <input 
                            type="number" 
                            value={item.costo_total_linea}
                            onChange={(e) => {
                              const newItems = [...data.items];
                              newItems[idx].costo_total_linea = Number(e.target.value);
                              setData({ ...data, items: newItems });
                            }}
                            className={`w-full text-xs bg-transparent border-b outline-none text-right font-bold ${
                              errorFila ? 'border-red-400 text-red-700' : 'border-gray-300 text-gray-900'
                            }`}
                          />
                          {errorFila && (
                            <span className="absolute -bottom-3.5 right-0 text-[8px] text-red-600 font-bold whitespace-nowrap">
                              Espera: ${calculoEsperado.toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Fila de Sumatoria - ALINEADA CORRECTAMENTE */}
                  <div 
                    className="grid gap-2 p-3 bg-slate-800 text-white rounded-lg font-bold mt-3 shadow-lg items-center"
                    style={{
                      gridTemplateColumns: "5rem 11rem 3rem 4.5rem 4.5rem 4rem 3.5rem 3.5rem 3.5rem 5rem"
                    }}
                  >
                    <div className="col-span-2 text-right text-xs uppercase tracking-wide text-slate-300">Total:</div>
                    <div className="text-center text-sm">
                      {data.items?.reduce((a: number, b: any) => a + (Number(b.cantidad_ingresada) || 0), 0)}
                    </div>
                    <div className="text-right text-xs text-slate-300">—</div>
                    <div className="text-right text-sm bg-slate-700/50 p-1.5 rounded text-slate-100 font-mono">
                      ${sumaCostoBase.toFixed(0)}
                    </div>
                    <div className="text-right text-sm text-rose-300 font-mono">
                      ${data.items?.reduce((a: number, b: any) => a + (Number(b.descuento_por_producto) || 0), 0).toFixed(0)}
                    </div>
                    <div className="text-right text-sm text-emerald-300 font-mono">
                      ${sumaIVA.toFixed(0)}
                    </div>
                    <div className="text-right text-sm text-amber-300 font-mono">
                      ${data.items?.reduce((a: number, b: any) => a + (Number(b.impoconsumo) || 0), 0).toFixed(0)}
                    </div>
                    <div className="text-right text-sm text-purple-300 font-mono">
                      ${data.items?.reduce((a: number, b: any) => a + (Number(b.otros_impuestos) || 0), 0).toFixed(0)}
                    </div>
                    <div className="text-right text-base text-emerald-400 pt-1 border-t-2 border-emerald-400/30 font-mono">
                      ${sumaTotalLineas.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección: Auditoría de Cuadre */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-white">
              <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2 pb-2 border-b border-gray-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Validación de Cuadre Matemático
              </h4>
              
              <div className="overflow-x-auto text-xs">
                <table className="w-full">
                  <thead className="text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="pb-2 text-left font-semibold">Concepto</th>
                      <th className="pb-2 text-right font-semibold">En la Factura</th>
                      <th className="pb-2 text-right font-semibold">Calculado</th>
                      <th className="pb-2 text-center font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className={warningSubtotal ? "bg-red-50" : "bg-white"}>
                      <td className="py-2 font-medium text-gray-800">Subtotal</td>
                      <td className="py-2 text-right font-mono text-gray-700">${subtotalReportado.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-semibold text-gray-900">${sumaCostoBase.toFixed(2)}</td>
                      <td className="py-2 text-center">
                        {!warningSubtotal ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                    
                    <tr className={warningIVA ? "bg-red-50" : "bg-white"}>
                      <td className="py-2 font-medium text-gray-800">IVA Total</td>
                      <td className="py-2 text-right font-mono text-gray-700">${ivaReportado.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-semibold text-gray-900">${sumaIVA.toFixed(2)}</td>
                      <td className="py-2 text-center">
                        {!warningIVA ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                        )}
                      </td>
                    </tr>

                    <tr className={warningTotal ? "bg-red-50" : "bg-white"}>
                      <td className="py-2 font-bold text-gray-800">Total a Pagar</td>
                      <td className="py-2 text-right font-mono font-bold text-gray-900">${totalReportado.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-700">${sumaTotalLineas.toFixed(2)}</td>
                      <td className="py-2 text-center">
                        {!warningTotal ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sección: Totales Editable */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 text-sm mb-3 pb-2 border-b border-gray-200">Resumen de Totales</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Subtotal:</span>
                  <input 
                    type="number"
                    value={data.totales?.subtotal || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, subtotal: Number(e.target.value) }})}
                    className="w-32 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono font-semibold"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Descuento:</span>
                  <input 
                    type="number"
                    value={data.totales?.descuento_total_factura || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, descuento_total_factura: Number(e.target.value) }})}
                    className="w-32 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono font-semibold text-red-600"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">IVA 5%:</span>
                  <input 
                    type="number"
                    value={data.totales?.iva_5 || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, iva_5: Number(e.target.value) }})}
                    className="w-32 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono font-semibold"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">IVA 19%:</span>
                  <input 
                    type="number"
                    value={data.totales?.iva_19 || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, iva_19: Number(e.target.value) }})}
                    className="w-32 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono font-semibold"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Impoconsumo:</span>
                  <input 
                    type="number"
                    value={data.totales?.impoconsumo_total || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, impoconsumo_total: Number(e.target.value) }})}
                    className="w-32 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono font-semibold"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Otros Impuestos:</span>
                  <input 
                    type="number"
                    value={data.totales?.otros_impuestos_total || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, otros_impuestos_total: Number(e.target.value) }})}
                    className="w-32 text-right px-2 py-1 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono font-semibold"
                  />
                </div>
                
                <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total a Pagar:</span>
                  <input 
                    type="number"
                    value={data.totales?.total_factura || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, total_factura: Number(e.target.value) }})}
                    className="w-32 text-right px-2 py-1 bg-emerald-50 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono font-bold text-lg text-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Clasificación Contable y Medio de Pago */}
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
              <h3 className="font-semibold text-gray-800 text-sm pb-2 border-b border-gray-200">
                🏷️ Clasificación de la Operación y Pago
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de Operación / Destino *
                  </label>
                  <select
                    value={auditMetadata.tipoOperacionId || ""}
                    onChange={(e) => setAuditMetadata({ ...auditMetadata, tipoOperacionId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {tiposOperacionDB.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Medio de Pago Macro *
                  </label>
                  <select
                    value={auditMetadata.medioPagoId || ""}
                    onChange={(e) => {
                      const idNum = Number(e.target.value);
                      const found = mediosPagoDB.find((m) => m.id === idNum);
                      setAuditMetadata({ ...auditMetadata, medioPagoId: idNum });
                      if (found) {
                        setData((prev: any) => ({
                          ...prev,
                          condiciones_comerciales: {
                            ...(prev.condiciones_comerciales || {}),
                            medio_pago: found.nombre,
                          },
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {mediosPagoDB.map((mp) => (
                      <option key={mp.id} value={mp.id}>
                        {mp.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Observaciones de Auditoría */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Observaciones de Auditoría</label>
              <textarea 
                value={auditMetadata.observacionAuditoria}
                onChange={(e) => setAuditMetadata({ ...auditMetadata, observacionAuditoria: e.target.value })}
                placeholder="Ej: Aprobada. Descuadre de $50 por redondeo aceptable..."
                rows={2}
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
          <button 
            onClick={() => onDiscard(factura.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-medium transition"
          >
            Descartar
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowRescanModal(true)}
              disabled={isRescanning}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium flex items-center gap-2 transition bg-white text-gray-700 disabled:opacity-50 disabled:cursor-wait"
            >
              <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin text-blue-600' : ''}`} />
              {isRescanning ? 'Reescaneando...' : 'Reescanear'}
            </button>

            <button 
              onClick={() => {
                const newData = { ...data };
                if (!newData.totales) newData.totales = {};
                newData.totales.total_factura = sumaTotalLineas;
                onApprove(factura.id, newData, auditMetadata);
              }}
              disabled={isRescanning || !canApprove}
              title={!canApprove ? "Resuelve los problemas indicados arriba" : ""}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              Aprobar
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Crear Proveedor */}
      {showCreateProviderModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Crear Nuevo Proveedor</h3>
              <button onClick={() => setShowCreateProviderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">NIT</label>
                <input 
                  type="text" 
                  value={newProviderData.nit}
                  onChange={(e) => setNewProviderData({...newProviderData, nit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Razón Social</label>
                <input 
                  type="text" 
                  value={newProviderData.razonSocial}
                  onChange={(e) => setNewProviderData({...newProviderData, razonSocial: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              {createProviderError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {createProviderError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowCreateProviderModal(false)}
                  disabled={isCreatingProvider}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateProvider}
                  disabled={isCreatingProvider}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-50"
                >
                  {isCreatingProvider && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {isCreatingProvider ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Instrucciones Rescaneo */}
      {showRescanModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-amber-900">Instrucciones para Reescanear</h3>
              <button onClick={() => setShowRescanModal(false)} className="text-amber-400 hover:text-amber-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-amber-50 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-2">¿Qué debe corregir la IA?</label>
                <textarea 
                  value={rescanFeedback}
                  onChange={(e) => setRescanFeedback(e.target.value)}
                  placeholder="Ej: Faltó un producto que cuesta $50,000 / Ignora el sello en la esquina"
                  rows={3}
                  className="w-full text-sm px-3 py-2 border border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowRescanModal(false)}
                  className="px-4 py-2 border border-amber-300 bg-white rounded-lg text-amber-800 hover:bg-amber-100 font-medium transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRescan}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-2 shadow transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reescanear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}