"use client";

import { useState } from "react";
import { FileImage, Loader2 } from "lucide-react";
import { dataURLtoBlob } from "./utils";
import { ScanUploader } from "./ScanUploader";
import { ScanGallery } from "./ScanGallery";
import { ScanCensorshipModal } from "./ScanCensorshipModal";
import { ScanManualForm } from "./ScanManualForm";
import { ScanPostEditor } from "./ScanPostEditor";

export default function ScanFacturasPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [censoredImages, setCensoredImages] = useState<Record<number, string>>({});
  const [drawingsHistory, setDrawingsHistory] = useState<Record<number, any[]>>({});

  const [manualFields, setManualFields] = useState({
    proveedor_nit: "", proveedor_razon_social: "", numero_factura: "",
    fecha_emision: "", fecha_vencimiento: "", tipo_documento: "Factura Electrónica",
  });

  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(f => f.type.startsWith("image/"));
      setError(validFiles.length !== newFiles.length ? "Solo se permiten imágenes (JPG, PNG)." : null);
      
      setFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
    setCensoredImages(prev => { const next = { ...prev }; delete next[index]; return next; });
    setDrawingsHistory(prev => { const next = { ...prev }; delete next[index]; return next; });
  };

  const clearAll = () => {
    setFiles([]); previews.forEach(p => URL.revokeObjectURL(p)); setPreviews([]);
    setCensoredImages({}); setDrawingsHistory({}); setScanResult(null); setExtractedData(null);
    setSaveSuccessMsg(null); setError(null); setEditingIndex(null);
    setManualFields({ proveedor_nit: "", proveedor_razon_social: "", numero_factura: "", fecha_emision: "", fecha_vencimiento: "", tipo_documento: "Factura Electrónica" });
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    setIsScanning(true); setError(null); setScanResult(null); setSaveSuccessMsg(null);

    const formData = new FormData();
    files.forEach((file, index) => {
      const censoredUrl = censoredImages[index];
      if (censoredUrl) {
        formData.append("ai_files", new File([dataURLtoBlob(censoredUrl)], `censored_${file.name}.jpg`, { type: "image/jpeg" }));
      } else {
        formData.append("ai_files", file, file.name);
      }
      formData.append("original_files", file, file.name);
    });

    formData.append("manual_data", JSON.stringify(manualFields));

    try {
      const res = await fetch("/api/facturas/scan", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar las facturas");
      setScanResult(data);
      setExtractedData(data.data?.factura_compra || data.data || {});
    } catch (err: any) { setError(err.message); } finally { setIsScanning(false); }
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setExtractedData((prev: any) => {
      const items = [...(prev?.items || [])];
      items[index] = { ...items[index], [field]: value };
      if (["cantidad_ingresada", "costo_unitario_compra", "descuento_por_producto", "iva_total", "impuesto_consumo", "otros_impuestos"].includes(field)) {
        const i = items[index];
        items[index].costo_total_linea = ((Number(i.cantidad_ingresada||0) * Number(i.costo_unitario_compra||0)) - Number(i.descuento_por_producto||0) + Number(i.iva_total||0) + Number(i.impuesto_consumo||0) + Number(i.otros_impuestos||0)).toFixed(2);
      }
      return { ...prev, items };
    });
  };

  const handleSaveAuditChanges = async () => {
    if (!scanResult?.auditId) { setSaveSuccessMsg("Factura actualizada en local."); return; }
    setIsSaving(true); setError(null);
    try {
      const res = await fetch("/api/facturas/audit", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scanResult.auditId, datosExtraidos: { factura_compra: extractedData } })
      });
      if (!res.ok) throw new Error("Error al guardar cambios");
      setSaveSuccessMsg("¡Cambios guardados!"); setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e: any) { setError(e.message || "Error al guardar"); } finally { setIsSaving(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Escanear Facturas</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {!scanResult ? (
          <>
            <ScanUploader onFileChange={handleFileChange} error={error} />
            <ScanGallery 
              previews={previews} 
              censoredImages={censoredImages} 
              onClearAll={clearAll} 
              onRemoveFile={removeFile} 
              onEditIndex={setEditingIndex} 
            />
            
            {editingIndex !== null && (
              <ScanCensorshipModal 
                editingIndex={editingIndex}
                imageSrc={previews[editingIndex]}
                initialDrawings={drawingsHistory[editingIndex] || []}
                onClose={() => setEditingIndex(null)}
                onClearMarks={(idx) => {
                  setCensoredImages(prev => { const c = {...prev}; delete c[idx]; return c; });
                  setDrawingsHistory(prev => { const c = {...prev}; delete c[idx]; return c; });
                }}
                onRemoveCensorship={(idx) => {
                  setCensoredImages(prev => { const c = {...prev}; delete c[idx]; return c; });
                  setEditingIndex(null);
                }}
                onSave={(idx, url, drawings) => {
                  setCensoredImages(prev => ({ ...prev, [idx]: url }));
                  setDrawingsHistory(prev => ({ ...prev, [idx]: drawings }));
                  setEditingIndex(null);
                }}
              />
            )}

            <ScanManualForm 
              fields={manualFields} 
              onChange={setManualFields} 
              visible={previews.length > 0} 
            />

            {previews.length > 0 && (
              <div className="flex justify-end pt-2">
                <button onClick={handleExtract} disabled={isScanning} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2">
                  {isScanning ? <><Loader2 className="w-5 h-5 animate-spin" /> Procesando...</> : <><FileImage className="w-5 h-5" /> Extraer Datos</>}
                </button>
              </div>
            )}
          </>
        ) : (
          <ScanPostEditor 
            extractedData={extractedData}
            isSaving={isSaving}
            saveSuccessMsg={saveSuccessMsg}
            error={error}
            onClearAll={clearAll}
            onSaveAuditChanges={handleSaveAuditChanges}
            handleUpdateField={(f, v) => setExtractedData((p: any) => ({ ...p, [f]: v }))}
            handleUpdateProvider={(f, v) => setExtractedData((p: any) => ({ ...p, proveedor: { ...p?.proveedor, [f]: v } }))}
            handleUpdateClient={(f, v) => setExtractedData((p: any) => ({ ...p, cliente_receptor: { ...p?.cliente_receptor, [f]: v } }))}
            handleUpdateItem={handleUpdateItem}
            handleAddItem={() => setExtractedData((p: any) => ({ ...p, items: [...(p?.items||[]), { descripcion: "Nuevo Producto", cantidad_ingresada: 1, costo_unitario_compra: 0 }] }))}
            handleRemoveItem={(idx) => setExtractedData((p: any) => ({ ...p, items: p.items.filter((_: any, i: number) => i !== idx) }))}
          />
        )}
      </div>
    </div>
  );
}