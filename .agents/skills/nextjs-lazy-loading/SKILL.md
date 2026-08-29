---
name: nextjs-lazy-loading
description: Guía experta y directivas para implementar Lazy Loading, importaciones dinámicas (next/dynamic, React.lazy, Suspense), omisión de SSR (ssr: false), carga diferida de librerías externas y magic comments en Next.js (App Router y Next 16+).
---

# Lazy Loading e Importaciones Dinámicas en Next.js (App Router)

Directivas de arquitectura, mejores prácticas y patrones de implementación para diferir la carga de Client Components y librerías de terceros pesadas, reduciendo el bundle de JavaScript inicial y optimizando el rendimiento (FCP, LCP, INP) en aplicaciones Next.js (App Router y Next 16+).

---

## 1. Fundamentos de Lazy Loading

El Lazy Loading (carga diferida) en Next.js disminuye la cantidad de JavaScript necesario para el renderizado inicial de una ruta:
- **Server Components**: Por defecto, los Server Components son divididos en fragmentos de código (*code splitting*) de forma automática y se transmiten mediante *streaming* (`<Suspense>`).
- **Client Components**: Requieren lazy loading explícito mediante `next/dynamic` o `React.lazy()` con `Suspense` para evitar que su código se incluya en el bundle inicial de la página.
- **Librerías externas**: Se deben cargar bajo demanda mediante `import()` dentro de manejadores de eventos o funciones específicas.

---

## 2. Uso de `next/dynamic`

`next/dynamic` es una abstracción que combina `React.lazy()` y React `<Suspense>`.

### A. Carga de Client Components

```tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// 1. Carga diferida en un bundle separado (se descarga en segundo plano)
const ProductQuickView = dynamic(() => import('@/components/products/quick-view'));

// 2. Carga con componente de estado de carga personalizado (Skeleton)
const CartDrawer = dynamic(() => import('@/components/cart/cart-drawer'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-96 w-full rounded-md" />,
});

// 3. Carga solo en el cliente deshabilitando SSR
const MapStoreLocator = dynamic(() => import('@/components/maps/store-locator'), {
  ssr: false,
});

export default function CatalogView() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Ver Carrito</button>
      
      {/* Se descarga y renderiza solo si la condición se cumple */}
      {isOpen && <CartDrawer />}

      <ProductQuickView />
      <MapStoreLocator />
    </div>
  );
}
```

### B. Desactivar SSR (`ssr: false`)

Cuando se utiliza `React.lazy()` o `next/dynamic`, los Client Components se pre-renderizan en el servidor (SSR) por defecto.

> ⚠️ **Regla Crítica:** La opción `{ ssr: false }` **SOLO** está permitida dentro de **Client Components** (`'use client'`). Si se intenta usar `ssr: false` dentro de un Server Component, Next.js generará un error de compilación.

```tsx
// ✅ Correcto: Declarado en un Client Component
'use client';

import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/maps/leaflet-map'), {
  ssr: false,
  loading: () => <p>Cargando mapa...</p>,
});
```

### C. Importación de Named Exports (Exportaciones Nombradas)

Si el módulo a importar no tiene `export default`, se debe retornar la propiedad específica desde la Promesa:

```tsx
// components/dialogs/age-gate.tsx
'use client';
export function AgeGateDialog() {
  return <dialog>Verificación de edad Megalider</dialog>;
}
```

```tsx
// app/page.tsx
'use client';

import dynamic from 'next/dynamic';

const AgeGateDialog = dynamic(() =>
  import('@/components/dialogs/age-gate').then((mod) => mod.AgeGateDialog)
);
```

---

## 3. Carga Dinámica de Librerías Externas (`import()`)

Para librerías pesadas (ej. búsqueda difusa, generación de PDF, exportación a Excel, manipulación de fechas pesadas, visualizaciones complejas), diferir la importación hasta el momento exacto en que se ejecuta la acción:

### Ejemplo: Búsqueda difusa de productos con `fuse.js`

