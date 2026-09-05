import { X } from "lucide-react";

export default function HistoryModal({ factura, onClose }: any) {
  if (!factura) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Detalle de Factura Consolidada</h2>
            <p className="text-sm text-gray-500">Documento inmutable (Solo lectura)</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">N° Factura</p>
              <p className="font-semibold text-gray-800">{factura.numeroFactura}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Fecha de Emisión</p>
              <p className="font-semibold text-gray-800">{new Date(factura.fechaEmision).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Categoría</p>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {factura.categoria}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Estado</p>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                factura.estadoPago === 'PAGADA' ? 'bg-green-100 text-green-700' :
                factura.estadoPago === 'PENDIENTE' ? 'bg-orange-100 text-orange-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {factura.estadoPago}
              </span>
            </div>
          </div>

          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-2">Datos del Proveedor</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Razón Social</p>
                <p className="font-medium">{factura.proveedor?.razonSocial}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">NIT</p>
                <p className="font-medium">{factura.proveedor?.nit}</p>
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-gray-700 mb-3">Ítems de la Factura</h3>
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-xs uppercase font-medium">
                <th className="p-3 rounded-tl-lg">Descripción</th>
                <th className="p-3 text-right">Cant.</th>
                <th className="p-3 text-right">Precio Unit.</th>
                <th className="p-3 text-right rounded-tr-lg">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {factura.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="p-3 text-sm text-gray-800">{item.descripcion}</td>
                  <td className="p-3 text-sm text-gray-600 text-right">{item.cantidad}</td>
                  <td className="p-3 text-sm text-gray-600 text-right">$ {Number(item.precioUnitario).toLocaleString()}</td>
                  <td className="p-3 text-sm font-medium text-gray-800 text-right">$ {Number(item.subtotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-64 bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
              <span className="font-bold text-gray-700">Total Factura:</span>
              <span className="font-bold text-blue-700 text-xl">$ {Number(factura.totalFactura).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
