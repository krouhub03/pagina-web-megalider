"use client";

import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, Check, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { DocumentImageEditor, DocumentImageEditorHandle } from "@/components/facturas/DocumentImageEditor";

export default function AuditModal({ factura, onClose, onApprove, onDiscard, onUpdate }: any) {
  const [data, setData] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rescanFeedback, setRescanFeedback] = useState("");
  const [isRescanning, setIsRescanning] = useState(false);
  
  const editorRef = useRef<DocumentImageEditorHandle>(null);

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
    try {
      // Captura automática de la imagen compuesta con rayones/censura si existen
      const allComposites = editorRef.current?.getAllCompositeDataUrls() || {};
      const drawings = editorRef.current?.getDrawings() || {};
      
      const annotatedImagesToSend: Array<{ index: number; dataUrl: string }> = [];
      Object.keys(drawings).forEach((key) => {
        const pageIdx = Number(key);
        if (drawings[pageIdx]?.length > 0 && allComposites[pageIdx]) {
          annotatedImagesToSend.push({ index: pageIdx, dataUrl: allComposites[pageIdx] });
        }
      });
      
      // Fallback si solo la página activa tiene modificaciones directas
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

      // Si se enviaron nuevas censuras, reflejarlas en el estado local de imágenes
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

  // Validación básica (math check)
  const sumaCostoBase = data.items?.reduce((acc: number, item: any) => acc + (Number(item.cantidad_ingresada || 0) * Number(item.costo_unitario_compra || 0)), 0) || 0;
  const sumaTotalLineas = data.items?.reduce((acc: number, item: any) => acc + (Number(item.costo_total_linea) || 0), 0) || 0;
  
  const subtotalReportado = Number(data.totales?.subtotal || 0);
  const totalReportado = Number(data.totales?.total_factura || 0);
  
  const warningSubtotal = Math.abs(sumaCostoBase - subtotalReportado) > 1;
  const warningTotal = Math.abs(sumaTotalLineas - totalReportado) > 1;
  
  const mathWarning = warningSubtotal || warningTotal;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Auditoría de Factura</h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Split View) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Lado Izquierdo: Visor Global Reutilizable con Lupa y Censura */}
          <div className="w-1/2 flex flex-col border-r border-gray-200">
            <DocumentImageEditor
              ref={editorRef}
              images={images}
              currentIndex={currentImageIndex}
              onIndexChange={setCurrentImageIndex}
              className="w-full h-full flex-1"
            />
          </div>

          {/* Lado Derecho: Formulario Extraído */}
          <div className="w-1/2 overflow-y-auto p-6 bg-white">
            
            {mathWarning && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Discrepancia Matemática General</p>
                  <p className="text-xs">
                    {warningSubtotal ? `• El subtotal de los items (${sumaCostoBase.toFixed(2)}) no coincide con el subtotal reportado (${subtotalReportado.toFixed(2)}). ` : ''}
                    {warningTotal ? `• El total con impuestos de los items (${sumaTotalLineas.toFixed(2)}) no coincide con el total reportado (${totalReportado.toFixed(2)}).` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Agrupación de Datos: Proveedor y Cliente */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1 text-sm uppercase tracking-wide">Proveedores y Receptor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">NIT Proveedor</label>
                  <input 
                    type="text" 
                    value={data.proveedor?.nit || ""} 
                    onChange={(e) => handleUpdateProvider("nit", e.target.value)}
                    className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${!data.proveedor?.nit ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Razón Social</label>
                  <input 
                    type="text" 
                    value={data.proveedor?.razon_social || ""} 
                    onChange={(e) => handleUpdateProvider("razon_social", e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">NIT / CC Cliente (Receptor)</label>
                  <input 
                    type="text" 
                    value={data.cliente_receptor?.documento || ""} 
                    onChange={(e) => handleUpdateClient("documento", e.target.value)}
                    className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${!data.cliente_receptor?.documento || data.cliente_receptor?.documento !== '1032401381' ? 'border-amber-500 bg-amber-50' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Cliente</label>
                  <input 
                    type="text" 
                    value={data.cliente_receptor?.nombre || ""} 
                    onChange={(e) => handleUpdateClient("nombre", e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Agrupación de Datos: Documento */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 border-b pb-1 text-sm uppercase tracking-wide">Datos del Documento</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Documento</label>
                  <select 
                    value={data.tipo_documento || ""}
                    onChange={(e) => handleUpdateField("tipo_documento", e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">N° Factura</label>
                  <input 
                    type="text" 
                    value={data.numero_factura || ""} 
                    onChange={(e) => handleUpdateField("numero_factura", e.target.value)}
                    className={`w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 ${!data.numero_factura ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Medio de Pago</label>
                  <input 
                    type="text" 
                    value={data.condiciones_comerciales?.medio_pago || ""} 
                    onChange={(e) => {
                      setData((prev: any) => ({
                        ...prev,
                        condiciones_comerciales: { ...(prev.condiciones_comerciales || {}), medio_pago: e.target.value }
                      }));
                    }}
                    placeholder="Ej: CREDITO, CONTADO"
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Emisión</label>
                  <input 
                    type="text" 
                    value={data.fecha_emision || ""} 
                    onChange={(e) => handleUpdateField("fecha_emision", e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Fecha Vencimiento</label>
                  <input 
                    type="text" 
                    value={data.fecha_vencimiento || ""} 
                    onChange={(e) => handleUpdateField("fecha_vencimiento", e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Forma de Pago (Días)</label>
                  <input 
                    type="text" 
                    value={data.condiciones_comerciales?.plazo_dias || ""} 
                    onChange={(e) => {
                      setData((prev: any) => ({
                        ...prev,
                        condiciones_comerciales: { ...(prev.condiciones_comerciales || {}), plazo_dias: e.target.value }
                      }));
                    }}
                    placeholder="Ej: 30"
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {data.observaciones && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones / Notas Extraídas</label>
                  <textarea 
                    value={data.observaciones || ""}
                    onChange={(e) => handleUpdateField("observaciones", e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 text-gray-600 bg-gray-50"
                    rows={2}
                  />
                </div>
              )}
            </div>

            <h3 className="font-semibold text-gray-700 mb-3 border-b pb-2">Detalle de Productos</h3>
            <div className="overflow-x-auto pb-4 mb-6">
              <div className="min-w-[1100px] space-y-2">
                {/* Encabezado de la tabla de items para más claridad */}
                <div className="grid grid-cols-[6rem_12rem_4rem_5.5rem_5.5rem_5.5rem_5rem_5rem_5rem_6rem] gap-2 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider items-end pb-1 border-b">
                  <div className="text-left" title="Código de referencia o barras">Cód / Ref</div>
                  <div className="text-left" title="Nombre comercial del producto">Descripción del Producto</div>
                  <div className="text-center" title="Cantidad de unidades compradas">Cant.</div>
                  <div className="text-right" title="Costo unitario ANTES de impuestos">Costo Base</div>
                  <div className="text-right text-gray-700" title="Subtotal (Cant * Costo Base)">Subtotal</div>
                  <div className="text-right" title="Descuentos aplicados al producto">Descuento</div>
                  <div className="text-right" title="Valor monetario del IVA">Valor IVA</div>
                  <div className="text-right" title="Impuesto al consumo">Impoconsumo</div>
                  <div className="text-right" title="IBUA u otros impuestos locales">Otros Imp.</div>
                  <div className="text-right" title="Costo total final impreso para esta línea">Total Línea</div>
                </div>

                {data.items?.map((item: any, idx: number) => {
                  // Validación por fila
                  const c = Number(item.cantidad_ingresada) || 0;
                  const u = Number(item.costo_unitario_compra) || 0;
                  const desc = Number(item.descuento_por_producto) || 0;
                  const iva = Number(item.iva_total) || 0;
                  const impo = Number(item.impoconsumo) || 0;
                  const otros = Number(item.otros_impuestos) || 0;
                  const tLine = Number(item.costo_total_linea) || 0;
                  
                  const subtotalLinea = c * u;
                  // Si la factura suma impuestos a la linea:
                  const calcLine = subtotalLinea - desc + iva + impo + otros;
                  const errorFila = Math.abs(calcLine - tLine) >= 1;

                  return (
                    <div key={idx} className={`grid grid-cols-[6rem_12rem_4rem_5.5rem_5.5rem_5.5rem_5rem_5rem_5rem_6rem] gap-2 p-2 rounded border items-center ${errorFila ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div>
                        <input 
                          type="text" 
                          value={item.codigo_proveedor || item.codigo_barras || ""}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].codigo_proveedor = e.target.value;
                            setData({ ...data, items: newItems });
                          }}
                          placeholder="SKU/Cod"
                          className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-[11px] font-mono text-gray-600"
                        />
                      </div>
                      <div>
                        <input 
                          type="text" 
                          value={item.descripcion}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].descripcion = e.target.value;
                            setData({ ...data, items: newItems });
                          }}
                          className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none text-[11px] font-medium text-gray-800"
                          title={item.descripcion}
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={item.cantidad_ingresada}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].cantidad_ingresada = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="w-full bg-transparent border-b border-gray-300 outline-none text-xs text-center"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={item.costo_unitario_compra}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].costo_unitario_compra = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="w-full bg-transparent border-b border-gray-300 outline-none text-xs text-right text-gray-600"
                        />
                      </div>
                      <div className="text-right text-xs font-mono font-medium text-slate-700 bg-slate-200/50 p-1 rounded">
                        {subtotalLinea.toFixed(2)}
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={item.descuento_por_producto || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].descuento_por_producto = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="w-full bg-transparent border-b border-gray-300 outline-none text-xs text-right text-red-600"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={item.iva_total || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].iva_total = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="w-full bg-transparent border-b border-gray-300 outline-none text-xs text-right text-emerald-600"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={item.impoconsumo || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].impoconsumo = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="w-full bg-transparent border-b border-gray-300 outline-none text-xs text-right text-amber-600"
                        />
                      </div>
                      <div>
                        <input 
                          type="number" 
                          value={item.otros_impuestos || 0}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].otros_impuestos = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className="w-full bg-transparent border-b border-gray-300 outline-none text-xs text-right text-purple-600"
                        />
                      </div>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={item.costo_total_linea}
                          onChange={(e) => {
                            const newItems = [...data.items];
                            newItems[idx].costo_total_linea = Number(e.target.value);
                            setData({ ...data, items: newItems });
                          }}
                          className={`w-full bg-transparent border-b outline-none text-xs text-right font-semibold ${errorFila ? 'border-red-400 text-red-700' : 'border-gray-300'}`}
                        />
                        {errorFila && (
                          <span className="absolute -bottom-4 right-0 text-[9px] text-red-600 font-bold whitespace-nowrap">
                            Calc: {calcLine.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* FILA DE SUMATORIA TOTAL */}
                <div className="grid grid-cols-[14rem_4rem_5.5rem_5.5rem_5.5rem_5rem_5rem_5rem_6rem] gap-2 p-3 bg-slate-800 text-white rounded font-bold mt-4 shadow items-center">
                  <div className="text-right uppercase text-[10px] tracking-wider text-slate-300">
                    SUMATORIA TOTAL:
                  </div>
                  <div className="text-center text-sm">
                    {data.items?.reduce((a: number, b: any) => a + (Number(b.cantidad_ingresada) || 0), 0)}
                  </div>
                  <div className="text-right text-sm">
                    {/* El costo unitario no se suma */}
                  </div>
                  <div className="text-right text-sm text-slate-300 bg-slate-700/50 p-1 rounded">
                    {data.items?.reduce((a: number, b: any) => a + ((Number(b.cantidad_ingresada) || 0) * (Number(b.costo_unitario_compra) || 0)), 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-rose-300">
                    {data.items?.reduce((a: number, b: any) => a + (Number(b.descuento_por_producto) || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-emerald-300">
                    {data.items?.reduce((a: number, b: any) => a + (Number(b.iva_total) || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-amber-300">
                    {data.items?.reduce((a: number, b: any) => a + (Number(b.impoconsumo) || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-purple-300">
                    {data.items?.reduce((a: number, b: any) => a + (Number(b.otros_impuestos) || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-right text-base text-emerald-400 pt-1 border-t-2 border-emerald-400/50">
                    {data.items?.reduce((a: number, b: any) => a + (Number(b.costo_total_linea) || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* AUDITORÍA DE CUADRE INSPIRADA EN CONTABILIDAD */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Auditoría de Cuadre
              </h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="pb-2 cursor-help" title="Nombre de la métrica auditada">Concepto</th>
                      <th className="pb-2 text-right cursor-help" title="Valor general reportado en la factura">Registrado (Totales)</th>
                      <th className="pb-2 text-right cursor-help" title="Suma matemática calculada por el sistema">Sumatoria (Filas)</th>
                      <th className="pb-2 text-center cursor-help" title="Resultado de la comparación">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Subtotal */}
                    <tr>
                      <td className="py-2 font-medium">Subtotal</td>
                      <td className="py-2 text-right font-mono">{Number(data.totales?.subtotal || 0).toFixed(2)}</td>
                      <td className="py-2 text-right font-mono">
                        {data.items?.reduce((acc: number, i: any) => acc + (Number(i.cantidad_ingresada || 0) * Number(i.costo_unitario_compra || 0)), 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-center">
                        {Math.abs(Number(data.totales?.subtotal || 0) - data.items?.reduce((acc: number, i: any) => acc + (Number(i.cantidad_ingresada || 0) * Number(i.costo_unitario_compra || 0)), 0)) < 1 ? 
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />}
                      </td>
                    </tr>
                    
                    {/* IVA */}
                    <tr>
                      <td className="py-2 font-medium">IVA Total</td>
                      <td className="py-2 text-right font-mono">{(Number(data.totales?.iva_19 || 0) + Number(data.totales?.iva_5 || 0)).toFixed(2)}</td>
                      <td className="py-2 text-right font-mono">
                        {data.items?.reduce((acc: number, i: any) => acc + Number(i.iva_total || 0), 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-center">
                        {Math.abs((Number(data.totales?.iva_19 || 0) + Number(data.totales?.iva_5 || 0)) - data.items?.reduce((acc: number, i: any) => acc + Number(i.iva_total || 0), 0)) < 1 ? 
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />}
                      </td>
                    </tr>

                    {/* Total Fila vs Total Factura */}
                    <tr>
                      <td className="py-2 font-bold text-slate-800">Costo Total Líneas</td>
                      <td className="py-2 text-right font-mono font-bold">{Number(data.totales?.total_factura || 0).toFixed(2)}</td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-700">
                        {data.items?.reduce((acc: number, i: any) => acc + Number(i.costo_total_linea || 0), 0).toFixed(2)}
                      </td>
                      <td className="py-2 text-center">
                        {Math.abs(Number(data.totales?.total_factura || 0) - data.items?.reduce((acc: number, i: any) => acc + Number(i.costo_total_linea || 0), 0)) < 1 ? 
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <AlertTriangle className="w-4 h-4 text-red-500 mx-auto" />}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <input 
                    type="number"
                    value={data.totales?.subtotal || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, subtotal: Number(e.target.value) }})}
                    className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Descuento:</span>
                  <input 
                    type="number"
                    value={data.totales?.descuento_total_factura || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, descuento_total_factura: Number(e.target.value) }})}
                    className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 text-red-600"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">IVA 5%:</span>
                  <input 
                    type="number"
                    value={data.totales?.iva_5 || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, iva_5: Number(e.target.value) }})}
                    className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">IVA 19%:</span>
                  <input 
                    type="number"
                    value={data.totales?.iva_19 || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, iva_19: Number(e.target.value) }})}
                    className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Impoconsumo (ICO):</span>
                  <input 
                    type="number"
                    value={data.totales?.impoconsumo_total || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, impoconsumo_total: Number(e.target.value) }})}
                    className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Otros Imp. (IBUA):</span>
                  <input 
                    type="number"
                    value={data.totales?.otros_impuestos_total || 0}
                    onChange={(e) => setData({ ...data, totales: { ...data.totales, otros_impuestos_total: Number(e.target.value) }})}
                    className="w-24 text-right bg-white border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

              </div>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-300">
                <span className="font-bold text-gray-800 text-lg">Total a Pagar:</span>
                <input 
                  type="number"
                  value={data.totales?.total_factura || 0}
                  onChange={(e) => setData({ ...data, totales: { ...data.totales, total_factura: Number(e.target.value) }})}
                  className="w-32 text-right bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-600 font-bold text-blue-700 text-lg"
                />
              </div>
            </div>
            
            {/* Input para Reescaneo (feedback de la IA) movido aquí para no tapar la foto */}
            <div className="mt-6 p-4 border border-amber-200 bg-amber-50 rounded-lg">
               <label className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 block">
                 ¿Descuadres graves? Dile a la IA qué corregir para reescanear
               </label>
               <input 
                 type="text" 
                 value={rescanFeedback}
                 onChange={(e) => setRescanFeedback(e.target.value)}
                 placeholder="Ej: 'Faltó incluir la paca que costaba 25000'"
                 className="w-full text-sm p-2 border border-amber-200 rounded focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none bg-white"
               />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button 
            onClick={() => onDiscard(factura.id)}
            className="text-red-600 hover:bg-red-50 px-4 py-2 rounded font-medium transition cursor-pointer"
          >
            Descartar Factura
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={handleRescan}
              disabled={isRescanning}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait bg-white text-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin text-blue-600' : ''}`} />
              {isRescanning ? 'Reescaneando...' : 'Reescanear'}
            </button>

            <button 
              onClick={() => {
                const newData = { ...data };
                if (!newData.totales) newData.totales = {};
                newData.totales.total_factura = sumaTotalLineas;
                onApprove(factura.id, newData);
              }}
              disabled={isRescanning}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              Aprobar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
