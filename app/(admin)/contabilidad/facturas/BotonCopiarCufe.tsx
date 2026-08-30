"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface BotonCopiarCufeProps {
  cufe: string;
  className?: string;
}

export function BotonCopiarCufe({ cufe, className = "" }: BotonCopiarCufeProps) {
  const [copiado, setCopiado] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(cufe);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error("Error al copiar CUFE:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      title={copiado ? "¡CUFE Copiado!" : "Copiar CUFE"}
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${
        copiado
          ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
          : "bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-100"
      } ${className}`}
    >
      {copiado ? (
        <>
          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>¡Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate max-w-[100px] font-mono">CUFE</span>
        </>
      )}
    </button>
  );
}
