import React from "react";
import Link from "next/link";
import { dbPostgres, schema } from "@/lib/db/postgres";
import { desc } from "drizzle-orm";
import { Bot, History, ArrowRight, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

type CorreccionWithEgreso = typeof schema.historialCorrecciones.$inferSelect & {
  egreso?: typeof schema.egresosTienda.$inferSelect | null;
};

export default async function HermesLogsPage() {
  let correcciones: CorreccionWithEgreso[] = [];
  try {
    correcciones = await dbPostgres.query.historialCorrecciones.findMany({
      orderBy: [desc(schema.historialCorrecciones.corregidoEn)],
      with: {
        egreso: true,
      },
      limit: 50,
    });
  } catch (error) {
    console.error("Error al cargar historial:", error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">
              Dashboard
            </Link>
            <span>/</span>
            <span>Auditoría</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Auditoría de Acciones y Correcciones de Hermes IA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico de modificaciones manuales realizadas sobre los egresos de Hermes Bot.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900">
        <Bot className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Mecanismo de Seguridad y Trazabilidad:</span> Cualquier corrección
          a facturas o egresos realizada por un usuario administrativo queda registrada aquí automáticamente con el
          valor original, el nuevo valor ingresado y el motivo reportado.
        </div>
      </div>

      {/* Logs Table Card */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Historial de Correcciones ({correcciones.length})
          </h3>
        </div>

        {correcciones.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">Sin modificaciones registradas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Todos los datos ingresados por Hermes IA se encuentran actualmente en su estado original sin correcciones manuales.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Fecha Modificación</th>
                  <th className="p-4">Egreso Afectado</th>
                  <th className="p-4">Campo Modificado</th>
                  <th className="p-4">Valor Anterior → Nuevo</th>
                  <th className="p-4">Motivo</th>
                  <th className="p-4">Usuario Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {correcciones.map((corr) => (
                  <tr key={corr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {corr.corregidoEn ? new Date(corr.corregidoEn).toLocaleString("es-CO") : "—"}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      Egreso #{corr.egresoId}
                      {corr.egreso?.descripcion && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {corr.egreso.descripcion}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold text-[10px]">
                        {corr.campoModificado}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="line-through text-rose-600 font-medium">
                          {corr.valorAnterior || "(vacío)"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-700 font-bold">
                          {corr.valorNuevo || "(vacío)"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 italic max-w-xs">
                      {corr.motivo || "Ajuste manual administrativo"}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <Badge variant="emerald">
                        <UserCheck className="w-3 h-3" />
                        {corr.corregidoPor}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
