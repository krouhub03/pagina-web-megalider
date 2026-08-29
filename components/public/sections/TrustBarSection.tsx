import React from "react";
import { ShieldCheck, Clock } from "lucide-react";

export default function TrustBarSection() {
  return (
    <section className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 -mt-8 mb-20 sm:mb-28">
      <div className="bg-white rounded-3xl border border-[#A7D9BD]/50 shadow-xl shadow-[#067335]/5 p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
        {/* Value Prop */}
        <div className="flex items-center gap-5 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#067335] to-[#038C3E] text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#067335]/20 group-hover:scale-110 transition-transform duration-300">
            <ShieldCheck className="w-7 h-7 text-[#A7D9BD]" />
          </div>
          <div>
            <h3 className="font-bold text-[#067335] text-base sm:text-lg">
              Confianza y Rapidez en Engativá
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Productos garantizados y atención inmediata.
            </p>
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-5 group">
          <div className="w-14 h-14 rounded-2xl bg-[#A7D9BD]/20 text-[#067335] flex items-center justify-center shrink-0 border border-[#A7D9BD]/50 group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-7 h-7 text-[#038C3E]" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#53A677] block">
              Horario de Atención
            </span>
            <span className="text-sm sm:text-base text-slate-700 font-semibold">
              Lunes a Domingo: 11:00 AM – 11:00 PM
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
