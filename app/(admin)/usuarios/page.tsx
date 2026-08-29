import React from "react";
import Link from "next/link";
import { Users, ShieldCheck, Shield, UserCheck, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

const rolesList = [
  {
    nombre: "SUPERADMIN",
    descripcion: "Control total del sistema: gestión de usuarios, roles, configuraciones críticas y auditoría completa.",
    icono: ShieldCheck,
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    badgeVariant: "emerald" as const,
  },
  {
    nombre: "ADMIN",
    descripcion: "Gestión de contabilidad, supervisión de facturas y egresos de Hermes IA, métricas y catálogo.",
    icono: Shield,
    color: "bg-blue-50 text-blue-800 border-blue-200",
    badgeVariant: "blue" as const,
  },
  {
    nombre: "CAJERO / OPERATIVO",
    descripcion: "Acceso operativo para consulta de catálogo, verificación de precios y registro básico.",
    icono: UserCheck,
    color: "bg-slate-50 text-slate-800 border-slate-200",
    badgeVariant: "neutral" as const,
  },
];

export default function UsuariosPage() {
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
            <span>Seguridad</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Control de Usuarios y Roles (RBAC)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administración de permisos y credenciales de acceso para el personal de Cigarrería Megalider.
          </p>
        </div>
      </div>

      {/* Roles description cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rolesList.map((r) => {
          const Icon = r.icono;
          return (
            <Card
              key={r.nombre}
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-xl border ${r.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant={r.badgeVariant}>{r.nombre}</Badge>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">
                  {r.descripcion}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Users table card */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Buscar usuario por nombre o correo..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Badge variant="mint" dot>
            Autenticación JWT + Google OAuth
          </Badge>
        </div>

        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Módulo de Seguridad Configurado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            La estructura de base de datos en MySQL con soporte para los roles <code>SUPERADMIN</code>, <code>ADMIN</code> y <code>CAJERO</code> se encuentra lista y conectada.
          </p>
        </div>
      </Card>
    </div>
  );
}
