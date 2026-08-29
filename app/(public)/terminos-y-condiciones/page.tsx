import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  FileCheck2,
  AlertTriangle,
  ArrowLeft,
  Building,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso | Cigarrería Megalider",
  description:
    "Términos y condiciones de uso del sitio web, catálogo digital y plataforma de Cigarrería Megalider. Regulación de uso, restricciones legales y condiciones del servicio.",
};

export default function TerminosCondicionesPage() {
  const lastUpdated = "29 de agosto de 2026";

  return (
    <div className="bg-[#F2F2F2] min-h-screen py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegación de retorno */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#067335] hover:text-[#038C3E] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio
          </Link>
        </div>

        {/* Encabezado Principal */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#A7D9BD]/40 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 rounded-2xl bg-[#067335]/10 text-[#067335]">
              <FileCheck2 className="w-7 h-7" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#53A677] bg-[#A7D9BD]/20 px-3 py-1 rounded-full">
              Términos del Servicio
            </span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#067335] leading-tight mb-3">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-sm text-slate-600">
            <strong>Cigarrería Megalider</strong> — Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Contenido del Documento */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#A7D9BD]/40 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
          {/* 1. Información General y Aceptación */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                1
              </span>
              <h2>Aceptación de los Términos</h2>
            </div>
            <p>
              Bienvenido al sitio web y plataforma digital de <strong>Cigarrería Megalider</strong> (en adelante, &quot;Megalider&quot;).
              Al acceder, navegar, consultar el catálogo o utilizar los servicios de autenticación y gestión de nuestro sitio web,
              el usuario acepta expresamente y sin reservas quedar vinculado por los presentes Términos y Condiciones.
            </p>
            <p>
              Si no estás de acuerdo con alguna de las disposiciones aquí establecidas, te solicitamos abstenerte de utilizar esta plataforma.
            </p>
          </section>

          {/* 2. Identificación del Titular */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                2
              </span>
              <h2>Identificación del Establecimiento</h2>
            </div>
            <div className="p-4 rounded-2xl bg-[#F2F2F2] border border-slate-200 text-xs sm:text-sm space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Building className="w-4 h-4 text-[#067335]" />
                <span>Cigarrería Megalider</span>
              </div>
              <p className="text-slate-600">
                <strong>Ubicación:</strong> Cl. 86 #95F-72, Ciudad Bachué I Etapa, Engativá, Bogotá, Colombia.
              </p>
              <p className="text-slate-600">
                <strong>Horario Comercial:</strong> Lunes a Domingo de 11:00 AM a 11:00 PM.
              </p>
              <p className="text-slate-600">
                <strong>Correo de Contacto:</strong> soporte@megalider.com
              </p>
            </div>
          </section>

          {/* 3. Restricciones Legales: Bebidas Alcohólicas y Tabaco (+18) */}
          <section className="space-y-4 bg-amber-50/60 rounded-2xl p-6 sm:p-8 border border-amber-300/60">
            <div className="flex items-center gap-2 text-amber-900 font-serif font-bold text-xl">
              <span className="p-1.5 rounded-lg bg-amber-500 text-white">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h2>Restricción Legal de Edad y Normativa Sanitaria (Colombia)</h2>
            </div>
            <p className="text-amber-950 font-medium">
              Cigarrería Megalider cumple estrictamente con el marco legal colombiano referente a la comercialización de bebidas embriagantes y productos derivados del tabaco:
            </p>
            <div className="space-y-2.5 text-xs sm:text-sm text-amber-900">
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200 space-y-1">
                <p className="font-bold text-amber-900">
                  🚫 Prohibición de Venta a Menores de Edad (+18):
                </p>
                <p className="text-slate-700">
                  De conformidad con la <strong>Ley 124 de 1994</strong> y la <strong>Ley 1335 de 2009</strong>, está rotundamente prohibida la venta y suministro de bebidas alcohólicas y productos de tabaco o sus derivados a menores de dieciocho (18) años. El usuario declara y garantiza ser mayor de edad para acceder a información y adquirir estos productos.
                </p>
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-amber-200 space-y-1">
                <p className="font-bold text-amber-900">
                  ⚠️ Advertencias Sanitarias Legales:
                </p>
                <p className="text-slate-700">
                  • <em>&quot;El exceso de alcohol es perjudicial para la salud&quot;</em> (Ley 30 de 1986). <br />
                  • <em>&quot;El tabaco es nocivo para la salud y causa adicción&quot;</em> (Ley 1335 de 2009).
                </p>
              </div>
            </div>
          </section>

          {/* 4. Descripción del Servicio y Catálogo */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                4
              </span>
              <h2>Descripción de la Plataforma y Catálogo de Productos</h2>
            </div>
            <p>
              La plataforma web de Megalider ofrece:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Catálogo Digital Informativo:</strong> Exhibición de productos organizados en las 4 categorías oficiales:
                <em> Licores y Cervezas</em>, <em>Snacks y Cigarrillos</em>, <em>Artículos de Necesidad (Abarrotes empacados)</em> y <em>Medicamentos Básicos de venta libre</em>.
              </li>
              <li>
                <strong>Portal de Acceso y Gestión:</strong> Módulo de autenticación seguro para clientes y personal administrativo autorizado (gestión de catálogo, facturas y operaciones).
              </li>
            </ul>
            <p className="text-xs text-slate-500">
              * Las fotografías, descripciones y precios exhibidos en el catálogo digital son de carácter orientativo y están sujetos a disponibilidad de inventario en el punto de venta físico.
            </p>
          </section>

          {/* 5. Cuentas de Usuario y Autenticación (Google OAuth y Credenciales) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                5
              </span>
              <h2>Cuentas de Usuario, Seguridad y Autenticación con Google</h2>
            </div>
            <p>
              Para acceder a funcionalidades avanzadas o al portal de gestión, los usuarios pueden identificarse mediante credenciales directas o a través de <strong>Google OAuth</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
              <li>El usuario es el único responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas bajo su cuenta.</li>
              <li>El usuario se compromete a notificar inmediatamente a Megalider cualquier uso no autorizado de su sesión o brecha de seguridad.</li>
              <li>Cigarrería Megalider se reserva el derecho de suspender o revocar el acceso a cualquier cuenta que incumpla estos términos, realice actividades fraudulentas o atente contra la seguridad del sistema.</li>
            </ul>
          </section>

          {/* 6. Uso Aceptable y Prohibiciones */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                6
              </span>
              <h2>Uso Aceptable y Restricciones</h2>
            </div>
            <p>
              Queda expresamente prohibido al usuario:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-[#F2F2F2] border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">✖ Extracción No Autorizada (Scraping)</span>
                <span>Usar robots, arañas web o scripts automáticos para copiar catálogo o bases de datos sin autorización previa por escrito.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F2F2F2] border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">✖ Ataques de Seguridad</span>
                <span>Intentar vulnerar la autenticación, realizar inyecciones de código, saturar servidores o ejecutar ataques DoS/DDoS.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F2F2F2] border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">✖ Suplantación de Identidad</span>
                <span>Hacerse pasar por otra persona, falsificar correos o utilizar cuentas ajenas de Google sin autorización del titular.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F2F2F2] border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">✖ Uso Ilegal</span>
                <span>Cualquier actividad que contravenga las leyes de la República de Colombia o el orden público.</span>
              </div>
            </div>
          </section>

          {/* 7. Propiedad Intelectual */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                7
              </span>
              <h2>Propiedad Intelectual</h2>
            </div>
            <p>
              Todos los contenidos de esta plataforma (incluyendo el logotipo oficial de Cigarrería Megalider, nombres comerciales, textos, diseños, interfaz de usuario, código fuente y elementos gráficos) son propiedad exclusiva de Cigarrería Megalider o se encuentran debidamente licenciados. Se prohíbe su reproducción, distribución o modificación total o parcial sin consentimiento previo y por escrito.
            </p>
            <p className="text-xs text-slate-500">
              Las marcas comerciales, logotipos y nombres de productos de terceros (tales como marcas de licores, snacks, bebidas o el logotipo de Google) pertenecen a sus respectivos propietarios y se utilizan únicamente con fines informativos y de identificación comercial.
            </p>
          </section>

          {/* 8. Limitación de Responsabilidad */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                8
              </span>
              <h2>Limitación de Responsabilidad y Disponibilidad</h2>
            </div>
            <p>
              Megalider realiza sus mejores esfuerzos técnicos para garantizar la operatividad y disponibilidad ininterrumpida de la plataforma. No obstante, no nos hacemos responsables por caídas temporales del servicio debidas a fallas en proveedores de internet, mantenimiento programado, cortes de energía o eventos de fuerza mayor.
            </p>
          </section>

          {/* 9. Ley Aplicable y Jurisdicción */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                9
              </span>
              <h2>Legislación Aplicable y Jurisdicción</h2>
            </div>
            <p>
              Estos Términos y Condiciones se rigen e interpretan de acuerdo con las leyes de la <strong>República de Colombia</strong>, en particular por el Estatuto del Consumidor (Ley 1480 de 2011) y las normas de comercio electrónico (Ley 527 de 1999). Cualquier controversia que no pueda resolverse de mutuo acuerdo será sometida a los jueces y tribunales competentes de la ciudad de Bogotá D.C., Colombia.
            </p>
          </section>

          {/* 10. Contacto */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="font-serif font-bold text-lg text-[#067335]">
              Atención y Dudas sobre estos Términos
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Para consultas o aclaraciones respecto a estos términos, puedes contactarnos en:
            </p>
            <p className="text-xs sm:text-sm text-slate-800 font-semibold">
              Cigarrería Megalider <br />
              Dirección: Cl. 86 #95F-72, Ciudad Bachué I Etapa, Engativá, Bogotá, Colombia. <br />
              Correo Electrónico: soporte@megalider.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
