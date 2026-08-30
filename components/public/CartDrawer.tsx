"use client";

import React from "react";
import Image from "next/image";
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/stores/use-cart-store";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const isOpen = useCartStore((state) => state.isOpen);
  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={toggleCart}
      />

      {/* Drawer */}
      <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#067335]/10 text-[#067335] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-slate-900">
                Tu Carrito de Compras
              </h2>
              <p className="text-xs text-slate-500">
                {items.length} {items.length === 1 ? "producto seleccionado" : "productos seleccionados"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleCart}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of items */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300" />
              <div>
                <p className="font-bold text-slate-700 text-sm">Tu carrito está vacío</p>
                <p className="text-xs text-slate-500 mt-1">
                  Explora nuestras categorías y agrega tus licores o antojitos favoritos.
                </p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white shadow-2xs hover:border-slate-200 transition-all"
              >
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                  <Image
                    src={item.imagenUrl || "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=200"}
                    alt={item.nombre}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.nombre}
                  </h4>
                  <p className="text-[11px] font-semibold text-[#067335] mt-0.5">
                    {formatCurrency(item.precio)}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(item.precio * item.cantidad)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-600">Total a pagar:</span>
              <span className="font-serif font-extrabold text-xl text-[#067335]">
                {formatCurrency(getTotalPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearCart}
                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                Vaciar Carrito
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  alert("Proceder al Checkout (Próximamente disponible)");
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="text-xs shadow-md shadow-[#067335]/20"
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
