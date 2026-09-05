import { useState, useEffect } from "react";

export function useFacturas() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFacturas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/facturas/audit");
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
  }, []);

  const handleApprove = async (id: number, correctedData: any, auditMetadata: any, onSuccess: () => void) => {
    try {
      await fetch("/api/facturas/audit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, datosExtraidos: correctedData })
      });
      
      const res = await fetch(`/api/facturas/audit/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoOperacionId: auditMetadata.tipoOperacionId,
          medioPagoId: auditMetadata.medioPagoId,
          observaciones: auditMetadata.observacionAuditoria
        })
      });
      
      if (res.ok) {
        onSuccess(); // Cierra el modal y refresca
        fetchFacturas();
      } else {
        const error = await res.json();
        alert(error.error || "Error al aprobar");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    }
  };

  const handleDiscard = async (id: number, onSuccess: () => void) => {
    if (!confirm("¿Seguro que deseas descartar esta factura permanentemente?")) return;
    try {
      const res = await fetch(`/api/facturas/audit?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        onSuccess(); // Cierra el modal y refresca
        fetchFacturas();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return { 
    facturas, 
    setFacturas, 
    isLoading, 
    handleApprove, 
    handleDiscard 
  };
}