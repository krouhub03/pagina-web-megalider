import React from "react";
import Link from "next/link";
import { getUsuarios } from "@/services/usuarios.service";
import { getSession } from "@/lib/auth/jwt";
import UsersManager from "@/components/admin/usuarios/UsersManager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await getSession();
  if (!session || !["SUPERADMIN", "ADMIN"].includes(session.rol)) {
    redirect("/dashboard");
  }

  const usuariosRes = await getUsuarios();
  const users = usuariosRes.data || [];

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
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">
            Control de Usuarios y Roles (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión centralizada de personal administrativo interno (Superadmin, Admin) y clientes externos de la plataforma.
          </p>
        </div>
      </div>

      {/* Interactive Manager */}
      <UsersManager
        initialUsers={users}
        currentUserId={session.id}
        currentUserRole={session.rol}
      />
    </div>
  );
}
