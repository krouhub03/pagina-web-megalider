"use client";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export function ProviderClientForm({
  data,
  proveedoresDB,
  currentNit,
  proveedorStatus,
  dbNameHint,
  handleUpdateProvider,
  handleUpdateClient,
  setShowCreateProviderModal
}: any) {
  return (
    <div className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50">
      
      {/* HEADER: Flex-col en móviles, Flex-row en pantallas grandes */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4 pb-2 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 text-sm">Proveedor y Receptor</h3>
        {currentNit && (
          <div className="flex flex-wrap gap-2">
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

      {/* GRID: 1 columna por defecto (móviles), 2 columnas desde 'sm' (tablets/PC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-4">
        
        {/* Este ocupa todo el ancho disponible en la fila */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs font-semibold text-blue-700 mb-1.5 sm:mb-2">Selecciona proveedor registrado</label>
          <select 
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
            onChange={(e) => {
              const nit = e.target.value;
              if (nit) {
                const found = proveedoresDB.find((p: any) => p.nit === nit);
                if (found) {
                  handleUpdateProvider("nit", found.nit);
                  handleUpdateProvider("razon_social", found.razonSocial);
                }
              }
            }}
            value={proveedoresDB.some((p: any) => p.nit === data.proveedor?.nit) ? data.proveedor?.nit : ""}
          >
            <option value="">— No está en la lista (ingresa abajo) —</option>
            {proveedoresDB.map((p: any) => (
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
              onClick={() => setShowCreateProviderModal(true)}
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
  );
}