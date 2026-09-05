"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, Download, Filter, Eye } from "lucide-react";
import HistoryModal from "@/components/facturas/HistoryModal";

export default function ConsolidadoFacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  
  // Filtros
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");

  const fetchFacturas = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (categoria) query.append("categoria", categoria);
      if (estado) query.append("estado", estado);

      const res = await fetch(`/api/facturas/consolidated?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setFacturas(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, [categoria, estado]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historial Consolidado</h1>
          <p className="text-gray-500">Facturas aprobadas e inmutables (Base de datos MySQL)</p>
        </div>
        
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar a Excel
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="N° de factura..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchFacturas()}
            />
          </div>
        </div>
        
        <div className="w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoría Contable</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="INVENTARIO">Inventario / Mercancía</option>
            <option value="OPEX">Gastos Operativos (Opex)</option>
            <option value="ACTIVOS">Activos</option>
          </select>
        </div>

        <div className="w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1">Estado de Pago</label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="PAGADA">Pagada</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CREDITO_30_DIAS">Crédito a 30 días</option>
          </select>
        </div>

        <button 
          onClick={fetchFacturas}
          className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
        >
          Aplicar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="px-6 py-4">Fecha Emisión</th>
                <th className="px-6 py-4">Proveedor / N° Factura</th>
                <th className="px-6 py-4 text-center">Clasificación</th>
                <th className="px-6 py-4 text-center">Estado Pago</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facturas.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(f.fechaEmision).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{f.proveedor?.razonSocial}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>NIT: {f.proveedor?.nit}</span>
                      <span className="text-gray-300">|</span>
                      <span>Fac: {f.numeroFactura}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">
                      {f.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                      f.estadoPago === 'PAGADA' ? 'bg-green-50 text-green-700 border-green-200' :
                      f.estadoPago === 'PENDIENTE' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {f.estadoPago.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-800">
                    $ {Number(f.totalFactura).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedFactura(f)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition tooltip"
                      title="Ver Detalles"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {facturas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron facturas que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedFactura && (
        <HistoryModal 
          factura={selectedFactura} 
          onClose={() => setSelectedFactura(null)}
        />
      )}
    </div>
  );
}
