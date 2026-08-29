import React from "react";
import Image from "next/image";

const categories = [
  {
    title: "Licores y Cervezas",
    description: "Amplia variedad nacional e importada.",
    brands: "Poker · Club Colombia · Aguardiente · Ron",
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=800&auto=format&fit=crop",
    alt: "Licores y cervezas frías",
    badge: "Populares",
  },
  {
    title: "Snacks y Cigarrillos",
    description: "Tus antojos favoritos siempre listos.",
    brands: "Papas Margarita · DeTodito · Chocoramo",
    image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=800&auto=format&fit=crop",
    alt: "Snacks, papitas y chocolates",
    badge: "Antojos",
  },
  {
    title: "Artículos de Necesidad",
    description: "Abarrotes, enlatados, aceites, arroz y despensa.",
    brands: "Arroz · Atún y Enlatados · Aceites · Salsas · Pastas",
    image: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=800&auto=format&fit=crop",
    alt: "Abarrotes enlatados, aceites, pastas y arroz de despensa",
    badge: "Abarrotes",
  },
  {
    title: "Medicamentos Básicos",
    description: "Botiquín de primeros auxilios y más.",
    brands: "Dolex · Noraver · Sal de Frutas · Botiquín",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop",
    alt: "Medicamentos de botiquín",
    badge: "Salud",
  },
];

export default function CategoriesSection() {
  return (
    <section
      id="categorias"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24 sm:mb-32"
    >
      <div className="text-center mb-14">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#067335]">
          Nuestras Categorías
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {categories.map((cat) => (
          <div
            key={cat.title}
            className="group relative bg-white rounded-3xl border border-[#A7D9BD]/40 overflow-hidden shadow-2xs hover:shadow-xl hover:shadow-[#067335]/15 hover:-translate-y-2 transition-all duration-500 flex flex-col"
          >
            {/* Product Image Container */}
            <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-100">
              <Image
                src={cat.image}
                alt={cat.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Badge */}
              <div className="absolute top-3 right-3 bg-[#067335]/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-white/20">
                {cat.badge}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                {/* Title */}
                <h3 className="font-serif font-bold text-[#067335] text-xl mb-2">
                  {cat.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {cat.description}
                </p>
              </div>

              {/* Colombian Brands Highlight */}
              <div className="pt-3 border-t border-[#A7D9BD]/30">
                <span className="text-[11px] font-semibold text-[#53A677] uppercase tracking-wider block mb-1">
                  Marcas y productos:
                </span>
                <p className="text-xs font-medium text-slate-700 leading-snug">
                  {cat.brands}
                </p>
              </div>
            </div>

            {/* Bottom accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#067335] via-[#038C3E] to-[#53A677] opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    </section>
  );
}
