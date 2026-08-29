"use client";

import React from "react";
import { X, ShieldCheck, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PoliciesModal({ isOpen, onClose }: PoliciesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#067335]/10 flex items-center justify-center text-[#067335]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900">
                Términos, Condiciones y Política de Privacidad
              </h2>
              <p className="text-xs text-slate-500">
                Cigarrería Megalider — Ley 1581 de 2012 (Colombia)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed font-sans">
          <div className="p-3.5 rounded-2xl bg-[#A7D9BD]/15 border border-[#53A677]/20 flex items-start gap-3 text-slate-700">
            <FileText className="w-4 h-4 text-[#067335] shrink-0 mt-0.5" />
            <p>
              Al registrarte en el portal de <strong>Cigarrería Megalider</strong>, autorizas el tratamiento de tus datos personales conforme a las siguientes disposiciones legales y de seguridad.
            </p>
          </div>

          <section className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#038C3E]" /> 1. Tratamiento de Datos Personales
            </h3>
            <p>
              En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> y el Decreto 1377 de 2013 de la República de Colombia, los datos recolectados (nombre, correo electrónico y credenciales) serán utilizados exclusivamente para la gestión de cuentas de cliente, compras, despachos en Engativá y notificaciones sobre el estado de tus pedidos.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Confidencialidad y Seguridad
            </h3>
            <p>
              Cigarrería Megalider se compromete a no compartir, ceder ni comercializar tu información personal con terceros. Todas las contraseñas son cifradas con algoritmos irreversibles (Bcrypt) y las sesiones se encuentran protegidas mediante tokens JWT en cookies con cifrado seguro.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Derechos del Titular (Habeas Data)
            </h3>
            <p>
              Como titular de la información, tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos en cualquier momento comunicándote directamente a través de nuestros canales de atención oficiales o en nuestro establecimiento físico en Bogotá D.C.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Uso Aceptable de la Plataforma
            </h3>
            <p>
              El usuario se compromete a suministrar información verídica y a mantener la confidencialidad de sus credenciales de acceso. Queda prohibido cualquier uso indebido o automatizado que atente contra la integridad del sistema.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Entendido y Acepto
          </Button>
        </div>
      </div>
    </div>
  );
}
