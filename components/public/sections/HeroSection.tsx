import React from "react";
import Image from "next/image";
import { Navigation, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

const googleMapsUrl =
  "https://www.google.com/maps/search/?api=1&query=Cl.+86+%2395F-72,+Ciudad+Bachue+I+Etapa,+Engativa,+Bogota";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#067335] via-[#038C3E] to-[#044c23] animate-gradient" />

      {/* Decorative blurred glow orbs */}
      <div className="absolute top-20 right-10 w-[500px] h-[500px] rounded-full bg-[#A7D9BD]/20 blur-[120px] animate-float" />
      <div className="absolute bottom-20 left-10 w-[400px] h-[400px] rounded-full bg-[#53A677]/25 blur-[100px] animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#A7D9BD]/10 blur-[150px] animate-float-slow" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Text and CTAs */}
          <div className="order-2 lg:order-1">
            
            {/* Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8">
              <Star className="w-4 h-4 text-[#A7D9BD] fill-[#A7D9BD]" />
              <span className="text-sm font-medium text-white tracking-wide">
                Ubicados en Ciudad Bachué, Engativá
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up animate-delay-100 font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-6">
              Tu cigarrería de{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-[#A7D9BD] via-[#F2F2F2] to-[#A7D9BD]">
                  confianza
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-[#A7D9BD]/30 rounded-full blur-sm" />
              </span>
              , <br className="hidden sm:inline" />
              ahora más cerca en Engativá
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up animate-delay-200 text-[#F2F2F2]/90 text-base sm:text-lg leading-relaxed mb-10 max-w-xl">
              Descubre nuestra selección premium de licores, snacks y
              productos de necesidad con el servicio rápido y cercano que tu
              barrio merece.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row gap-4">
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Navigation className="w-5 h-5 fill-white rotate-45" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="px-8 py-4 text-base shadow-2xl rounded-2xl w-full sm:w-auto"
                >
                  Cómo Llegar
                </Button>
              </a>
            </div>
          </div>

          {/* Visual/Image Column (Missing in original) */}
          <div className="order-1 lg:order-2 relative w-full aspect-square max-w-[500px] mx-auto animate-fade-in-up animate-delay-200">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#A7D9BD]/20 to-transparent rounded-3xl transform rotate-3 scale-105" />
            <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-black/10 backdrop-blur-sm flex items-center justify-center group">
              {/* Imagen de productos del Hero */}
              <Image 
                src="/images/productos_hero.webp" 
                alt="Variedad de productos, licores y snacks en Cigarrería Megalider" 
                fill 
                sizes="(max-width: 1024px) 100vw, 500px"
                className="object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
                priority
              />
              
              {/* Floating Info Card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-[#067335] rounded-full flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Abierto todos los días</p>
                  <p className="text-[#A7D9BD] text-xs">Atención rápida y segura</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          className="w-full h-auto drop-shadow-sm"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,60 L1440,120 L0,120 Z"
            fill="#F2F2F2"
          />
        </svg>
      </div>
    </section>
  );
}