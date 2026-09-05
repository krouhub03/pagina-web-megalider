"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Package,
  Layers,
  X,
  Loader2,
  AlertCircle,
  Edit2,
  Power,
  CheckCircle2,
  FileText,
  HelpCircle,
} from "lucide-react";

interface PucCuenta {
  codigo: string;
  nombre: string | null;
  nivel?: number | null;
  naturaleza?: string | null;
}

interface TipoOperacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  cuentaPucDebito: string;
  cuentaPucCredito: string | null;
  afectaInventario: boolean;
  esRemision: boolean;
  activo: boolean;
  cuentaDebito?: PucCuenta | null;
  cuentaCredito?: PucCuenta | null;
}

export default function TiposOperacionInteractive({
  tiposIniciales,
  pucCuentas,
}: {
  tiposIniciales: TipoOperacion[];
  pucCuentas: PucCuenta[];
}) {
  const [tipos, setTipos] = useState<TipoOperacion[]>(tiposIniciales);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "inactivos">("activos");
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoOperacion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Mapa rápido de cuentas PUC para acceso O(1)
  const pucMap = useMemo(() => {
    const map = new Map<string, PucCuenta>();
    pucCuentas.forEach((p) => map.set(p.codigo, p));
    return map;
  }, [pucCuentas]);

  // Cuentas auxiliares (mínimo 6 dígitos) recomendadas para imputación
  const cuentasAuxiliares = useMemo(() => {
    return pucCuentas.filter((p) => p.codigo.length >= 6);
  }, [pucCuentas]);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    cuentaPucDebito: "143505",
    cuentaPucCredito: "220505",
    afectaInventario: true,
    esRemision: false,
    activo: true,
  });

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 3500);
  };

  const handleOpenCreate = () => {
    setEditingTipo(null);
    setErrorMsg("");
    setFormData({
      codigo: "",
      nombre: "",
      descripcion: "",
      cuentaPucDebito: "143505",
      cuentaPucCredito: "220505",
      afectaInventario: true,
      esRemision: false,
      activo: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (tipo: TipoOperacion) => {
    setEditingTipo(tipo);
    setErrorMsg("");
    setFormData({
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || "",
      cuentaPucDebito: tipo.cuentaPucDebito,
      cuentaPucCredito: tipo.cuentaPucCredito || "220505",
      afectaInventario: Boolean(tipo.afectaInventario),
      esRemision: Boolean(tipo.esRemision),
      activo: Boolean(tipo.activo),
    });
    setShowModal(true);
  };

  const handleToggleActivo = async (tipo: TipoOperacion) => {
    setTogglingId(tipo.id);
    try {
      const nuevoEstado = !tipo.activo;
      const res = await fetch(`/api/contabilidad/tipos-operacion/${tipo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      const json = await res.json();
      if (json.success) {
        setTipos((prev) =>
          prev.map((t) => (t.id === tipo.id ? { ...t, activo: nuevoEstado } : t))
        );
        showNotification(
          nuevoEstado
            ? `Tipo de operación "${tipo.nombre}" activado.`
            : `Tipo de operación "${tipo.nombre}" inactivado.`
        );
      } else {
        alert(json.error?.message || json.error || "No se pudo cambiar el estado");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al cambiar el estado");
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.nombre.trim()) {
      setErrorMsg("El nombre descriptivo es obligatorio.");
      return;
    }

    if (!editingTipo && !formData.codigo.trim()) {
      setErrorMsg("El código único es obligatorio.");
      return;
    }

    if (!formData.cuentaPucDebito) {
      setErrorMsg("Debes seleccionar una cuenta Débito del PUC.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTipo) {
        // Actualizar tipo existente
        const res = await fetch(`/api/contabilidad/tipos-operacion/${editingTipo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            cuentaPucDebito: formData.cuentaPucDebito,
            cuentaPucCredito: formData.cuentaPucCredito || null,
            afectaInventario: formData.afectaInventario,
            esRemision: formData.esRemision,
            activo: formData.activo,
          }),
        });

        const json = await res.json();
        if (json.success) {
          const updatedItem = json.data;
          setTipos((prev) =>
            prev.map((t) =>
              t.id === editingTipo.id
                ? {
                    ...t,
                    ...updatedItem,
                    cuentaDebito: pucMap.get(updatedItem.cuentaPucDebito) || null,
                    cuentaCredito: updatedItem.cuentaPucCredito
                      ? pucMap.get(updatedItem.cuentaPucCredito) || null
                      : null,
                  }
                : t
            )
          );
          setShowModal(false);
          showNotification(`"${formData.nombre}" actualizado correctamente.`);
        } else {
          setErrorMsg(json.error?.message || json.error || "Error al actualizar");
        }
      } else {
        // Crear nuevo tipo
        const res = await fetch("/api/contabilidad/tipos-operacion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            codigo: formData.codigo,
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            cuentaPucDebito: formData.cuentaPucDebito,
            cuentaPucCredito: formData.cuentaPucCredito || null,
            afectaInventario: formData.afectaInventario,
            esRemision: formData.esRemision,
          }),
        });

        const json = await res.json();
        if (json.success) {
          const newItem = {
            ...json.data,
            cuentaDebito: pucMap.get(json.data.cuentaPucDebito) || null,
            cuentaCredito: json.data.cuentaPucCredito
              ? pucMap.get(json.data.cuentaPucCredito) || null
              : null,
          };
          setTipos((prev) => [newItem, ...prev]);
          setShowModal(false);
          showNotification(`Tipo de operación "${formData.nombre}" creado exitosamente.`);
        } else {
          setErrorMsg(json.error?.message || json.error || "Error al crear");
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de comunicación con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtrados = useMemo(() => {
    return tipos.filter((t) => {
      // Filtro de estado
      if (filtroEstado === "activos" && !t.activo) return false;
      if (filtroEstado === "inactivos" && t.activo) return false;

      // Filtro de búsqueda
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const nombreDebito = t.cuentaDebito?.nombre?.toLowerCase() || pucMap.get(t.cuentaPucDebito)?.nombre?.toLowerCase() || "";
      const nombreCredito = t.cuentaCredito?.nombre?.toLowerCase() || (t.cuentaPucCredito ? pucMap.get(t.cuentaPucCredito)?.nombre?.toLowerCase() : "") || "";

      return (
        t.nombre.toLowerCase().includes(q) ||
        t.codigo.toLowerCase().includes(q) ||
        t.cuentaPucDebito.includes(q) ||
        (t.cuentaPucCredito && t.cuentaPucCredito.includes(q)) ||
        nombreDebito.includes(q) ||
        nombreCredito.includes(q)
      );
    });
  }, [tipos, search, filtroEstado, pucMap]);

  return (
    <div className="space-y-6">
      {/* Toast de Éxito */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#044a23] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Barra de Filtros, Búsqueda y Botón de Creación */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o cuenta PUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] focus:border-transparent bg-gray-50/50 outline-none transition"
            />
          </div>

          {/* Filtro de Estado (Tabs) */}
          <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => setFiltroEstado("activos")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroEstado === "activos"
                  ? "bg-white text-[#044a23] shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              Activos ({tipos.filter((t) => t.activo).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado("inactivos")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroEstado === "inactivos"
                  ? "bg-white text-gray-900 shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              Inactivos ({tipos.filter((t) => !t.activo).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado("todos")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filtroEstado === "todos"
                  ? "bg-white text-gray-900 shadow-sm font-bold"
                  : "hover:text-gray-900"
              }`}
            >
              Todos ({tipos.length})
            </button>
          </div>
        </div>

        {/* Botón Nuevo Tipo */}
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-[#044a23] hover:bg-[#033619] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#044a23]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Tipo de Operación
        </button>
      </div>

      {/* Grid de Tarjetas */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-800 text-base mb-1">No se encontraron tipos de operación</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {search
              ? "Prueba con otros términos de búsqueda o cambia el filtro de estado."
              : "No hay registros bajo este criterio de búsqueda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrados.map((tipo) => {
            const debito = tipo.cuentaDebito || pucMap.get(tipo.cuentaPucDebito);
            const credito = tipo.cuentaCredito || (tipo.cuentaPucCredito ? pucMap.get(tipo.cuentaPucCredito) : null);

            return (
              <div
                key={tipo.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md ${
                  tipo.activo ? "border-gray-200" : "border-gray-200 bg-gray-50/70 opacity-75"
                }`}
              >
                {/* Header de la Tarjeta */}
                <div className="p-5 pb-3">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200/60">
                      {tipo.codigo}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {tipo.afectaInventario ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <Package className="w-3 h-3 text-emerald-600" /> Inventario
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          <Layers className="w-3 h-3 text-slate-500" /> Gasto / Activo
                        </span>
                      )}

                      {tipo.esRemision && (
                        <span className="inline-flex text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Remisión
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mb-1 tracking-tight">
                    {tipo.nombre}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2 min-h-[32px]">
                    {tipo.descripcion || "Sin descripción adicional"}
                  </p>
                </div>

                {/* Detalle Contable PUC */}
                <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-gray-500 font-medium">Cuenta Débito:</span>
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {tipo.cuentaPucDebito}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-sans truncate" title={debito?.nombre || ""}>
                      {debito?.nombre || "Cuenta auxiliar"}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-gray-500 font-medium">Contrapartida (Crédito):</span>
                      <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {tipo.cuentaPucCredito || "220505"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-sans truncate" title={credito?.nombre || "Proveedores Nacionales"}>
                      {credito?.nombre || "Proveedores Nacionales"}
                    </p>
                  </div>
                </div>

                {/* Footer de Acciones (Editar / Inactivar) */}
                <div className="px-5 py-2.5 bg-white border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tipo.activo ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="text-[11px] font-medium text-gray-500">
                      {tipo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(tipo)}
                      disabled={togglingId === tipo.id}
                      title={tipo.activo ? "Inactivar tipo de operación" : "Activar tipo de operación"}
                      className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                        tipo.activo
                          ? "border-gray-200 text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                          : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      }`}
                    >
                      {togglingId === tipo.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tipo)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear o Editar Tipo de Operación */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingTipo ? "Editar Tipo de Operación" : "Nuevo Tipo de Operación Contable"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Parametriza el destino en PUC y el impacto en stock
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre Descriptivo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 📦 Compra de Mercancía / Licores"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#044a23] focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Código Único *</span>
                    {editingTipo && <span className="text-[10px] text-gray-400 font-normal">Inmutable</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTipo}
                    placeholder="COMPRA_MERCANCIA"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        codigo: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-mono outline-none transition ${
                      editingTipo
                        ? "bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed"
                        : "border-gray-300 focus:ring-2 focus:ring-[#044a23]"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cuenta Débito (PUC) *
                  </label>
                  <select
                    value={formData.cuentaPucDebito}
                    onChange={(e) => setFormData({ ...formData, cuentaPucDebito: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white font-mono"
                  >
                    {pucCuentas.map((p) => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.codigo} - {p.nombre} {p.codigo.length >= 6 ? "✓" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cuenta Contrapartida / Crédito (Pasivo)
                  </label>
                  <select
                    value={formData.cuentaPucCredito}
                    onChange={(e) => setFormData({ ...formData, cuentaPucCredito: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none bg-white font-mono"
                  >
                    {pucCuentas.map((p) => (
                      <option key={p.codigo} value={p.codigo}>
                        {p.codigo} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Descripción Operativa
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre qué compras, costos o gastos abarca este concepto..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-[#044a23] outline-none transition"
                  />
                </div>

                {/* Checkboxes de Configuración */}
                <div className="col-span-2 space-y-2.5 pt-2 border-t border-gray-100">
                  <label className="flex items-start gap-2.5 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.afectaInventario}
                      onChange={(e) => setFormData({ ...formData, afectaInventario: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-[#044a23] focus:ring-[#044a23] accent-[#044a23]"
                    />
                    <div>
                      <span className="font-semibold text-gray-900 block">¿Suma existencias al stock de inventario?</span>
                      <span className="text-[11px] text-gray-500">
                        Marcar para mercancía de venta física en tienda. Desmarcar para gastos de servicios, arriendo o activos.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.esRemision}
                      onChange={(e) => setFormData({ ...formData, esRemision: e.target.checked })}
                      className="w-4 h-4 mt-0.5 rounded text-[#044a23] focus:ring-[#044a23] accent-[#044a23]"
                    />
                    <div>
                      <span className="font-semibold text-gray-900 block">¿Es soporte de entrega / remisión transitoria?</span>
                      <span className="text-[11px] text-gray-500">
                        Provisión transitoria de mercancía previa a la factura electrónica DIAN.
                      </span>
                    </div>
                  </label>

                  {editingTipo && (
                    <label className="flex items-start gap-2.5 text-xs font-medium text-gray-700 cursor-pointer pt-1 border-t border-gray-100">
                      <input
                        type="checkbox"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                        className="w-4 h-4 mt-0.5 rounded text-[#044a23] focus:ring-[#044a23] accent-[#044a23]"
                      />
                      <div>
                        <span className="font-semibold text-gray-900 block">Tipo de Operación Activo</span>
                        <span className="text-[11px] text-gray-500">
                          Si está inactivo, no aparecerá en los selectores de facturas nuevas, pero conservará el histórico contable.
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#044a23] hover:bg-[#033619] text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingTipo ? "Guardar Cambios" : "Crear Tipo de Operación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
