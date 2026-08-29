import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Server,
  ArrowLeft,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad | Cigarrería Megalider",
  description:
    "Política de Privacidad y Tratamiento de Datos Personales de Cigarrería Megalider. Conoce cómo protegemos y gestionamos tu información de conformidad con la ley colombiana y las directrices de Google OAuth.",
};

export default function PoliticaPrivacidadPage() {
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
              <ShieldCheck className="w-7 h-7" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#53A677] bg-[#A7D9BD]/20 px-3 py-1 rounded-full">
              Documento Legal Oficial
            </span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#067335] leading-tight mb-3">
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>
          <p className="text-sm text-slate-600">
            <strong>Cigarrería Megalider</strong> — Última actualización: {lastUpdated}
          </p>
        </div>

        {/* Contenido del Documento */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-[#A7D9BD]/40 space-y-10 text-slate-700 leading-relaxed text-sm sm:text-base">
          {/* 1. Introducción e Identificación */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                1
              </span>
              <h2>Identificación del Responsable del Tratamiento</h2>
            </div>
            <p>
              La presente Política de Privacidad regula el tratamiento de datos personales realizado por{" "}
              <strong>Cigarrería Megalider</strong> (en adelante, &quot;Megalider&quot;, &quot;nosotros&quot; o &quot;nuestro&quot;),
              establecimiento de comercio con domicilio en la ciudad de Bogotá D.C., Colombia.
            </p>
            <div className="bg-[#F2F2F2] rounded-2xl p-5 border border-slate-200 text-xs sm:text-sm space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#067335] shrink-0 mt-0.5" />
                <span><strong>Dirección física:</strong> Cl. 86 #95F-72, Ciudad Bachué I Etapa, Engativá, Bogotá, Colombia.</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#067335] shrink-0 mt-0.5" />
                <span><strong>Horario de atención:</strong> Lunes a Domingo de 11:00 AM a 11:00 PM.</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-[#067335] shrink-0 mt-0.5" />
                <span><strong>Contacto de Privacidad y Soporte:</strong> soporte@megalider.com / contacto directo en punto de venta.</span>
              </div>
            </div>
            <p>
              Nos comprometemos a salvaguardar la privacidad de nuestros clientes, visitantes y personal autorizado,
              en estricto cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> de la República de Colombia,
              el Decreto 1377 de 2013 y los estándares internacionales aplicables en materia de protección de datos personales.
            </p>
          </section>

          {/* 2. Información que recopilamos */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                2
              </span>
              <h2>Información que Recopilamos</h2>
            </div>
            <p>
              Recopilamos únicamente los datos necesarios para brindar acceso seguro a nuestra plataforma, gestionar el catálogo de productos y administrar la operación comercial:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>Datos de Registro Directo:</strong> Nombre, apellidos, dirección de correo electrónico, rol en el sistema y contraseña cifrada mediante algoritmos criptográficos robustos (bcrypt).
              </li>
              <li>
                <strong>Datos Técnicos y de Navegación:</strong> Dirección IP anonimizada, tipo de navegador, identificadores de sesión, cookies técnicas esenciales para mantener la sesión activa de forma segura.
              </li>
            </ul>
          </section>

          {/* 3. Tratamiento Específico de Datos de Google OAuth */}
          <section className="space-y-4 bg-emerald-50/50 rounded-2xl p-6 sm:p-8 border border-[#53A677]/30">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335] text-white text-xs flex items-center justify-center font-sans font-bold">
                3
              </span>
              <h2>Integración con Google OAuth y Datos de Usuario de Google</h2>
            </div>
            <p>
              Nuestra aplicación permite el inicio de sesión y autenticación a través del servicio de terceros{" "}
              <strong>Google OAuth 2.0 (Google Sign-In)</strong>.
            </p>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#067335] text-base">
                A. Permisos y Datos Solicitados (Scopes):
              </h3>
              <p>
                Al autorizar el acceso mediante Google, solicitamos exclusivamente los siguientes alcances mínimos requeridos:
              </p>
              <div className="grid sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <span className="font-mono font-bold text-[#067335] block">openid</span>
                  <span className="text-slate-600">Verificación e identificación criptográfica de tu cuenta Google.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <span className="font-mono font-bold text-[#067335] block">email</span>
                  <span className="text-slate-600">Acceso a tu dirección de correo electrónico principal asociada.</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <span className="font-mono font-bold text-[#067335] block">profile</span>
                  <span className="text-slate-600">Acceso a tu nombre completo y fotografía de perfil pública.</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-[#067335] text-base">
                B. Finalidad Exclusiva de los Datos de Google:
              </h3>
              <p>
                Los datos obtenidos a través de Google OAuth se utilizan <strong>única y exclusivamente</strong> para:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
                <li>Autenticar de manera segura tu identidad en el portal de Cigarrería Megalider.</li>
                <li>Verificar y asociar tus credenciales con tu perfil y rol asignado en la plataforma (RBAC: Cliente, Cajero, Administrador o Superadministrador).</li>
                <li>Visualizar tu nombre y avatar en el encabezado de la sesión mientras navegas por la plataforma.</li>
              </ul>
            </div>

            {/* Cláusula Google API Limited Use */}
            <div className="mt-4 p-4 rounded-xl bg-white border border-[#067335]/30 text-xs sm:text-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#067335]">
                <Lock className="w-4 h-4 text-[#038C3E]" />
                <span>Declaración de Cumplimiento de Google API Services User Data Policy</span>
              </div>
              <p className="text-slate-700">
                El uso y la transferencia por parte de Cigarrería Megalider a cualquier otra aplicación de la información recibida a través de las APIs de Google se adherirán estrictamente a la{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#038C3E] font-semibold underline inline-flex items-center gap-1"
                >
                  Política de Datos de Usuario de los Servicios de API de Google
                  <ExternalLink className="w-3 h-3" />
                </a>
                , incluidos los requisitos de <strong>Uso Limitado (Limited Use Requirements)</strong>.
              </p>
            </div>
          </section>

          {/* 4. No venta ni transferencia a terceros */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                4
              </span>
              <h2>Divulgación, Transferencia y No Venta de Datos</h2>
            </div>
            <p>
              En Cigarrería Megalider mantenemos una estricta política de protección de datos:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong>NO vendemos, alquilamos ni comercializamos</strong> datos personales de los usuarios ni información obtenida mediante Google a ninguna empresa, anunciante o tercero bajo ninguna circunstancia.
              </li>
              <li>
                <strong>NO utilizamos</strong> la información obtenida a través de Google Workspace o cuentas personales de Google para fines publicitarios, retargeting ni entrenamiento de modelos de inteligencia artificial de terceros.
              </li>
              <li>
                La información solo se procesa de forma interna en nuestros servidores e infraestructura técnica para garantizar el funcionamiento seguro del servicio.
              </li>
            </ul>
          </section>

          {/* 5. Almacenamiento, Seguridad y Retención */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                5
              </span>
              <h2>Almacenamiento, Seguridad y Retención de la Información</h2>
            </div>
            <p>
              Implementamos rigurosas medidas de seguridad técnicas, físicas y administrativas para salvaguardar tu información:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-[#F2F2F2] border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#067335] text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Cifrado y Cookies HttpOnly</span>
                </div>
                <p className="text-xs text-slate-600">
                  Las sesiones se autentican mediante tokens firmados (JWT) transmitidos a través de canales seguros TLS/HTTPS y cookies con flags `HttpOnly` y `SameSite`.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#F2F2F2] border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-[#067335] text-sm">
                  <Server className="w-4 h-4" />
                  <span>Control de Acceso Basado en Roles (RBAC)</span>
                </div>
                <p className="text-xs text-slate-600">
                  El acceso a información sensible o módulos administrativos está restringido estrictamente según los privilegios autorizados.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              <strong>Periodo de Retención:</strong> Los datos se conservan únicamente mientras la cuenta de usuario permanezca activa en la plataforma o durante el periodo necesario para cumplir con obligaciones legales y fiscales aplicables en Colombia.
            </p>
          </section>

          {/* 6. Derechos del Titular y Eliminación de Datos */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                6
              </span>
              <h2>Derechos del Titular (Habeas Data) y Procedimiento de Eliminación</h2>
            </div>
            <p>
              De conformidad con la Ley 1581 de 2012, tú como titular de los datos personales tienes derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-xs sm:text-sm">
              <li>Conocer, actualizar y rectificar tus datos personales en cualquier momento.</li>
              <li>Solicitar prueba de la autorización otorgada.</li>
              <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
              <li>Revocar la autorización o solicitar la <strong>supresión y eliminación definitiva</strong> de tus datos cuando consideres que no se respetan los principios legales.</li>
            </ul>

            <div className="bg-[#A7D9BD]/20 rounded-2xl p-5 border border-[#53A677]/40 space-y-3">
              <h3 className="font-bold text-[#067335] text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                ¿Cómo solicitar la eliminación de tus datos o revocar el acceso de Google?
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700">
                <li>
                  <strong>Solicitud directa a Megalider:</strong> Puedes enviar una solicitud de eliminación de cuenta y borrado de datos al correo <strong>soporte@megalider.com</strong> o de forma presencial en nuestra sede física. Tu solicitud será tramitada en un plazo máximo de diez (10) días hábiles.
                </li>
                <li>
                  <strong>Revocar permisos de Google en cualquier momento:</strong> Puedes desvincular o revocar los permisos concedidos a Cigarrería Megalider directamente desde la configuración de tu cuenta de Google accediendo al panel oficial:{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#067335] font-bold underline inline-flex items-center gap-1"
                  >
                    myaccount.google.com/permissions
                    <ExternalLink className="w-3 h-3" />
                  </a>.
                </li>
              </ol>
            </div>
          </section>

          {/* 7. Cookies y Tecnologías de Rastreo */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                7
              </span>
              <h2>Uso de Cookies y Tecnologías Similares</h2>
            </div>
            <p>
              Utilizamos cookies técnicas y estrictamente necesarias para el funcionamiento del sitio web (tales como verificación de tokens de seguridad `oauth_state` contra ataques CSRF y persistencia de sesión). No empleamos cookies de rastreo invasivo de terceros para venta de publicidad comportamental.
            </p>
          </section>

          {/* 8. Modificaciones a la Política */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#067335] font-serif font-bold text-xl">
              <span className="w-7 h-7 rounded-full bg-[#067335]/10 text-[#067335] text-xs flex items-center justify-center font-sans font-bold">
                8
              </span>
              <h2>Modificaciones a la Presente Política</h2>
            </div>
            <p>
              Cigarrería Megalider se reserva el derecho de actualizar o modificar esta Política de Privacidad en cualquier momento para reflejar cambios legales, regulatorios o mejoras en nuestros servicios técnicos. Cualquier cambio significativo será publicado en esta misma página con la fecha de última actualización visible.
            </p>
          </section>

          {/* 9. Contacto */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="font-serif font-bold text-lg text-[#067335]">
              Canal de Consultas y Reclamos
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Si tienes preguntas, dudas o inquietudes sobre el tratamiento de tus datos personales o deseas ejercer tus derechos de Habeas Data, puedes comunicarte con nuestro equipo en:
            </p>
            <p className="text-xs sm:text-sm text-slate-800 font-semibold">
              Cigarrería Megalider — Atención de Privacidad <br />
              Dirección: Cl. 86 #95F-72, Ciudad Bachué I Etapa, Engativá, Bogotá, Colombia. <br />
              Correo Electrónico: soporte@megalider.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
