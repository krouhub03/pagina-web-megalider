import React from "react";
import Link from "next/link";
import { Package, Wine, Cookie, ShoppingBasket, Pill, Search, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export const dynamic = "force-dynamic";

const categoriasOficiales = [
  {
    nombre: "Licores y Cervezas",
    descripcion: "Cervezas nacionales e importadas, aguardiente, ron, whisky y licores.",
    icono: Wine,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    nombre: "Snacks y Cigarrillos",
    descripcion: "Papas, pasabocas empaquetados, chocolates, dulces y cigarrillos.",
    icono: Cookie,
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    nombre: "Artículos de Necesidad (Abarrotes)",
    descripcion: "Abarrotes empacados (arroz, atún/enlatados, aceites, salsas, pastas, granos secos).",
    icono: ShoppingBasket,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    nombre: "Medicamentos Básicos",
    descripcion: "Botiquín de primeros auxilios, analgésicos, antiácidos y cuidado personal.",
    icono: Pill,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
];

export default function CatalogoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Link href="/dashboard" className="hover:text-slate-800">
              Dashboard
            </Link>
            <span>/</span>
            <span>Inventario</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Catálogo Oficial de Productos (Megalider)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Estructuración de categorías oficiales para la administración interna y preparación de la tienda virtual.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoriasOficiales.map((cat) => {
          const Icon = cat.icono;
          return (
            <Card
              key={cat.nombre}
              hoverEffect
              className="p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="mint">Oficial</Badge>
                </div>
                <h3 className="font-bold text-sm text-slate-800 group-hover:text-[#067335] transition-colors">
                  {cat.nombre}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {cat.descripcion}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#038C3E]">
                <span>Gestionar productos</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Catalog Table Placeholder */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="w-full max-w-md">
            <Input
              type="text"
              placeholder="Buscar producto por nombre o código de barras..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Badge variant="mint" dot>
            Sincronizado con MySQL (Tienda)
          </Badge>
        </div>

        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#A7D9BD]/20 text-[#067335] mx-auto flex items-center justify-center mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Módulo de Catálogo Conectado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Las 4 categorías institucionales de Cigarrería Megalider están configuradas. Cuando ingreses productos desde la BD de tienda o mediante importación de facturas, se sincronizarán directamente aquí.
          </p>
        </div>
      </Card>
    </div>
  );
}
