"use client";

import React, { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Lock,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Home,
  ShoppingBag,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { logoutAction } from "@/services/auth.service";
import { useCartStore } from "@/lib/stores/use-cart-store";

const CartDrawer = dynamic(
  () => import("./CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);

const AgeVerificationGate = dynamic(
  () => import("./AgeVerificationGate").then((mod) => mod.AgeVerificationGate),
  { ssr: false }
);

export interface SessionUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  avatarUrl?: string | null;
}

interface PublicNavbarProps {
  session?: SessionUser | null;
}

export default function PublicNavbar({ session }: PublicNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  // Zustand selectores granulares
  const totalItems = useCartStore((state) => state.getTotalItems());
  const toggleCart = useCartStore((state) => state.toggleCart);

  // Roles autorizados para ingresar al Panel Administrativo
  const isStaff = Boolean(
    session && ["SUPERADMIN", "ADMIN"].includes(session.rol)
  );

  // Cerrar menú al cambiar de ruta ajustando estado en render
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Evitar scroll en el body cuando el menú móvil está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const navLinks = [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Catálogo", href: "/#categorias", icon: ShoppingBag },
    { name: "Ubicación y Horarios", href: "/#ubicacion", icon: MapPin },
  ];

  return (
    <>
      {/* ── HEADER PRINCIPAL (Desktop, Tablet & Mobile) ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#A7D9BD]/40 shadow-xs transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#067335] rounded-xl p-1 -ml-1"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white shadow-2xs border border-[#A7D9BD]/40 p-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo_megalider.webp"
                alt="Cigarrería Megalider"
                width={44}
                height={44}
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-sm"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-xl sm:text-2xl lg:text-3xl text-[#067335] leading-tight tracking-tight group-hover:text-[#038C3E] transition-colors">
                MEGALIDER
              </span>
              <span className="text-[8px] sm:text-xs text-slate-500 font-medium tracking-wide -mt-0.5 sm:mt-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#038C3E] inline-block animate-pulse" />
                Despensa & Licores
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on lg+) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-2xs">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#067335] hover:bg-white hover:shadow-2xs transition-all duration-200"
                >
                  <Icon className="w-3.5 h-3.5 text-[#53A677]" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop & Tablet Top Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón Carrito con Badge */}
            <button
              type="button"
              onClick={() => toggleCart()}
              aria-label="Ver Carrito de Compras"
              className="relative p-2 rounded-xl text-slate-700 hover:text-[#067335] hover:bg-slate-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#067335] cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-[#067335]" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-emerald-950 font-bold text-[10px] rounded-full w-4 h-4 flex items-center justify-center border border-white shadow-2xs">
                  {totalItems}
                </span>
              )}
            </button>
            {session ? (
              /* Usuario Autenticado */
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Botón Acceso Panel Admin SOLO para Staff (SUPERADMIN, ADMIN, CAJERO) */}
                {isStaff && (
                  <Link href="/dashboard" className="hidden sm:inline-flex">
                    <Button
                      variant="soft"
                      size="sm"
                      leftIcon={<LayoutDashboard className="w-3.5 h-3.5 text-[#067335]" />}
                      className="text-xs font-semibold"
                    >
                      Panel Admin
                    </Button>
                  </Link>
                )}

                {/* Perfil Mini */}
                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-[#067335] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                    {session.nombre ? session.nombre.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                      {session.nombre?.split(" ")[0]}
                    </p>
                    <span className="text-[10px] text-[#038C3E] font-semibold flex items-center gap-0.5">
                      {isStaff ? (
                        <>
                          <ShieldCheck className="w-2.5 h-2.5 text-[#038C3E]" />
                          {session.rol}
                        </>
                      ) : (
                        <>
                          <User className="w-2.5 h-2.5 text-[#53A677]" />
                          Cliente
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Botón Cerrar Sesión */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isPending}
                  title="Cerrar sesión"
                  leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-600" />}
                  className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300"
                >
                  <span className="hidden sm:inline">Cerrar Sesión</span>
                </Button>
              </div>
            ) : (
              /* Usuario No Autenticado */
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Lock className="w-3.5 h-3.5 text-[#53A677]" />}
                  className="text-xs text-slate-700 hover:text-[#067335] shadow-2xs"
                >
                  <span className="hidden xs:inline">Iniciar Sesión</span>
                  <span className="xs:hidden">Acceder</span>
                </Button>
              </Link>
            )}

            {/* Botón Menú Hamburguesa (Tablet & Mobile) */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-[#067335] hover:bg-slate-100/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#067335]"
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú de navegación"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── DRAWER / MENÚ DESPLEGABLE PARA TABLET & MOBILE ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col animate-fade-in-up duration-200">
          {/* Backdrop con desenfoque */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel Lateral / Desplegable */}
          <div className="relative z-10 w-full sm:max-w-md bg-white h-full max-h-screen overflow-y-auto flex flex-col justify-between ml-auto shadow-2xl border-l border-slate-200/80">
            {/* Cabecera del Menú */}
            <div>
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#F2F2F2]/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-xs p-1 flex items-center justify-center border border-[#A7D9BD]/50">
                    <Image
                      src="/logo_megalider.webp"
                      alt="Megalider"
                      width={36}
                      height={36}
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#067335]">
                      MEGALIDER
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Navegación Móvil & Tablet
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl bg-white text-slate-500 hover:text-slate-900 shadow-2xs border border-slate-200"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Información de Sesión en Móvil (si está autenticado) */}
              {session && (
                <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-[#067335]/5 border border-[#A7D9BD]/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#067335] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {session.nombre ? session.nombre.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {session.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {session.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A7D9BD]/40 text-[#067335] border border-[#53A677]/30">
                    {isStaff ? session.rol : "Cliente"}
                  </span>
                </div>
              )}

              {/* Enlaces de Navegación */}
              <nav className="p-4 space-y-1.5">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Explorar
                </div>

                {navLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-2xl font-medium text-sm text-slate-700 hover:text-[#067335] hover:bg-[#A7D9BD]/15 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-[#A7D9BD]/30 text-slate-600 group-hover:text-[#067335] flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#067335] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}

                {/* Enlace al Panel Admin SOLO para roles autorizados (SUPERADMIN, ADMIN, CAJERO) */}
                {isStaff && (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-2xl font-medium text-sm text-white bg-[#067335] hover:bg-[#038C3E] shadow-sm shadow-[#067335]/30 transition-all mt-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold leading-tight">Panel Administrativo</p>
                        <p className="text-[11px] text-[#A7D9BD]">Gestionar inventario y ventas</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A7D9BD]" />
                  </Link>
                )}
              </nav>

              {/* Información de Horarios y Dirección en el Drawer */}
              <div className="mx-4 mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Clock className="w-4 h-4 text-[#038C3E] shrink-0" />
                  <span>Lun a Dom: 11:00 AM - 11:00 PM</span>
                </div>
                <div className="flex items-start gap-2 text-slate-500 text-[11px]">
                  <MapPin className="w-4 h-4 text-[#53A677] shrink-0 mt-0.5" />
                  <span>Cl. 86 #95F-72, Bachué I Etapa, Engativá, Bogotá</span>
                </div>
              </div>
            </div>

            {/* Acciones Inferiores en el Drawer */}
            <div className="p-4 border-t border-slate-100 bg-[#F2F2F2]/40 space-y-2">
              {session ? (
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  isLoading={isPending}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  className="w-full py-3 rounded-2xl shadow-xs"
                >
                  Cerrar Sesión Activa
                </Button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full"
                >
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<Lock className="w-4 h-4" />}
                    className="w-full py-3 rounded-2xl shadow-md shadow-[#038C3E]/30"
                  >
                    Iniciar Sesión en Megalider
                  </Button>
                </Link>
              )}
              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#53A677]" /> Cigarrería Megalider © {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRA DE NAVEGACIÓN INFERIOR PARA MÓVIL Y TABLET (Bottom Navigation Bar) ── */}
      <nav
        aria-label="Navegación rápida inferior"
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 pb-safe"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 items-center gap-1">
          {/* Inicio */}
          <Link
            href="/"
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 hover:text-[#067335] active:scale-95 transition-all"
          >
            <Home className="w-5 h-5 mb-0.5 text-[#53A677]" />
            <span className="text-[10px] font-semibold tracking-tight">Inicio</span>
          </Link>

          {/* Catálogo */}
          <Link
            href="/#categorias"
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 hover:text-[#067335] active:scale-95 transition-all"
          >
            <ShoppingBag className="w-5 h-5 mb-0.5 text-[#53A677]" />
            <span className="text-[10px] font-semibold tracking-tight">Catálogo</span>
          </Link>

          {/* Ubicación */}
          <Link
            href="/#ubicacion"
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 hover:text-[#067335] active:scale-95 transition-all"
          >
            <MapPin className="w-5 h-5 mb-0.5 text-[#53A677]" />
            <span className="text-[10px] font-semibold tracking-tight">Ubicación</span>
          </Link>

          {/* Acceso / Menú según tipo de usuario */}
          {session ? (
            isStaff ? (
              /* Staff (Admin / Superadmin / Cajero) -> Acceso rápido a Dashboard */
              <Link
                href="/dashboard"
                className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[#067335] hover:bg-[#A7D9BD]/20 active:scale-95 transition-all"
              >
                <div className="relative">
                  <LayoutDashboard className="w-5 h-5 mb-0.5 text-[#038C3E]" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#038C3E] rounded-full ring-2 ring-white" />
                </div>
                <span className="text-[10px] font-bold tracking-tight">Admin</span>
              </Link>
            ) : (
              /* Cliente -> Abre el Drawer para ver su cuenta y cerrar sesión */
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[#067335] hover:bg-[#A7D9BD]/20 active:scale-95 transition-all"
              >
                <div className="w-5 h-5 mb-0.5 rounded-full bg-[#067335] text-white flex items-center justify-center text-[10px] font-bold">
                  {session.nombre ? session.nombre.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-[10px] font-semibold tracking-tight">Cuenta</span>
              </button>
            )
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-slate-600 hover:text-[#067335] active:scale-95 transition-all"
            >
              <Lock className="w-5 h-5 mb-0.5 text-[#53A677]" />
              <span className="text-[10px] font-semibold tracking-tight">Acceso</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Drawer del Carrito */}
      <CartDrawer />

      {/* Gate de Verificación de Edad +18 */}
      <AgeVerificationGate />
    </>
  );
}

