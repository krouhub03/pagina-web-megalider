"use client";

import React, { useEffect } from "react";
import { ShieldAlert, Check, X } from "lucide-react";
import { useAgeVerificationStore } from "@/lib/stores/use-age-verification-store";
import { Button } from "@/components/ui/Button";

export function AgeVerificationGate() {
  const isVerified = useAgeVerificationStore((state) => state.isVerified);
  const verifyAge = useAgeVerificationStore((state) => state.verifyAge);

  // Evitar scroll de fondo mientras no esté verificado
  useEffect(() => {
    if (!isVerified) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isVerified]);

  if (isVerified) return null;

  const handleDeny = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center border border-amber-200 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            Verificación de Edad (+18)
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            El expendio de bebidas embriagantes a menores de edad está prohibido por la Ley 124 de 1994 en Colombia. El exceso de alcohol es perjudicial para la salud.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
          ¿Eres mayor de 18 años para ingresar a Cigarrería Megalider?
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleDeny}
            leftIcon={<X className="w-4 h-4 text-rose-600" />}
            className="text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 border-slate-200"
          >
            No, Soy Menor
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={verifyAge}
            rightIcon={<Check className="w-4 h-4" />}
            className="text-xs shadow-md shadow-[#067335]/30"
          >
            Sí, Soy +18
          </Button>
        </div>
      </div>
    </div>
  );
}
