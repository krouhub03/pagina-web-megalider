"use client";

import {
  X,
  Save,
  Loader2,
  Building2,
  FileText,
  Calculator,
  AlertCircle,
} from "lucide-react";

import { ModalEditarFacturaHistorialProps } from "./types";
import { useFacturaEdicion } from "./useFacturaEdicion";
import { TabGeneral } from "./TabGeneral";
import { TabItems } from "./TabItems";

export default function ModalEditarFacturaHistorial({
  facturaId,
  onClose,
  onSuccess,
}: ModalEditarFacturaHistorialProps) {
  const {
    isLoading,
    isSaving,
    error,
    activeTab,
    setActiveTab,
    form,
    setForm,
    items,
    tiposOperacion,
    mediosPago,
    cuentasTesoreriaFiltradas,
    calculos,
    handleItemChange,
    handleAddItem,
    handleRemoveItem,
    handleSave,
  } = useFacturaEdicion(facturaId, onSuccess, onClose);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-none sm:rounded-2xl w-full h-full sm:h-[90vh] sm:max-w-4xl flex flex-col overflow-hidden shadow-2xl border-0 sm:border border-gray-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#044a23] text-white flex items-center justify-center shadow-sm shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif font-bold text-base sm:text-lg text-gray-900 truncate">
                Modificar Factura #{form.numeroFactura || facturaId}
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                {form.proveedorNombre ? `${form.proveedorNombre} (NIT: ${form.proveedorNit})` : "Edición y recálculo contable"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Responsive scrollable container) */}
        <div className="flex border-b border-gray-200 bg-white px-4 sm:px-6 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("general")}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "general"
                ? "border-[#044a23] text-[#044a23]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            Datos Generales
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "items"
                ? "border-[#044a23] text-[#044a23]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            Productos ({items.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#044a23]" />
              <p className="text-xs text-gray-500">Cargando datos de la factura...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {activeTab === "general" && (
                <TabGeneral
                  form={form}
                  setForm={setForm}
                  tiposOperacion={tiposOperacion}
                  mediosPago={mediosPago}
                  cuentasTesoreriaFiltradas={cuentasTesoreriaFiltradas}
                />
              )}

              {activeTab === "items" && (
                <TabItems
                  items={items}
                  calculos={calculos}
                  handleItemChange={handleItemChange}
                  handleAddItem={handleAddItem}
                  handleRemoveItem={handleRemoveItem}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer (Stacked on mobile, row on desktop) */}
        <div className="p-4 bg-gray-50/90 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-gray-500 font-mono w-full sm:w-auto text-center sm:text-left">
            Total Liquidado: <strong className="text-gray-900">${calculos.total.toLocaleString("es-CO", { maximumFractionDigits: 0 })}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-initial px-4 py-2.5 sm:py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex-1 sm:flex-initial px-5 py-2.5 sm:py-2 text-xs font-semibold text-white bg-[#044a23] hover:bg-[#033b1c] rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}