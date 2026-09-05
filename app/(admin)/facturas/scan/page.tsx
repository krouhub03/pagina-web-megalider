"use client";

import { useState, useRef } from "react";
import { 
  Camera, 
  X, 
  Upload, 
  FileImage, 
  Loader2, 
  EyeOff, 
  Check, 
  PenTool, 
  ShieldAlert, 
  Info,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2
} from "lucide-react";
import { DocumentImageEditor, DocumentImageEditorHandle } from "@/components/facturas/DocumentImageEditor";

// Convertir base64 DataURL a Blob binario para envío en FormData
function dataURLtoBlob(dataurl: string): Blob {
  const parts = dataurl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export default function ScanFacturasPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados de censura / edición previa al envío
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showPrivacyGuide, setShowPrivacyGuide] = useState(false);
  const [censoredImages, setCensoredImages] = useState<Record<number, string>>({});
  const [drawingsHistory, setDrawingsHistory] = useState<Record<number, any[]>>({});
  const editorModalRef = useRef<DocumentImageEditorHandle>(null);

  // Formulario de datos manuales antes del escaneo (para campos censurados o pre-completados)
  const [showManualFields, setShowManualFields] = useState(false);
  const [manualFields, setManualFields] = useState({
    proveedor_nit: "",
    proveedor_razon_social: "",
    numero_factura: "",
    fecha_emision: "",
    fecha_vencimiento: "",
    tipo_documento: "Factura Electrónica",
  });

  // Estado editable de la factura post-extracción
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Validación inicial
      const validFiles = newFiles.filter(f => f.type.startsWith("image/"));
      if (validFiles.length !== newFiles.length) {
        setError("Solo se permiten imágenes (JPG, PNG).");
      } else {
        setError(null);
      }

      setFiles(prev => [...prev, ...validFiles]);
      
      // Previsualización inmediata (sin compresión cliente)
      const newPreviews = validFiles.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setCensoredImages(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setDrawingsHistory(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const clearAll = () => {
    setFiles([]);
    previews.forEach(p => URL.revokeObjectURL(p));
    setPreviews([]);
    setCensoredImages({});
    setDrawingsHistory({});
    setScanResult(null);
    setExtractedData(null);
    setSaveSuccessMsg(null);
    setError(null);
    setEditingIndex(null);
    setManualFields({
      proveedor_nit: "",
      proveedor_razon_social: "",
      numero_factura: "",
      fecha_emision: "",
      fecha_vencimiento: "",
      tipo_documento: "Factura Electrónica",
    });
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    
    setIsScanning(true);
    setError(null);
    setScanResult(null);
    setSaveSuccessMsg(null);

    const formData = new FormData();

    // 1. Archivos destinados a la IA:
    // Si la página fue censurada, se envía la captura de pantalla con la censura física.
    // Si no fue censurada, se envía el archivo original.
    files.forEach((file, index) => {
      const censoredDataUrl = censoredImages[index];
      if (censoredDataUrl && censoredDataUrl.startsWith("data:image")) {
        const censoredBlob = dataURLtoBlob(censoredDataUrl);
        const censoredFile = new File([censoredBlob], `censored_scan_${file.name.replace(/\.[^/.]+$/, "")}.jpg`, {
          type: "image/jpeg",
        });
        formData.append("ai_files", censoredFile);
        console.log(`[Scan Client] Página ${index + 1}: Enviando CAPTURA CENSURADA a la IA (${censoredBlob.size} bytes).`);
      } else {
        formData.append("ai_files", file, file.name);
        console.log(`[Scan Client] Página ${index + 1}: Enviando imagen ORIGINAL a la IA.`);
      }
    });

    // 2. Archivos originales INTACTOS para almacenamiento contable en BD PostgreSQL:
    files.forEach((file) => {
      formData.append("original_files", file, file.name);
    });

    // 3. Adjuntar datos manuales si fueron provistos
    formData.append("manual_data", JSON.stringify(manualFields));

    try {
      const res = await fetch("/api/facturas/scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar las facturas");
      }

      setScanResult(data);
      const parsedData = data.data?.factura_compra || data.data || {};
      setExtractedData(parsedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // Manejadores de edición de campos en el formulario post-extracción
  const handleUpdateField = (field: string, value: any) => {
    setExtractedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProvider = (field: string, value: string) => {
    setExtractedData((prev: any) => ({
      ...prev,
      proveedor: { ...(prev?.proveedor || {}), [field]: value }
    }));
  };

  const handleUpdateClient = (field: string, value: string) => {
    setExtractedData((prev: any) => ({
      ...prev,
      cliente_receptor: { ...(prev?.cliente_receptor || {}), [field]: value }
    }));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setExtractedData((prev: any) => {
      const newItems = [...(prev?.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Auto-cálculo si se modifica cantidad o costo unitario
      if (field === "cantidad_ingresada" || field === "costo_unitario_compra" || field === "descuento_por_producto" || field === "iva_total" || field === "impuesto_consumo" || field === "otros_impuestos") {
        const cant = Number(newItems[index].cantidad_ingresada || 0);
        const unit = Number(newItems[index].costo_unitario_compra || 0);
        const desc = Number(newItems[index].descuento_por_producto || 0);
        const iva = Number(newItems[index].iva_total || 0);
        const ico = Number(newItems[index].impuesto_consumo || 0);
        const otros = Number(newItems[index].otros_impuestos || 0);
        newItems[index].costo_total_linea = ((cant * unit) - desc + iva + ico + otros).toFixed(2);
      }
      return { ...prev, items: newItems };
    });
  };

  const handleAddItem = () => {
    setExtractedData((prev: any) => ({
      ...prev,
      items: [
        ...(prev?.items || []),
        {
          codigo_barras: "",
          codigo_proveedor: "",
          descripcion: "Nuevo Producto",
          cantidad_ingresada: 1,
          unidad_medida: "UND",
          costo_unitario_compra: 0,
          descuento_por_producto: 0,
          iva_total: 0,
          porcentaje_iva: 19,
          impuesto_consumo: 0,
          otros_impuestos: 0,
          costo_total_linea: 0,
        }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setExtractedData((prev: any) => ({
      ...prev,
      items: (prev?.items || []).filter((_: any, i: number) => i !== index)
    }));
  };

  // Guardar cambios en la tabla de auditoría (PostgreSQL)
  const handleSaveAuditChanges = async () => {
    if (!scanResult?.auditId) {
      setSaveSuccessMsg("Factura actualizada en memoria local.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/facturas/audit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scanResult.auditId,
          datosExtraidos: { factura_compra: extractedData }
        })
      });
      if (!res.ok) throw new Error("Error al guardar cambios");
      setSaveSuccessMsg("¡Cambios guardados exitosamente en la bandeja de auditoría!");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Escanear Facturas</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {!scanResult ? (
          <>
            {/* Zona de Carga */}
            <div className="mb-6 flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <Camera className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600 mb-2">Toma fotos o sube las imágenes de tu factura</p>
              
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Seleccionar Imágenes
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment" // Invoca cámara trasera en móviles
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            {/* Galería de Previsualización con opción de Censura */}
            {previews.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-700">Páginas seleccionadas ({previews.length})</h3>
                    <p className="text-xs text-gray-500">
                      Haz clic en cualquier página para <span className="font-semibold text-rose-600">censurar datos confidenciales</span> antes de enviarla a la IA.
                    </p>
                  </div>
                  <button onClick={clearAll} className="text-sm text-red-600 hover:underline">
                    Descartar todo
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previews.map((preview, index) => (
                    <div 
                      key={index} 
                      className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-[3/4] cursor-pointer shadow-sm hover:shadow-md transition bg-gray-900"
                      onClick={() => setEditingIndex(index)}
                    >
                      <img 
                        src={censoredImages[index] || preview} 
                        alt={`Página ${index + 1}`} 
                        className="w-full h-full object-cover transition transform group-hover:scale-105" 
                      />

                      {/* Badge si está censurada */}
                      {censoredImages[index] && (
                        <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                          <EyeOff className="w-3 h-3" />
                          <span>Censurada</span>
                        </div>
                      )}

                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                        title="Eliminar página"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 text-white text-xs p-2 flex items-center justify-between backdrop-blur-xs">
                        <span className="font-medium">Pág. {index + 1}</span>
                        <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Censurar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal de Censura / Edición Pre-Envío */}
            {editingIndex !== null && (
              <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                  {/* Header del Modal */}
                  <div className="px-6 py-3 border-b flex justify-between items-center bg-gray-50">
                    <div>
                      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <EyeOff className="w-5 h-5 text-rose-600" />
                        Censurar Información - Página {editingIndex + 1}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Oculta con cuadros o círculos negros los datos sensibles antes del envío. La imagen original se conservará siempre en tu base de datos.
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPrivacyGuide(prev => !prev)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                          showPrivacyGuide 
                            ? "bg-rose-50 border-rose-300 text-rose-700 font-semibold" 
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                        title="Ver guía de datos sensibles en facturas colombianas"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <span>{showPrivacyGuide ? "Cerrar Guía" : "¿Qué datos censurar?"}</span>
                      </button>

                      <button 
                        onClick={() => {
                          const composite = editorModalRef.current?.getCompositeDataUrl(0);
                          const drawings = editorModalRef.current?.getDrawings() || {};
                          const pageDrawings = drawings[0] || [];
                          if (composite && pageDrawings.length > 0 && editingIndex !== null) {
                            setCensoredImages(prev => ({ ...prev, [editingIndex]: composite }));
                            setDrawingsHistory(prev => ({ ...prev, [editingIndex]: pageDrawings }));
                          }
                          setEditingIndex(null);
                        }} 
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Panel Desplegable: Guía de Datos Sensibles */}
                  {showPrivacyGuide && (
                    <div className="bg-slate-900 text-slate-100 px-6 py-3 border-b border-slate-800 text-xs animate-in slide-in-from-top-2 duration-150 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Datos a Censurar */}
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-rose-500/30">
                        <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>🔴 Datos recomendados para Ocultar / Censurar</span>
                        </div>
                        <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                          <li><strong className="text-white">Cédula o NIT personal</strong> (personas naturales / propietarios).</li>
                          <li><strong className="text-white">Dirección de domicilio</strong> o residencia personal.</li>
                          <li><strong className="text-white">Teléfonos y correos personales</strong>.</li>
                          <li><strong className="text-white">Datos bancarios</strong>: N° de cuenta, tipo de cuenta, banco.</li>
                          <li><strong className="text-white">Firmas manuscritas / digitales</strong> y códigos QR personales.</li>
                        </ul>
                      </div>

                      {/* Datos a Conservar */}
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-500/30">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>🟡 Datos a Conservar (Requeridos para el escaneo IA)</span>
                        </div>
                        <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                          <li><strong className="text-white">Nombre o razón social</strong> del proveedor comercial.</li>
                          <li><strong className="text-white">NIT comercial</strong> de empresas o distribuidoras.</li>
                          <li><strong className="text-white">Número de factura y fecha</strong> de emisión.</li>
                          <li><strong className="text-white">Lista de productos</strong>, cantidades y precios unitarios.</li>
                          <li><strong className="text-white">Impuestos</strong> (IVA 5%/19%, ICO, IBUA) y Total Factura.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Body: DocumentImageEditor Reutilizable */}
                  <div className="flex-1 overflow-hidden relative">
                    <DocumentImageEditor
                      ref={editorModalRef}
                      images={[previews[editingIndex]]}
                      currentIndex={0}
                      initialDrawings={drawingsHistory[editingIndex] ? { 0: drawingsHistory[editingIndex] } : undefined}
                      className="w-full h-full"
                      showPagination={false}
                    />
                  </div>

                  {/* Footer del Modal */}
                  <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCensoredImages(prev => {
                          const copy = { ...prev };
                          delete copy[editingIndex];
                          return copy;
                        });
                        setDrawingsHistory(prev => {
                          const copy = { ...prev };
                          delete copy[editingIndex];
                          return copy;
                        });
                        editorModalRef.current?.clearAllMarks();
                        setEditingIndex(null);
                      }}
                      className="text-xs text-gray-600 hover:text-red-600 font-medium cursor-pointer"
                    >
                      Quitar todas las marcas
                    </button>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const composite = editorModalRef.current?.getCompositeDataUrl(0);
                          const drawings = editorModalRef.current?.getDrawings() || {};
                          const pageDrawings = drawings[0] || [];

                          console.log("[Scan Client] Guardando censura en página", editingIndex, {
                            tieneCompuesto: !!composite,
                            longitudCompuesto: composite?.length,
                            totalTrazos: pageDrawings.length
                          });

                          if (composite && pageDrawings.length > 0) {
                            setCensoredImages(prev => {
                              const next = { ...prev, [editingIndex]: composite };
                              console.log("[Scan Client] Estado censoredImages actualizado:", Object.keys(next));
                              return next;
                            });
                            setDrawingsHistory(prev => ({ ...prev, [editingIndex]: pageDrawings }));
                          } else {
                            setCensoredImages(prev => {
                              const copy = { ...prev };
                              delete copy[editingIndex];
                              return copy;
                            });
                          }
                          setEditingIndex(null);
                        }}
                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        Guardar Censura
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de Cabecera Opcional / Manual (Para datos censurados como NIT, Proveedor o N° Factura) */}
            {previews.length > 0 && (
              <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowManualFields(prev => !prev)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-100/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        Completar Datos de Cabecera Manualmente <span className="text-xs font-normal text-slate-500">(Opcional / Útil si censuraste el NIT o Proveedor)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Si tachaste el NIT o la razón social en la foto, puedes escribirlos aquí. Si no los censuras, la IA los leerá automáticamente.
                      </p>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {showManualFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showManualFields && (
                  <div className="p-4 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">NIT Proveedor</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 900.818.921-6"
                        value={manualFields.proveedor_nit}
                        onChange={(e) => setManualFields(prev => ({ ...prev, proveedor_nit: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social / Nombre Proveedor</label>
                      <input 
                        type="text" 
                        placeholder="Ej. BAVARIA S.A."
                        value={manualFields.proveedor_razon_social}
                        onChange={(e) => setManualFields(prev => ({ ...prev, proveedor_razon_social: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">N° de Factura</label>
                      <input 
                        type="text" 
                        placeholder="Ej. FE-10492"
                        value={manualFields.numero_factura}
                        onChange={(e) => setManualFields(prev => ({ ...prev, numero_factura: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Emisión</label>
                      <input 
                        type="date" 
                        value={manualFields.fecha_emision}
                        onChange={(e) => setManualFields(prev => ({ ...prev, fecha_emision: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Vencimiento</label>
                      <input 
                        type="date" 
                        value={manualFields.fecha_vencimiento}
                        onChange={(e) => setManualFields(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Documento</label>
                      <select 
                        value={manualFields.tipo_documento}
                        onChange={(e) => setManualFields(prev => ({ ...prev, tipo_documento: e.target.value }))}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                      >
                        <option value="Factura Electrónica">Factura Electrónica</option>
                        <option value="Factura POS">Factura POS</option>
                        <option value="Remision">Remisión</option>
                        <option value="Soporte de Entrega">Soporte de Entrega</option>
                        <option value="Nota Pedido">Nota Pedido</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Acciones de Escaneo */}
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={handleExtract}
                disabled={files.length === 0 || isScanning}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {isScanning ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Procesando con IA...</>
                ) : (
                  <><FileImage className="w-5 h-5" /> Extraer Datos</>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Formulario Interactivo Completo Post-Extracción para Revisión y Guardado */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header de Éxito / Feedback */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900 text-base">¡Factura extraída con éxito!</h3>
                  <p className="text-xs text-emerald-700">
                    Revisa o completa los datos extraídos por la IA. Puedes modificar cualquier campo antes de guardar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Escanear Otra
                </button>
                <a
                  href="/facturas/audit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                >
                  Ver Lista en Auditoría
                </a>
              </div>
            </div>

            {/* Mensajes de Alerta / Guardado */}
            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium">
                {error}
              </div>
            )}

            {/* Datos de Cabecera: Proveedor y Cliente */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                1. Información de Proveedor y Cliente Receptor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">NIT Proveedor</label>
                  <input 
                    type="text" 
                    value={extractedData?.proveedor?.nit || ""} 
                    onChange={(e) => handleUpdateProvider("nit", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej. 900.818.921-6"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Razón Social Proveedor</label>
                  <input 
                    type="text" 
                    value={extractedData?.proveedor?.razon_social || ""} 
                    onChange={(e) => handleUpdateProvider("razon_social", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nombre o empresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">NIT / CC Receptor (MegaLíder)</label>
                  <input 
                    type="text" 
                    value={extractedData?.cliente_receptor?.documento || "1032401381"} 
                    onChange={(e) => handleUpdateClient("documento", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nombre Receptor</label>
                  <input 
                    type="text" 
                    value={extractedData?.cliente_receptor?.nombre || "GUEVARA VANEGAS YULI MARCELA"} 
                    onChange={(e) => handleUpdateClient("nombre", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Datos del Documento y Condiciones */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-200 pb-2">
                2. Datos del Documento y Fechas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo Documento</label>
                  <select 
                    value={extractedData?.tipo_documento || "Factura Electrónica"}
                    onChange={(e) => handleUpdateField("tipo_documento", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Factura Electrónica">Factura Electrónica</option>
                    <option value="Factura POS">Factura POS</option>
                    <option value="Remision">Remisión</option>
                    <option value="Soporte de Entrega">Soporte de Entrega</option>
                    <option value="Nota Pedido">Nota Pedido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">N° Factura</label>
                  <input 
                    type="text" 
                    value={extractedData?.numero_factura || ""} 
                    onChange={(e) => handleUpdateField("numero_factura", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Número impreso"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Emisión</label>
                  <input 
                    type="text" 
                    value={extractedData?.fecha_emision || ""} 
                    onChange={(e) => handleUpdateField("fecha_emision", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha Vencimiento</label>
                  <input 
                    type="text" 
                    value={extractedData?.fecha_vencimiento || ""} 
                    onChange={(e) => handleUpdateField("fecha_vencimiento", e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>
            </div>

            {/* Detalle de Productos / Items */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  3. Detalle de Productos ({extractedData?.items?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Fila</span>
                </button>
              </div>

              <div className="overflow-x-auto pb-2">
                <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-200 text-slate-700 font-bold text-[11px] border-b border-slate-300">
                      <th className="p-2 w-28">Ref / Cód</th>
                      <th className="p-2">Descripción Producto</th>
                      <th className="p-2 w-20 text-center">Cant.</th>
                      <th className="p-2 w-24 text-right">Costo Unit.</th>
                      <th className="p-2 w-20 text-right">Dcto.</th>
                      <th className="p-2 w-24 text-right">IVA $</th>
                      <th className="p-2 w-20 text-right">ICO $</th>
                      <th className="p-2 w-24 text-right">Total Línea</th>
                      <th className="p-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {(extractedData?.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.codigo_proveedor || item.codigo_barras || ""}
                            onChange={(e) => handleUpdateItem(idx, "codigo_proveedor", e.target.value)}
                            className="w-full border border-slate-300 rounded p-1 text-xs focus:ring-1 focus:ring-blue-500"
                            placeholder="SKU"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.descripcion || ""}
                            onChange={(e) => handleUpdateItem(idx, "descripcion", e.target.value)}
                            className="w-full border border-slate-300 rounded p-1 text-xs font-medium focus:ring-1 focus:ring-blue-500"
                            placeholder="Descripción"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.cantidad_ingresada || ""}
                            onChange={(e) => handleUpdateItem(idx, "cantidad_ingresada", Number(e.target.value))}
                            className="w-full border border-slate-300 rounded p-1 text-xs text-center focus:ring-1 focus:ring-blue-500"
                            step="any"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.costo_unitario_compra || ""}
                            onChange={(e) => handleUpdateItem(idx, "costo_unitario_compra", Number(e.target.value))}
                            className="w-full border border-slate-300 rounded p-1 text-xs text-right focus:ring-1 focus:ring-blue-500"
                            step="any"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.descuento_por_producto || ""}
                            onChange={(e) => handleUpdateItem(idx, "descuento_por_producto", Number(e.target.value))}
                            className="w-full border border-slate-300 rounded p-1 text-xs text-right focus:ring-1 focus:ring-blue-500"
                            step="any"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.iva_total || ""}
                            onChange={(e) => handleUpdateItem(idx, "iva_total", Number(e.target.value))}
                            className="w-full border border-slate-300 rounded p-1 text-xs text-right focus:ring-1 focus:ring-blue-500"
                            step="any"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.impuesto_consumo || ""}
                            onChange={(e) => handleUpdateItem(idx, "impuesto_consumo", Number(e.target.value))}
                            className="w-full border border-slate-300 rounded p-1 text-xs text-right focus:ring-1 focus:ring-blue-500"
                            step="any"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.costo_total_linea || ""}
                            onChange={(e) => handleUpdateItem(idx, "costo_total_linea", Number(e.target.value))}
                            className="w-full border border-slate-300 rounded p-1 text-xs font-bold text-right focus:ring-1 focus:ring-blue-500 text-slate-800"
                            step="any"
                          />
                        </td>
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales y Liquidación */}
            <div className="bg-slate-900 text-white p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h5 className="font-bold text-sm text-slate-200">Resumen y Liquidación de Impuestos</h5>
                <p className="text-xs text-slate-400">Verifica que los totales coincidan con el valor impreso en la factura.</p>
              </div>

              <div className="flex flex-wrap gap-4 text-right">
                <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Subtotal</span>
                  <span className="text-xs font-mono font-semibold">
                    ${Number(extractedData?.totales?.subtotal || 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Total IVA</span>
                  <span className="text-xs font-mono font-semibold">
                    ${Number((Number(extractedData?.totales?.iva_19 || 0) + Number(extractedData?.totales?.iva_5 || 0))).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Impoconsumo</span>
                  <span className="text-xs font-mono font-semibold">
                    ${Number(extractedData?.totales?.impoconsumo || 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="bg-emerald-950/80 px-4 py-1.5 rounded-lg border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-400 block font-bold uppercase">Total Factura</span>
                  <span className="text-sm font-mono font-bold text-emerald-300">
                    ${Number(extractedData?.totales?.total_factura || 0).toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Acciones y Guardado en Auditoría */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={clearAll}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Descartar y Escanear Otra
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAuditChanges}
                  className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Guardando..." : "Guardar Cambios en Auditoría"}</span>
                </button>

                <a
                  href="/facturas/audit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ir a Auditar Factura</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
