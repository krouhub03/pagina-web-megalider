"use client";

import React, { useState } from "react";
import { History, X, User, Calendar, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export interface CorreccionItem {
  id: number;
  campoModificado: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
  motivo: string | null;
  corregidoPor: string | null;
  corregidoEn: string | null;
}

interface DrawerAuditoriaEgresoProps {
  egresoId: number;
  descripcion: string;
  correcciones: CorreccionItem[];
}

export function DrawerAuditoriaEgreso({
  descripcion,
  correcciones,
}: DrawerAuditoriaEgresoProps) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
        title="Ver historial de auditoría y cambios"
      >
        <History className="w-3 h-3" />
        {correcciones.length} cambios
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Historial de Auditoría
                  </h2>
                  <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                    {descripcion}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAbierto(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timeline content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {correcciones.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No hay modificaciones registradas para este egreso.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-amber-200 ml-3 space-y-6">
                  {correcciones.map((item) => (
                    <div key={item.id} className="relative pl-6">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 mb-1.5">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {item.corregidoPor || "Usuario"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(item.corregidoEn || "")}
                          </span>
                        </div>

                        <div className="text-xs mb-1 font-medium text-slate-800">
                          Campo Modificado:{" "}
                          <Badge variant="amber" className="ml-1 uppercase text-[9px]">
                            {item.campoModificado}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-slate-200/60 my-2">
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">
                              Valor Anterior
                            </span>
                            <span className="text-rose-600 font-mono line-through">
                              {item.valorAnterior || "(vacío)"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">
                              Valor Nuevo
                            </span>
                            <span className="text-emerald-700 font-bold font-mono">
                              {item.valorNuevo || "(vacío)"}
                            </span>
                          </div>
                        </div>

                        {item.motivo && (
                          <div className="text-[11px] text-slate-600 bg-amber-50/50 p-2 rounded border border-amber-100 flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-amber-900">Motivo: </span>
                              {item.motivo}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setAbierto(false)}>
                Cerrar Audit
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
