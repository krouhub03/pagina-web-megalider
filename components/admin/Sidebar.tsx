"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSidebarStore } from "@/lib/stores/use-sidebar-store";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Users,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ScanLine,
  ClipboardCheck,
  PackageSearch,
  Scale,
  Layers,
  X
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const topNavItem: NavItem = {
  name: "Dashboard General",
  href: "/dashboard",
  icon: LayoutDashboard,
};

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "IA & Facturas",
    items: [
      { name: "Escanear Factura", href: "/facturas/scan", icon: ScanLine },
      { name: "Auditoría Pendiente", href: "/facturas/audit", icon: ClipboardCheck },
      { name: "Historial de Facturas", href: "/facturas/history", icon: Receipt },
    ],
  },
  {
    title: "Contabilidad",
    items: [
      { name: "Libro Diario", href: "/contabilidad/libro-diario", icon: BookOpen },
      { name: "Balance Comprobación", href: "/contabilidad/balance", icon: Scale },
      { name: "Cuentas PUC", href: "/contabilidad/puc", icon: Layers },
      { name: "Tipos de Operación", href: "/contabilidad/tipos-operacion", icon: Receipt },
      { name: "Cuentas de Tesorería", href: "/contabilidad/tesoreria", icon: Wallet },
      { name: "Retenciones RteFte", href: "/contabilidad/retenciones", icon: ClipboardCheck },
    ],
  },
  {
    title: "Tienda y Web",
    items: [
      { name: "Catálogo", href: "/catalogo", icon: PackageSearch },
      { name: "Usuarios y Roles", href: "/usuarios", icon: Users },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebarStore();

  const isTopActive =
    pathname === topNavItem.href || pathname.startsWith(topNavItem.href);

  // Cierra el sidebar automáticamente al navegar a otra ruta en móviles
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  return (
    <>
      {/* Overlay oscuro para la versión móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden transition-opacity backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar principal */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#044a23] text-white flex flex-col justify-between shrink-0 shadow-xl border-r border-[#067335]/40 min-h-screen transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="overflow-y-auto">
          {/* Brand Header */}
          <div className="p-5 border-b border-[#067335]/60 flex items-center justify-between gap-3 sticky top-0 bg-[#044a23] z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20">
                <Image
                  src="/logo_megalider.webp"
                  alt="Megalider Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="font-serif font-bold text-lg text-white tracking-wide leading-tight">
                  MEGALIDER
                </h1>
                <p className="text-[11px] text-[#A7D9BD] font-sans font-medium">
                  Panel Administrativo
                </p>
              </div>
            </div>
            
            {/* Botón de cierre para móviles */}
            <button 
              onClick={closeSidebar} 
              className="md:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-4 mt-2">
            <div>
              <Link
                href={topNavItem.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isTopActive
                    ? "bg-[#038C3E] text-white shadow-md shadow-[#038C3E]/30 font-semibold"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <topNavItem.icon
                    className={`w-4 h-4 ${
                      isTopActive ? "text-[#A7D9BD]" : "text-white/70"
                    }`}
                  />
                  <span>{topNavItem.name}</span>
                </div>
                {isTopActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#A7D9BD]" />
                )}
              </Link>
            </div>

            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#A7D9BD]/80 tracking-wider">
                  {section.title}
                </div>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-[#038C3E] text-white shadow-md shadow-[#038C3E]/30 font-semibold"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-[#A7D9BD]" : "text-white/70"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>

                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#53A677]/40 text-[#A7D9BD] border border-[#53A677]/60">
                          {item.badge}
                        </span>
                      )}

                      {isActive && !item.badge && (
                        <ChevronRight className="w-3.5 h-3.5 text-[#A7D9BD]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer link */}
        <div className="p-4 border-t border-[#067335]/60 bg-[#033619]/60 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between text-xs text-[#A7D9BD] hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Ver Landing
            </span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/10">En vivo</span>
          </Link>
        </div>
      </aside>
    </>
  );
}