import React from "react";
import { MapPin, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const googleMapsUrl =
  "https://www.google.com/maps/search/?api=1&query=Cl.+86+%2395F-72,+Ciudad+Bachue+I+Etapa,+Engativa,+Bogota";

export default function LocationSection() {
  return (
    <section
      id="ubicacion"
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F2F2F2] via-[#A7D9BD]/15 to-[#F2F2F2]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#067335]">
            Encuéntranos en Engativá
          </h2>
        </div>

        {/* Map Card */}
        <div className="bg-white rounded-3xl border border-[#A7D9BD]/40 shadow-xl shadow-[#067335]/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Map Iframe */}
          <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[400px] bg-[#A7D9BD]/20 overflow-hidden">
            <iframe
              title="Ubicación Cigarrería Megalider"
              src="https://maps.google.com/maps?q=Cl.+86+%2395F-72,+Ciudad+Bachue+I+Etapa,+Engativa,+Bogota&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full min-h-[320px] border-0"
              loading="lazy"
              allowFullScreen
            />

            {/* Status badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#A7D9BD]/50 shadow-lg flex items-center gap-2.5 pointer-events-none">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-[#038C3E]" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#53A677] animate-ping" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Cigarrería Megalider — Abierto ahora
              </span>
            </div>
          </div>

          {/* Info Card */}
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center bg-white relative">
            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#A7D9BD]/20 to-transparent rounded-bl-full" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#067335] to-[#038C3E] flex items-center justify-center shadow-lg shadow-[#067335]/20">
                  <MapPin className="w-6 h-6 text-[#A7D9BD]" />
                </div>
                <h3 className="font-serif font-bold text-2xl sm:text-3xl text-[#067335]">
                  Visítanos
                </h3>
              </div>

              <div className="space-y-2 mb-8 pl-1">
                <p className="font-bold text-slate-900 text-lg sm:text-xl">
                  Cl. 86 #95F-72
                </p>
                <p className="text-slate-500 text-sm sm:text-base">
                  Ciudad Bachué I Etapa, Engativá
                </p>
                <p className="text-slate-500 text-sm sm:text-base">
                  Bogotá, Colombia
                </p>
              </div>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="rounded-2xl px-7 py-3.5 text-sm"
                >
                  Ver en Google Maps
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
