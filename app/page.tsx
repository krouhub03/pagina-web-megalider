import React from "react";
import {
  Car,
  Bike,
  Navigation,
  ShieldCheck,
  Clock,
  Wine,
  Cookie,
  ShoppingBag,
  PlusSquare,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const googleMapsUrl =
    "https://www.google.com/maps/search/?api=1&query=Cl.+86+%2395F-72,+Ciudad+Bachue+I+Etapa,+Engativa,+Bogota";

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] text-[#1a2e26]">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e5ebe7] transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0d4f3e] text-white flex items-center justify-center shadow-sm border border-[#166953]">
              <span className="font-serif font-bold text-lg tracking-wider">M</span>
            </div>
            <span className="font-serif font-bold text-xl sm:text-2xl text-[#0d4f3e] tracking-tight">
              Cigarrería Megalider
            </span>
          </div>

          {/* Action Button */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#42b596] hover:bg-[#349e81] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 hover:shadow active:scale-95"
          >
            <Car className="w-4 h-4 stroke-[2.5]" />
            <span>Cómo Llegar</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-28 lg:py-24 border-b border-[#e9efe9]">
          {/* Background image & gradient overlay */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1600&auto=format&fit=crop')`,
            }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#f8faf8] via-[#f8faf8]/90 to-[#f8faf8]/60" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e3f4ee] border border-[#bfe7db] text-[#147055] text-xs font-semibold mb-6 shadow-sm">
                <Bike className="w-4 h-4" />
                <span>Engativá Local Delivery</span>
              </div>

              {/* Headline */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0c3c2f] leading-[1.2] tracking-tight mb-4">
                Tu cigarrería de confianza, <br className="hidden sm:inline" />
                ahora más cerca en Engativá
              </h1>

              {/* Subtitle */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
                Descubre nuestra selección premium de licores, snacks y productos de
                necesidad con el servicio rápido y cercano que tu barrio merece.
              </p>

              {/* CTA Button */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#094737] hover:bg-[#07362a] text-white px-6 py-3.5 rounded-lg text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                <Navigation className="w-4 h-4 fill-white rotate-45" />
                <span>Cómo Llegar</span>
              </a>
            </div>
          </div>
        </section>

        {/* Floating Quick Info Card */}
        <section className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 -mt-12 mb-16 sm:mb-20">
          <div className="bg-white rounded-2xl border border-[#e2eae4] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center divide-y md:divide-y-0 md:divide-x divide-[#e8efe9]">
            {/* Value Prop */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#094737] text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6 text-[#42b596]" />
              </div>
              <div>
                <h3 className="font-bold text-[#0c3c2f] text-sm sm:text-base">
                  Confianza y Rapidez en Engativá
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Productos garantizados y atención inmediata.
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-8">
              <div className="w-10 h-10 rounded-full bg-[#edf6f2] text-[#147055] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-700 block">
                  Horario de Atención
                </span>
                <span className="text-xs sm:text-sm text-slate-600 font-medium">
                  Lunes a Domingo: 11:00 AM - 11:00 PM
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Categorías Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 sm:mb-24">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0c3c2f]">
              Nuestras Categorías
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl border border-[#e2eae4] p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="w-16 h-16 rounded-2xl bg-[#eaf6f2] text-[#1b7f64] flex items-center justify-center mb-5">
                <Wine className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="font-serif font-bold text-[#0c3c2f] text-lg mb-2">
                Licores y Cervezas
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Amplia variedad nacional e importada.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl border border-[#e2eae4] p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="w-16 h-16 rounded-2xl bg-[#eaf6f2] text-[#1b7f64] flex items-center justify-center mb-5">
                <Cookie className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="font-serif font-bold text-[#0c3c2f] text-lg mb-2">
                Snacks y Cigarrillos
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Tus antojos favoritos siempre listos.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl border border-[#e2eae4] p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="w-16 h-16 rounded-2xl bg-[#eaf6f2] text-[#1b7f64] flex items-center justify-center mb-5">
                <ShoppingBag className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="font-serif font-bold text-[#0c3c2f] text-lg mb-2">
                Artículos de Necesidad
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Lo esencial para tu día a día.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl border border-[#e2eae4] p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
              <div className="w-16 h-16 rounded-2xl bg-[#eaf6f2] text-[#1b7f64] flex items-center justify-center mb-5">
                <PlusSquare className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="font-serif font-bold text-[#0c3c2f] text-lg mb-2">
                Medicamentos Básicos
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Botiquín de primeros auxilios y más.
              </p>
            </div>
          </div>
        </section>

        {/* Encuéntranos en Engativá Section */}
        <section id="ubicacion" className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 sm:mb-24">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0c3c2f] mb-6">
            Encuéntranos en Engativá
          </h2>

          <div className="bg-white rounded-2xl border border-[#e2eae4] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Map Column */}
            <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[360px] bg-[#eef4f0] overflow-hidden">
              <iframe
                title="Ubicación Cigarrería Megalider"
                src="https://maps.google.com/maps?q=Cl.+86+%2395F-72,+Ciudad+Bachue+I+Etapa,+Engativa,+Bogota&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full min-h-[300px] border-0"
                loading="lazy"
                allowFullScreen
              />
              
              {/* Badge overlay on map */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center gap-2 pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs font-semibold text-slate-800">
                  Cigarrería Megalider - Abierto
                </span>
              </div>
            </div>

            {/* Info Column */}
            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-center bg-white">
              <div className="flex items-center gap-2.5 text-[#147055] mb-3">
                <MapPin className="w-6 h-6 shrink-0" />
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#0c3c2f]">
                  Visítanos
                </h3>
              </div>

              <div className="space-y-1 mb-8 pl-1">
                <p className="font-bold text-slate-900 text-base sm:text-lg">
                  Cl. 86 #95F-72
                </p>
                <p className="text-slate-600 text-sm">
                  Ciudad Bachué I Etapa, Engativá
                </p>
                <p className="text-slate-600 text-sm">Bogotá, Colombia</p>
              </div>

              <div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#42b596] text-[#0f674e] hover:bg-[#42b596] hover:text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver en Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#eaefe9] border-t border-[#d8e2d8] py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2">
          {/* Policy Links */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <a href="#" className="hover:text-[#0c3c2f] hover:underline transition-colors">
              Términos y Condiciones
            </a>
            <span>•</span>
            <a href="#" className="hover:text-[#0c3c2f] hover:underline transition-colors">
              Política de Privacidad
            </a>
          </div>

          {/* Legal disclaimer */}
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xl">
            © 2024 Cigarrería Megalider. Prohíbase el expendio de bebidas embriagantes
            a menores de edad.
          </p>
        </div>
      </footer>
    </div>
  );
}
