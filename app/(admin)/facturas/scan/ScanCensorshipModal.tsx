import { useState, useRef } from "react";
import { EyeOff, X, ShieldAlert, Check } from "lucide-react";
import { DocumentImageEditor, DocumentImageEditorHandle } from "@/components/facturas/DocumentImageEditor";

interface Props {
  editingIndex: number;
  imageSrc: string;
  initialDrawings: any[];
  onClose: () => void;
  onClearMarks: (index: number) => void;
  onSave: (index: number, compositeUrl: string, drawings: any[]) => void;
  onRemoveCensorship: (index: number) => void;
}

export function ScanCensorshipModal({ editingIndex, imageSrc, initialDrawings, onClose, onClearMarks, onSave, onRemoveCensorship }: Props) {
  const [showPrivacyGuide, setShowPrivacyGuide] = useState(false);
  const editorModalRef = useRef<DocumentImageEditorHandle>(null);

  const handleSave = () => {
    const composite = editorModalRef.current?.getCompositeDataUrl(0);
    const drawings = editorModalRef.current?.getDrawings() || {};
    const pageDrawings = drawings[0] || [];

    if (composite && pageDrawings.length > 0) {
      onSave(editingIndex, composite, pageDrawings);
    } else {
      onRemoveCensorship(editingIndex);
    }
  };

  const handleClearAll = () => {
    editorModalRef.current?.clearAllMarks();
    onClearMarks(editingIndex);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-3 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-rose-600" />
              Censurar Información - Página {editingIndex + 1}
            </h2>
            <p className="text-xs text-gray-500">
              Oculta con cuadros o círculos negros los datos sensibles antes del envío.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPrivacyGuide(!showPrivacyGuide)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                showPrivacyGuide ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{showPrivacyGuide ? "Cerrar Guía" : "¿Qué censurar?"}</span>
            </button>
            <button onClick={handleSave} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guía de privacidad */}
        {showPrivacyGuide && (
          <div className="bg-slate-900 text-slate-100 px-6 py-3 border-b border-slate-800 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-rose-500/30">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1.5">🔴 Datos para Ocultar</div>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                <li><strong className="text-white">Cédula o NIT personal</strong></li>
                <li><strong className="text-white">Dirección de domicilio</strong></li>
                <li><strong className="text-white">Teléfonos y correos personales</strong></li>
                <li><strong className="text-white">Datos bancarios</strong></li>
              </ul>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-lg border border-emerald-500/30">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1.5">🟡 Conservar (Requeridos)</div>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                <li><strong className="text-white">Razón social y NIT comercial</strong></li>
                <li><strong className="text-white">N° factura y fecha</strong></li>
                <li><strong className="text-white">Productos y totales</strong></li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative">
          <DocumentImageEditor
            ref={editorModalRef}
            images={[imageSrc]}
            currentIndex={0}
            initialDrawings={initialDrawings ? { 0: initialDrawings } : undefined}
            className="w-full h-full"
            showPagination={false}
          />
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center">
          <button onClick={handleClearAll} className="text-xs text-gray-600 hover:text-red-600 font-medium">
            Quitar todas las marcas
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium text-gray-700">
              Cancelar
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> Guardar Censura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}