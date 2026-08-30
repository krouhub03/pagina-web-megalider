---
name: nextjs-zustand
description: Guía experta y directivas para diseño, implementación, optimización y pruebas de estado global cliente con Zustand en Next.js 16+ (App Router) y React 19 para el proyecto Cigarrería Megalider.
---

# Gestión de Estado Global Cliente con Zustand en Next.js 16 (App Router)

Directivas oficiales, reglas de arquitectura y patrones de implementación para gestionar el estado interactivo del cliente (carrito de compras, filtros de catálogo, estados de UI) utilizando **Zustand** en **Next.js 16+** y **React 19**.

---

## 1. Principios y Reglas de Oro

1. **Cero Infección de `<Provider>`:**
   - Nunca envuelvas el `RootLayout` (`app/layout.tsx`) o las páginas principales con un `<Provider>` global de estado.
   - Zustand crea custom hooks independientes que preservan las páginas y layouts principales como **Server Components** de alto rendimiento.

2. **Directiva `'use client'` Quirúrgica:**
   - Los stores de Zustand solo deben ser invocados dentro de **Client Components** (`'use client'`).
   - Si un Server Component necesita renderizar datos iniciales, pásalos como `props` a un Client Component especializado.

3. **Suscripción por Selectores Granulares:**
   - Evita desestructurar todo el store (`const { items, isOpen } = useCartStore()`).
   - Extrae únicamente las propiedades necesarias mediante **selectores** para prevenir renderizados innecesarios:
     ```tsx
     // ✅ Correcto
     const totalItems = useCartStore((state) => state.getTotalItems());
     const toggleCart = useCartStore((state) => state.toggleCart());
     ```

4. **Persistencia Segura frente a SSR y Vitest (`safeStorage`):**
   - Para evitar desincronizaciones de hidratación (*hydration mismatch*) o fallos en entornos de Node.js donde `window` no existe (SSR o pruebas de Vitest), utiliza siempre el patrón de adaptador `safeStorage`.

---

## 2. Estructura de Archivos y Convención de Nombres

Todos los stores deben ubicarse exclusivamente dentro de `lib/stores/`:

```text
lib/
└── stores/
    ├── use-cart-store.ts        # Store principal del Carrito de Compras
    ├── use-filter-store.ts      # Store de Filtros y Búsqueda de Productos
    └── use-ui-store.ts          # Store de modales y notificaciones globales
```

---

## 3. Patrón de Implementación Canónico (`useCartStore`)

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagenUrl: string;
  categoria: string;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Acciones
  addItem: (product: Omit<CartItem, 'cantidad'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, cantidad: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setIsOpen: (isOpen: boolean) => void;

  // Getters derivados
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// Map en memoria para fallbacks durante SSR o Vitest
const memoryStorage = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(name);
    }
    return memoryStorage.get(name) || null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(name, value);
    } else {
      memoryStorage.set(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(name);
    } else {
      memoryStorage.delete(name);
    }
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.id === product.id);

        if (existingIndex > -1) {
          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            cantidad: updatedItems[existingIndex].cantidad + 1,
          };
          set({ items: updatedItems });
        } else {
          set({ items: [...currentItems, { ...product, cantidad: 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, cantidad } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      setIsOpen: (isOpen) => set({ isOpen }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.cantidad, 0),
      getTotalPrice: () => get().items.reduce((total, item) => total + item.precio * item.cantidad, 0),
    }),
    {
      name: 'megalider-cart-storage',
      storage: createJSONStorage(() => safeStorage),
      // Persistir únicamente el array de items (no estados volátiles de UI como isOpen)
      partialize: (state) => ({ items: state.items }),
      skipHydration: true,
    }
  )
);
```

---

## 4. Consumo en Client Components

### A. Botón Badge en Header (`components/cart/cart-button.tsx`)

```tsx
'use client';

import { useCartStore } from '@/lib/stores/use-cart-store';
import { ShoppingBag } from 'lucide-react';

export function CartButton() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const toggleCart = useCartStore((state) => state.toggleCart());

  return (
    <button
      onClick={toggleCart}
      aria-label="Abrir Carrito"
      className="relative p-2 text-white hover:text-emerald-300 transition-colors"
    >
      <ShoppingBag className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-amber-400 text-emerald-950 font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </button>
  );
}
```

---

## 5. Integración con Lazy Loading (`next/dynamic`)

Siguiendo **RNF-02** y la skill `nextjs-lazy-loading`, los componentes interactivos de UI consumidos por Zustand deben cargarse en diferido:

```tsx
import dynamic from 'next/dynamic';

const CartDrawer = dynamic(
  () => import('@/components/cart/cart-drawer').then((mod) => mod.CartDrawer),
  { ssr: false }
);
```

---

## 6. Patrón de Pruebas Unitarias en Vitest

Las pruebas unitarias deben ubicarse en `tests/stores/`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '@/lib/stores/use-cart-store';

describe('CartStore (Zustand)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('debe agregar un item al carrito', () => {
    const product = {
      id: 'prod-1',
      nombre: 'Aguardiente Néctar',
      precio: 45000,
      imagenUrl: '/images/nectar.jpg',
      categoria: 'Licores',
    };

    useCartStore.getState().addItem(product);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].cantidad).toBe(1);
    expect(useCartStore.getState().getTotalPrice()).toBe(45000);
  });
});
```

---

## 7. Anti-Patrones a Evitar

❌ **Llamar al store dentro de Server Components:** Causará un error de renderizado en servidor.  
❌ **Retornar `null` en `createJSONStorage`:** Lanza `TypeError: Cannot read properties of null (reading 'setItem')` en Vitest/SSR.  
❌ **Persistir estados volátiles de UI:** Evita incluir flags de UI (`isOpen`, `isLoading`, `error`) dentro de la propiedad `partialize` de `persist`.  
❌ **Mutar el estado directamente:** Usa siempre las funciones `set()` e inmutabilidad con `map()` o propagación `[...items]`.
