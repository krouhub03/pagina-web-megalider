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
  const staffRoles = ["SUPERADMIN", "ADMIN", "CAJERO"];
  if (!staffRoles.includes(session.rol)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
      {/* Sidebar fijo */}
      <AdminSidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