```tsx
'use client';

import { useState } from 'react';

const products = [
  { id: '1', name: 'Aguardiente Antioqueño 750ml' },
  { id: '2', name: 'Whisky Johnnie Walker Black Label' },
  { id: '3', name: 'Ron Medellín Añejo 8 Años' },
];

export function ProductSearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof products>([]);

  const handleSearch = async (searchTerm: string) => {
    setQuery(searchTerm);
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    // ⚡ Carga fuse.js únicamente cuando el usuario escribe en el input
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(products, { keys: ['name'], threshold: 0.3 });
    
    setResults(fuse.search(searchTerm).map((r) => r.item));
  };

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar licores, cigarrillos..."
        className="border px-4 py-2 rounded-lg"
      />
      <ul>
        {results.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 4. Importación Dinámica en Server Components

Al importar un Server Component dinámicamente:
- No se lazy-loadeará el Server Component en sí mismo, sino los Client Components que sean hijos de dicho Server Component.
- Ayuda a precargar activos estáticos (como hojas de estilo CSS asociadas).
- **Prohibido**: No usar `ssr: false` en Server Components.

```tsx
// app/products/page.tsx (Server Component)
import dynamic from 'next/dynamic';

const HeavyServerSection = dynamic(() => import('@/components/sections/heavy-analytics-summary'));

export default function ProductsPage() {
  return (
    <div>
      <h1>Catálogo de Productos</h1>
      <HeavyServerSection />
    </div>
  );
}
```

---

## 5. Magic Comments para Bundlers (Turbopack y Webpack)

Next.js permite anotaciones mágicas en comentarios para controlar el comportamiento del empaquetador en expresiones `import()` o `require()`.

> **Nota**: Los Magic Comments funcionan en expresiones dinámicas `import(...)`, no en sentencias estáticas `import x from 'y'`.

### A. `webpackIgnore` / `turbopackIgnore`
Excluye la importación del bundle durante la compilación, resolviéndose únicamente en tiempo de ejecución (runtime):

```ts
// Omitir empaquetado en Webpack
const runtimeModule = await import(/* webpackIgnore: true */ 'external-runtime-pkg');

// Omitir empaquetado en Turbopack
const dynamicPlugin = await import(/* turbopackIgnore: true */ pluginPath);
```

### B. `turbopackOptional` (Turbopack)
Suprime errores de build si el módulo no existe, posponiendo cualquier fallo de resolución a tiempo de ejecución:

```ts
// No falla el build si el archivo opcional no existe
const optionalFeature = await import(/* turbopackOptional: true */ './optional-module');
```

---

## 6. Cuándo Usar y Cuándo Evitar Lazy Loading

### ✅ Cuándo USAR:
1. **Modales y Diálogos**: Carritos deslizables, modal de verificación de edad (+18), modales de checkout, wizards paso a paso.
2. **Componentes debajo del pliegue (*below-the-fold*)**: Secciones de comentarios, mapas interactivos de sucursales, carruseles secundarios, formularios de contacto al final de la página.
3. **Librerías de procesamiento bajo demanda**: Generadores de códigos QR, escáneres de código de barras, exportadores a PDF/Excel, bibliotecas de gráficos/charts.
4. **Componentes dependientes del navegador**: Librerías que usan `window`, `navigator`, `document` o `canvas` y rompen durante SSR (`ssr: false`).

### ❌ Cuándo EVITAR:
1. **Contenido Principal / Encima del Pliegue (*Above-the-fold*)**: Header principal, Hero section, título del producto principal (usar lazy loading aquí degradará el LCP).
2. **Server Components puros**: Los Server Components ya son divididos eficientemente y no cargan JS en el cliente a menos que sean Client Components.
3. **Componentes triviales o diminutos**: Iconos pequeños o botones simples (la sobrecarga del wrapper `dynamic` supera el ahorro de bytes).

---

## 7. Checklist de Calidad para Lazy Loading

- [ ] ¿Los componentes con APIs del navegador (`window`, `localStorage`, `canvas`) usan `{ ssr: false }` dentro de un Client Component?
- [ ] ¿Los componentes interactivos pesados incluyen un placeholder visual (`loading: () => <Skeleton />`) para evitar saltos de diseño (CLS)?
- [ ] ¿Las librerías auxiliares pesadas (`fuse.js`, `jspdf`, `xlsx`) se importan bajo demanda dentro del manejador del evento en lugar de a nivel de módulo raíz?
- [ ] ¿Se evitó el uso de `{ ssr: false }` en Server Components?
- [ ] ¿Los named exports usan `.then((mod) => mod.ComponentName)` al utilizar `next/dynamic`?
- [ ] ¿El componente LCP principal de la página se carga de forma directa y no con lazy loading para no penalizar la velocidad de carga inicial?
