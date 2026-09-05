"use client";

import { useState, useEffect, useMemo } from "react";
import HistoryModal from "@/components/facturas/HistoryModal";
import ModalEditarFacturaHistorial from "@/components/facturas/ModalEditarFacturaHistorial";
import ModalEliminarFactura from "@/components/facturas/ModalEliminarFactura";
import ModalConciliacionFactura from "@/components/facturas/ModalConciliacionFactura";
import ModalDocumentoSoporte from "@/components/facturas/ModalDocumentoSoporte";

import { TipoOperacion, MedioPago, FacturaHistorial } from "./types";
import FacturasHeader from "./FacturasHeader";
import FacturasFilters from "./FacturasFilters";
import FacturasTable from "./FacturasTable";

export default function ConsolidadoFacturasPage() {
  const [facturas, setFacturas] = useState<FacturaHistorial[]>([]);
  const [tiposOperacion, setTiposOperacion] = useState<TipoOperacion[]>([]);
  const [mediosPago, setMediosPago] = useState<MedioPago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFactura, setSelectedFactura] = useState<FacturaHistorial | null>(null);
  const [facturaAConciliar, setFacturaAConciliar] = useState<FacturaHistorial | null>(null);
  const [facturaAEditar, setFacturaAEditar] = useState<FacturaHistorial | null>(null);
  const [facturaAEliminar, setFacturaAEliminar] = useState<FacturaHistorial | null>(null);
  const [isModalDocSoporteOpen, setIsModalDocSoporteOpen] = useState(false);
  const [isSyncingAsientos, setIsSyncingAsientos] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sincronizar asientos contables faltantes en el Libro Diario
  const handleSyncLibroDiario = async () => {
    setIsSyncingAsientos(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/contabilidad/asientos/sync", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({
          type: "success",
          text: data.message || `Sincronización exitosa: ${data.data?.asientosGenerados ?? 0} asientos contables generados.`,
        });
        fetchFacturas();
      } else {
        setSyncMessage({
          type: "error",
          text: data.error?.message || "Error al sincronizar asientos con el Libro Diario.",
        });
      }
    } catch (err: any) {
      setSyncMessage({
        type: "error",
        text: "Error de red al sincronizar con el Libro Diario.",
      });
    } finally {
      setIsSyncingAsientos(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  // Filtros reactivos adaptados
  const [search, setSearch] = useState("");
  const [filtroTipoOp, setFiltroTipoOp] = useState<string>("todos");
  const [filtroEstadoContable, setFiltroEstadoContable] = useState<string>("todos");
  const [filtroMedioPago, setFiltroMedioPago] = useState<string>("todos");

  // Cargar catálogos auxiliares (Tipos de Operación y Medios de Pago)
  useEffect(() => {
    fetch("/api/contabilidad/tipos-operacion")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setTiposOperacion(json.data);
      })
      .catch(console.error);

    fetch("/api/contabilidad/tesoreria?tipo=medios")
      .then((res) => res.json())
      .then((json) => {
        if (json?.data && Array.isArray(json.data)) setMediosPago(json.data);
      })
      .catch(console.error);
  }, []);

  // Cargar facturas consolidadas
  const fetchFacturas = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.append("search", search.trim());
      if (filtroTipoOp !== "todos") query.append("tipoOperacionId", filtroTipoOp);
      if (filtroEstadoContable !== "todos") query.append("estadoContable", filtroEstadoContable);
      if (filtroMedioPago !== "todos") query.append("medioPagoId", filtroMedioPago);

      const res = await fetch(`/api/facturas/consolidated?${query.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFacturas(json.data);
      }
    } catch (e) {
      console.error("Error al cargar historial:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturas();
  }, [filtroTipoOp, filtroEstadoContable, filtroMedioPago]);

  // Manejo de búsqueda con debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchFacturas();
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const hasActiveFilters =
    search.trim() !== "" ||
    filtroTipoOp !== "todos" ||
    filtroEstadoContable !== "todos" ||
    filtroMedioPago !== "todos";

  const handleLimpiarFiltros = () => {
    setSearch("");
    setFiltroTipoOp("todos");
    setFiltroEstadoContable("todos");
    setFiltroMedioPago("todos");
  };

  // KPIs de resumen
  const kpis = useMemo(() => {
    const totalRegistros = facturas.length;
    let montoTotal = 0;
    let totalConciliadas = 0;
    let montoConciliadas = 0;
    let totalPendientes = 0;
    for (const f of facturas) {
      const valor = Number(f.totalFactura) || 0;
      montoTotal += valor;
      if (f.estadoContable === "CONCILIADA" || f.estadoContable === "PAGADA") {
        totalConciliadas++;
        montoConciliadas += valor;
      } else {
        totalPendientes++;
      }
    }

    return {
      totalRegistros,
      montoTotal,
      totalConciliadas,
      montoConciliadas,
      totalPendientes,
    };
  }, [facturas]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (facturas.length === 0) return;

    const headers = [
      "ID",
      "Fecha Emision",
      "Numero Factura",
      "Tipo Documento",
      "NIT Proveedor",
      "Razon Social Proveedor",
      "Tipo Operacion",
      "Medio Pago",
      "Cuenta Tesoreria",
      "Estado Contable",
      "Subtotal",
      "IVA",
      "Impoconsumo",
      "Total",
    ];

    const rows = facturas.map((f) => [
      f.id,
      f.fechaEmision,
      `"${f.numeroFactura || ""}"`,
      `"${f.tipoDocumento || "Factura"}"`,
      `"${f.proveedor?.nit || ""}"`,
      `"${f.proveedor?.razonSocial || ""}"`,
      `"${f.tipoOperacion?.nombre || "Compra General"}"`,
      `"${f.medioPagoRel?.nombre || "Efectivo"}"`,
      `"${f.cuentaTesoreria?.nombreCuenta || "Sin Asignar"}"`,
      `"${f.estadoContable}"`,
      f.subtotal,
      f.iva,
      f.impoconsumo,
      f.totalFactura,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Historial_Facturas_Megalider_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <FacturasHeader
        isSyncingAsientos={isSyncingAsientos}
        syncMessage={syncMessage}
        facturasCount={facturas.length}
        onSyncLibroDiario={handleSyncLibroDiario}
        onOpenDocSoporte={() => setIsModalDocSoporteOpen(true)}
        onExportCSV={handleExportCSV}
        onCloseSyncMessage={() => setSyncMessage(null)}
      />

      <FacturasFilters
        kpis={kpis}
        search={search}
        setSearch={setSearch}
        filtroTipoOp={filtroTipoOp}
        setFiltroTipoOp={setFiltroTipoOp}
        filtroEstadoContable={filtroEstadoContable}
        setFiltroEstadoContable={setFiltroEstadoContable}
        filtroMedioPago={filtroMedioPago}
        setFiltroMedioPago={setFiltroMedioPago}
        tiposOperacion={tiposOperacion}
        mediosPago={mediosPago}
        hasActiveFilters={hasActiveFilters}
        onLimpiarFiltros={handleLimpiarFiltros}
      />

      <FacturasTable
        facturas={facturas}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onSelectFactura={(f) => setSelectedFactura(f)}
        onConciliarFactura={(f) => setFacturaAConciliar(f)}
        onEditarFactura={(f) => setFacturaAEditar(f)}
        onEliminarFactura={(f) => setFacturaAEliminar(f)}
        onLimpiarFiltros={handleLimpiarFiltros}
      />

      {/* Modales */}
      {selectedFactura && (
        <HistoryModal factura={selectedFactura} onClose={() => setSelectedFactura(null)} />
      )}

      {facturaAConciliar && (
        <ModalConciliacionFactura
          factura={facturaAConciliar}
          onClose={() => setFacturaAConciliar(null)}
          onSuccess={() => {
            fetchFacturas();
            setFacturaAConciliar(null);
          }}
        />
      )}

      {facturaAEditar && (
        <ModalEditarFacturaHistorial
          facturaId={facturaAEditar.id}
          onClose={() => setFacturaAEditar(null)}
          onSuccess={() => {
            fetchFacturas();
            setFacturaAEditar(null);
          }}
        />
      )}

      {facturaAEliminar && (
        <ModalEliminarFactura
          factura={facturaAEliminar}
          onClose={() => setFacturaAEliminar(null)}
          onSuccess={() => {
            fetchFacturas();
            setFacturaAEliminar(null);
          }}
        />
      )}

      <ModalDocumentoSoporte
        isOpen={isModalDocSoporteOpen}
        onClose={() => setIsModalDocSoporteOpen(false)}
        onSuccess={() => {
          fetchFacturas();
          setIsModalDocSoporteOpen(false);
        }}
      />
    </div>
  );
}