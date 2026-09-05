"use client";

import React, { useTransition } from "react";
import { Bell, ShieldCheck, LogOut, Menu } from "lucide-react"; // Agrupé las importaciones de lucide-react
import { logoutAction } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { useSidebarStore } from "@/lib/stores/use-sidebar-store";

export default function AdminHeader() {
  const [isPending, startTransition] = useTransition();
  const { toggleSidebar } = useSidebarStore();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      
      {/* Lado Izquierdo: Botón de Menú Móvil (y/o Título de la vista) */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Abrir menú"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Lado Derecho: Controles de usuario */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Botón de Notificaciones */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificaciones"
          className="relative text-slate-500"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#038C3E] rounded-full"></span>
        </Button>

        {/* Separador Visual */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* Info del Perfil */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#067335] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            AD
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
              Admin Megalider
              <ShieldCheck className="w-3.5 h-3.5 text-[#038C3E]" />
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Superadministrador
            </div>
          </div>
        </div>

        {/* Botón Cerrar Sesión */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          isLoading={isPending}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4" />
        </Button>

      </div>
    </header>
  );
}