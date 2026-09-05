"use client";

export function DocumentDetailsForm({ data, setData, handleUpdateField }: any) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return parts[0].length === 4 
        ? dateStr.replace(/\//g, '-')
        : `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return "";
  };

  return (
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
            value={formatDate(data.fecha_emision)} 
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
            value={formatDate(data.fecha_vencimiento)} 
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
  );
}