import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="relative bg-[#067335] text-white/80 overflow-hidden">
      {/* Top decorative wave */}
      <div className="absolute top-0 left-0 right-0 -translate-y-[99%]">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,40 1440,30 L1440,60 L0,60 Z"
            fill="#067335"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col items-center gap-6">
          {/* Logo & Name */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo_megalider.webp"
              alt="Cigarrería Megalider"
              width={40}
              height={40}
              className="w-10 h-10 brightness-0 invert opacity-90 object-contain"
            />
            <span className="font-serif font-bold text-lg text-white/90">
              Cigarrería Megalider
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs font-medium">
            <Link
              href="/login"
              className="hover:text-white transition-colors duration-200"
            >
              Portal Administrativo
            </Link>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <a
              href="#categorias"
              className="hover:text-white transition-colors duration-200"
            >
              Catálogo de Productos
            </a>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <a
              href="#ubicacion"
              className="hover:text-white transition-colors duration-200"
            >
              Ubicación y Horario
            </a>
          </div>

          {/* Divider */}
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#A7D9BD]/40 to-transparent" />


        </div>
      </div>
    </footer>
  );
}
