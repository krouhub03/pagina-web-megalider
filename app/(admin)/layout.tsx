import React from "react";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";
import { getSession } from "@/lib/auth/jwt";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Si no hay sesión activa, redirigir al login
  if (!session) {
    redirect("/login");
  }

  // Si el usuario es de rol CLIENTE o no autorizado, bloquear y redirigir al inicio público
  const staffRoles = ["SUPERADMIN", "ADMIN"];
  if (!staffRoles.includes(session.rol)) {
    redirect("/");
  }

  return (
    // Estructura principal flex: en móvil el sidebar desaparece y el hijo toma el 100%
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans w-full">
      {/* Sidebar fijo (Ya maneja su propio responsive con hidden md:flex) */}
      <AdminSidebar />

      {/* Contenedor del header y el contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <AdminHeader />
        
        {/* 
          Ajustes responsivos:
          - p-4: Menos padding en móviles para maximizar espacio
          - sm:p-6 md:p-8: Más padding en tablets y desktop
          - overflow-x-hidden: Previene scroll horizontal indeseado en móviles
        */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}