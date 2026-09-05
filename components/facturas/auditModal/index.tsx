"use client";

import { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { DocumentImageEditor, DocumentImageEditorHandle } from "@/components/facturas/DocumentImageEditor";

// Importación de sub-componentes (asegúrate de ajustar la ruta de importación si es necesaria)
import { ProviderClientForm } from "./ProviderClientForm";
import { DocumentDetailsForm } from "./DocumentDetailsForm";
import { ProductsDetailTable } from "./ProductsDetailTable";
import { ValidationAndTotals } from "./ValidationAndTotals";
import { AuditActionModals } from "./AuditActionModals";

export default function AuditModal({ factura, onClose, onApprove, onDiscard, onUpdate }: any) {
  const [data, setData] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rescanFeedback, setRescanFeedback] = useState("");
  const [isRescanning, setIsRescanning] = useState(false);
  const [auditMetadata, setAuditMetadata] = useState<{ observacionAuditoria: string; tipoOperacionId: number | null; medioPagoId: number | null; }>({
    observacionAuditoria: "", tipoOperacionId: null, medioPagoId: null,
  });
  const [proveedoresDB, setProveedoresDB] = useState<any[]>([]);
  const [mediosPagoDB, setMediosPagoDB] = useState<any[]>([]);
  const [tiposOperacionDB, setTiposOperacionDB] = useState<any[]>([]);
  
  // Modals state
  const [showCreateProviderModal, setShowCreateProviderModal] = useState(false);
  const [newProviderData, setNewProviderData] = useState({ nit: "", razonSocial: "" });
  const [createProviderError, setCreateProviderError] = useState("");
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [showRescanModal, setShowRescanModal] = useState(false);
  
  const editorRef = useRef<DocumentImageEditorHandle>(null);

  useEffect(() => {
    fetch("/api/proveedores").then(res => res.json()).then(data => setProveedoresDB(Array.isArray(data) ? data : [])).catch(console.error);
    fetch("/api/contabilidad/tesoreria?tipo=medios").then(res => res.json()).then(data => {
      const list = Array.isArray(data) ? data : (data?.data || []);
      setMediosPagoDB(list);
      if (list.length > 0) setAuditMetadata(prev => ({ ...prev, medioPagoId: prev.medioPagoId || list[0].id }));
    }).catch(console.error);
    fetch("/api/contabilidad/tipos-operacion").then(res => res.json()).then(json => {
      const list = json?.data || (Array.isArray(json) ? json : []);
      setTiposOperacionDB(list);
      if (list.length > 0) setAuditMetadata(prev => ({ ...prev, tipoOperacionId: prev.tipoOperacionId || list[0].id }));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (factura) {
      try {
        const parsed = typeof factura.datosExtraidos === 'string' ? JSON.parse(factura.datosExtraidos) : factura.datos_extraidos;
        setData(parsed.factura_compra || parsed);
      } catch (e) { console.error("Error parsing JSON", e); }
      setImages(factura.archivos || []);
      setRescanFeedback("");
    }
  }, [factura]);

  const handleCreateProvider = async () => {
    setCreateProviderError("");
    if (!newProviderData.nit || !newProviderData.razonSocial) return setCreateProviderError("Por favor completa el NIT y la Razón Social.");
    setIsCreatingProvider(true);
    try {
      const res = await fetch("/api/proveedores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newProviderData) });
      if (res.ok) {
        const updatedProveedores = await fetch("/api/proveedores").then(r => r.json());
        setProveedoresDB(updatedProveedores);
        setData((prev: any) => ({ ...prev, proveedor: { ...(prev.proveedor || {}), nit: newProviderData.nit, razon_social: newProviderData.razonSocial }}));
        setShowCreateProviderModal(false);
      } else setCreateProviderError("Hubo un error al intentar crear el proveedor.");
    } catch (e) { setCreateProviderError("Error de conexión con el servidor."); } 
    finally { setIsCreatingProvider(false); }
  };

  const handleRescan = async () => {
    if (!factura.id) return;
    setIsRescanning(true); setShowRescanModal(false);
    try {
      const allComposites = editorRef.current?.getAllCompositeDataUrls() || {};
      const drawings = editorRef.current?.getDrawings() || {};
      const annotatedImagesToSend: Array<{ index: number; dataUrl: string }> = [];
      
      Object.keys(drawings).forEach((key) => {
        const pageIdx = Number(key);
        if (drawings[pageIdx]?.length > 0 && allComposites[pageIdx]) annotatedImagesToSend.push({ index: pageIdx, dataUrl: allComposites[pageIdx] });
      });
      
      if (annotatedImagesToSend.length === 0) {
        const singleComposite = editorRef.current?.getCompositeDataUrl();
        if ((drawings[currentImageIndex]?.length || 0) > 0 && singleComposite) annotatedImagesToSend.push({ index: currentImageIndex, dataUrl: singleComposite });
      }

      const res = await fetch("/api/facturas/rescan-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ facturaId: factura.id, currentData: data, feedback: rescanFeedback, annotatedImages: annotatedImagesToSend }) });
      if (!res.ok) throw new Error("Error en el reescaneo");
      const result = await res.json();
      const finalData = result.data?.factura_compra || result.data;
      
      if (finalData) { setData(finalData); if (onUpdate) onUpdate(finalData); }
      if (annotatedImagesToSend.length > 0) {
        setImages(prev => {
          const next = [...prev];
          annotatedImagesToSend.forEach(item => { if (next[item.index]) next[item.index] = { ...next[item.index], datosBase64Censurada: item.dataUrl };});
          return next;
        });
      }
      setRescanFeedback("");
      alert("¡Factura re-escaneada con éxito respetando tu censura y anotaciones!");
    } catch (err) { alert("Hubo un error al re-escanear."); } 
    finally { setIsRescanning(false); }
  };

  const handleUpdateField = (field: string, value: string) => setData((prev: any) => ({ ...prev, [field]: value }));
  const handleUpdateProvider = (field: string, value: string) => setData((prev: any) => ({ ...prev, proveedor: { ...prev.proveedor, [field]: value } }));
  const handleUpdateClient = (field: string, value: string) => setData((prev: any) => ({ ...prev, cliente_receptor: { ...(prev.cliente_receptor || {}), [field]: value } }));

  if (!data) return null;

  // ===== CÁLCULOS GLOBALES =====
  const sumaCostoBase = data.items?.reduce((acc: number, item: any) => acc + (Number(item.cantidad_ingresada || 0) * Number(item.costo_unitario_compra || 0)), 0) || 0;
  const sumaTotalLineas = data.items?.reduce((acc: number, item: any) => acc + (Number(item.costo_total_linea) || 0), 0) || 0;
  const sumaIVA = data.items?.reduce((acc: number, item: any) => acc + (Number(item.iva_total) || 0), 0) || 0;

  const subtotalReportado = Number(data.totales?.subtotal || 0);
  const ivaReportado = Number(data.totales?.iva_19 || 0) + Number(data.totales?.iva_5 || 0);
  const totalReportado = Number(data.totales?.total_factura || 0);
  
  const warningSubtotal = Math.abs(sumaCostoBase - subtotalReportado) > 1;
  const warningIVA = Math.abs(sumaIVA - ivaReportado) > 1;
  const warningTotal = Math.abs(sumaTotalLineas - totalReportado) > 1;
  const mathWarning = warningSubtotal || warningIVA || warningTotal;
  
  const isSubtotalBlocked = Math.abs(sumaCostoBase - subtotalReportado) > 10;
  const isTotalBlocked = Math.abs(sumaTotalLineas - totalReportado) > 10;
  
  const missingCritical = !data.proveedor?.nit?.trim() || !data.proveedor?.razon_social?.trim() || !data.numero_factura?.trim() || !data.fecha_emision?.trim() || !data.items || data.items.length === 0;

  let hasSevereRowError = false;
  data.items?.forEach((item: any) => {
    const calculoLinea = (Number(item.cantidad_ingresada || 0) * Number(item.costo_unitario_compra || 0)) - Number(item.descuento_por_producto || 0) + Number(item.iva_total || 0) + Number(item.impoconsumo || 0) + Number(item.otros_impuestos || 0);
    if (Math.abs(calculoLinea - (Number(item.costo_total_linea) || 0)) > 10) hasSevereRowError = true;
  });

  const isMathBlocked = isSubtotalBlocked || isTotalBlocked || hasSevereRowError;
  
  const currentNit = data.proveedor?.nit?.trim() || "";
  const currentName = data.proveedor?.razon_social?.trim() || "";
  const matchedProveedor = proveedoresDB.find(p => p.nit === currentNit);
  let proveedorStatus = "NEW", dbNameHint = "";
  if (matchedProveedor) {
    dbNameHint = matchedProveedor.razonSocial;
    const dbNameLower = dbNameHint.toLowerCase(), currNameLower = currentName.toLowerCase();
    proveedorStatus = (dbNameLower === currNameLower || dbNameLower.includes(currNameLower) || currNameLower.includes(dbNameLower)) ? "MATCH" : "MISMATCH";
  }

  const isProviderBlocked = proveedorStatus === "NEW";
  const canApprove = !missingCritical && !isMathBlocked && !isProviderBlocked;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Auditoría de Factura</h2>
            <p className="text-xs text-gray-500 mt-0.5">Verifica y corrige los datos extraídos</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Responsivo: Columna en móvil, Fila en md) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Lado Izquierdo/Superior: Visor (Alto fijo en móvil para permitir scrollear el form abajo) */}
          <div className="w-full md:w-1/2 h-[40vh] min-h-[35vh] md:h-auto flex flex-col border-b md:border-b-0 md:border-r border-gray-200 bg-gray-100 shrink-0 md:shrink">
            <DocumentImageEditor ref={editorRef} images={images} currentIndex={currentImageIndex} onIndexChange={setCurrentImageIndex} className="w-full h-full flex-1" />
          </div>

          {/* Lado Derecho/Inferior: Formulario Segmentado */}
          <div className="w-full md:w-1/2 overflow-y-auto p-4 sm:p-6 bg-white space-y-6">
            
            {mathWarning && (
              <div className="p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-900">Discrepancia Matemática Detectada</p>
                    <div className="text-red-800 text-xs mt-1 space-y-1">
                      {warningSubtotal && <p>• Subtotal calculado (${sumaCostoBase.toFixed(2)}) ≠ reportado (${subtotalReportado.toFixed(2)})</p>}
                      {warningIVA && <p>• IVA calculado (${sumaIVA.toFixed(2)}) ≠ reportado (${ivaReportado.toFixed(2)})</p>}
                      {warningTotal && <p>• Total calculado (${sumaTotalLineas.toFixed(2)}) ≠ reportado (${totalReportado.toFixed(2)})</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ProviderClientForm data={data} proveedoresDB={proveedoresDB} currentNit={currentNit} proveedorStatus={proveedorStatus} dbNameHint={dbNameHint} handleUpdateProvider={handleUpdateProvider} handleUpdateClient={handleUpdateClient} setShowCreateProviderModal={setShowCreateProviderModal} />
            <DocumentDetailsForm data={data} setData={setData} handleUpdateField={handleUpdateField} />
            <ProductsDetailTable data={data} setData={setData} sumaCostoBase={sumaCostoBase} sumaIVA={sumaIVA} sumaTotalLineas={sumaTotalLineas} />
            <ValidationAndTotals data={data} setData={setData} auditMetadata={auditMetadata} setAuditMetadata={setAuditMetadata} tiposOperacionDB={tiposOperacionDB} mediosPagoDB={mediosPagoDB} warningSubtotal={warningSubtotal} warningIVA={warningIVA} warningTotal={warningTotal} subtotalReportado={subtotalReportado} ivaReportado={ivaReportado} totalReportado={totalReportado} sumaCostoBase={sumaCostoBase} sumaIVA={sumaIVA} sumaTotalLineas={sumaTotalLineas} />
          </div>
        </div>

        {/* Footer (Responsivo: Apilado en móvil) */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <button 
            onClick={() => onDiscard(factura.id)} 
            className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg font-medium border border-transparent sm:border-none"
          >
            Descartar
          </button>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowRescanModal(true)} 
              disabled={isRescanning} 
              className="w-full sm:w-auto justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRescanning ? 'animate-spin text-blue-600' : ''}`} /> {isRescanning ? 'Reescaneando...' : 'Reescanear'}
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
              className="w-full sm:w-auto justify-center px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex gap-2 disabled:opacity-50"
            >
              <Check className="w-5 h-5" /> Aprobar
            </button>
          </div>
        </div>
      </div>

      <AuditActionModals
        showCreateProviderModal={showCreateProviderModal} setShowCreateProviderModal={setShowCreateProviderModal} newProviderData={newProviderData} setNewProviderData={setNewProviderData} handleCreateProvider={handleCreateProvider} createProviderError={createProviderError} isCreatingProvider={isCreatingProvider}
        showRescanModal={showRescanModal} setShowRescanModal={setShowRescanModal} rescanFeedback={rescanFeedback} setRescanFeedback={setRescanFeedback} handleRescan={handleRescan} isRescanning={isRescanning}
      />
    </div>
  );
}