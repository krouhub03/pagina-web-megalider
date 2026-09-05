"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Bot,
  Users,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ScanLine,
  ClipboardCheck,
  PackageSearch
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
      {
        name: "Escanear Factura",
        href: "/facturas/scan",
        icon: ScanLine,
      },
      {
        name: "Auditoría Pendiente",
        href: "/facturas/audit",
        icon: ClipboardCheck,
      },
      {
        name: "Historial de Facturas",
        href: "/facturas/history",
        icon: Receipt,
      },
    ],
  },
  {
    title: "Contabilidad",
    items: [
      {
        name: "Egresos y Gastos",
        href: "/contabilidad/gastos",
        icon: Wallet,
      },
      {
        name: "Cuentas PUC",
        href: "/contabilidad/puc",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Tienda y Web",
    items: [
      {
        name: "Catálogo",
        href: "/catalogo",
        icon: PackageSearch,
      },
      {
        name: "Usuarios y Roles",
        href: "/usuarios",
        icon: Users,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isTopActive =
    pathname === topNavItem.href || pathname.startsWith(topNavItem.href);

  return (
    <aside className="w-64 bg-[#044a23] text-white flex flex-col justify-between shrink-0 shadow-xl border-r border-[#067335]/40 min-h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#067335]/60 flex items-center gap-3">
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
            <h1 className="font-serif font-bold text-lg text-white tracking-wide">
              MEGALIDER
            </h1>
            <p className="text-xs text-[#A7D9BD] font-sans font-medium">
              Panel Administrativo
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-4 mt-2">
          {/* Top Standalone Link: Dashboard General */}
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

          {/* Sectioned Links */}
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#A7D9BD]/80 tracking-wider">
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

      {/* Footer link to public site */}
      <div className="p-4 border-t border-[#067335]/60 bg-[#033619]/60">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between text-xs text-[#A7D9BD] hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver Landing Pública
          </span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">En vivo</span>
        </Link>
      </div>
    </aside>
  );
}
