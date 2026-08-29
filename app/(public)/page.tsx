import React from "react";
import HeroSection from "@/components/public/sections/HeroSection";
import TrustBarSection from "@/components/public/sections/TrustBarSection";
import CategoriesSection from "@/components/public/sections/CategoriesSection";
import LocationSection from "@/components/public/sections/LocationSection";

export default function PublicLandingPage() {
  return (
    <>
      {/* 1. Hero Section con llamadas a la acción principales */}
      <HeroSection />

      {/* 2. Barra de confianza y horarios de atención */}
      <TrustBarSection />

      {/* 3. Catálogo de las 4 Categorías Oficiales */}
      <CategoriesSection />

      {/* 4. Ubicación y mapa interactivo en Engativá */}
      <LocationSection />
    </>
  );
}
