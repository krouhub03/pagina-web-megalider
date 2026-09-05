"use client";
import { X, AlertTriangle, RefreshCw } from "lucide-react";

export function AuditActionModals({
  showCreateProviderModal, setShowCreateProviderModal, newProviderData, setNewProviderData, 
  handleCreateProvider, createProviderError, isCreatingProvider,
  showRescanModal, setShowRescanModal, rescanFeedback, setRescanFeedback, 
  handleRescan, isRescanning
}: any) {
  return (
    <>
      {showCreateProviderModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Crear Nuevo Proveedor</h3>
              <button onClick={() => setShowCreateProviderModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">NIT</label>
                <input type="text" value={newProviderData.nit} onChange={(e) => setNewProviderData({...newProviderData, nit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Razón Social</label>
                <input type="text" value={newProviderData.razonSocial} onChange={(e) => setNewProviderData({...newProviderData, razonSocial: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              {createProviderError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{createProviderError}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreateProviderModal(false)} disabled={isCreatingProvider} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
                <button onClick={handleCreateProvider} disabled={isCreatingProvider} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
                  {isCreatingProvider && <RefreshCw className="w-4 h-4 animate-spin" />} Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRescanModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-amber-50">
              <h3 className="font-bold text-amber-900">Instrucciones para Reescanear</h3>
              <button onClick={() => setShowRescanModal(false)} className="text-amber-400 hover:text-amber-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 bg-amber-50 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-amber-900 mb-2">¿Qué debe corregir la IA?</label>
                <textarea value={rescanFeedback} onChange={(e) => setRescanFeedback(e.target.value)} placeholder="Ej: Faltó un producto que cuesta $50,000..." rows={3} className="w-full text-sm px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 bg-white" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowRescanModal(false)} className="px-4 py-2 border border-amber-300 bg-white rounded-lg text-amber-800 hover:bg-amber-100">Cancelar</button>
                <button onClick={handleRescan} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 shadow"><RefreshCw className="w-4 h-4" /> Reescanear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}