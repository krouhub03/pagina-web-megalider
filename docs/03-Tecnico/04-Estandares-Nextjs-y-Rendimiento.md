# ⚡ 04 - Estándares Next.js 16+, Rendimiento y Estado

Este documento cubre la alineación con las guías oficiales de Next.js (Authentication & Cache Components), lazy loading, instrumentación de Web Vitals y stores de Zustand.

---

## ⚡ 1. Alineación con Estándares Next.js 16+ (Cache Components)

El sistema cumple con las guías oficiales de Next.js:

1. **Next.js Authentication Guide:**
   * **Server Actions & Route Handlers:** Procesamiento 100% en el servidor sin exponer credenciales.
   * **Asincronía en Next.js 16:** Invocación asíncrona de `await cookies()`.
   * **Optimistic Checks en Middleware:** Comprobaciones rápidas del JWT en Edge sin llamadas a bases de datos para no degradar el prefetching.
   * **Data Access Layer (DAL) & DTOs:** Centralización del usuario en `lib/auth/jwt.ts` protegido con `import 'server-only'` y emisión de datos públicos limpios sin contraseñas.

2. **Authentication with Cache Components Guide:**
   * **Límites de Suspense:** Los accesos a parámetros dinámicos (`searchParams` o cookies) están encapsulados en componentes bajo `<Suspense>`, preservando el shell estático.
   * **Push Dynamic Access Down:** Los layouts principales no realizan llamadas bloqueantes a `cookies()` en su raíz, permitiendo el streaming inmediato de la UI.
   * **Reglas de Caché Segura:** Las directivas de caché nunca leen cookies directamente en `use cache` plano; para sesiones privadas se emplea el scope del cliente (`use cache: private`) y para caché del servidor se extrae exclusivamente el `userId` en `cacheTag`.

---

## ⚡ 2. Guía Técnica de Lazy Loading & Code Splitting

* **Componentes Dinámicos:** Utilización de `next/dynamic` para componentes pesados y modales condicionales:
  ```tsx
  const CartDrawer = dynamic(() => import('@/components/cart/cart-drawer'), {
    loading: () => <SkeletonLoader />,
  });
  ```
* **Desactivación de SSR:** La opción `{ ssr: false }` está estrictamente reservada para Client Components (`'use client'`). Prohibido su uso en Server Components.
* **Importación de Módulos Bajo Demanda:** Librerías de procesamiento como `fuse.js` se cargan dentro del handler de evento con `const Fuse = (await import('fuse.js')).default`.

---

## 📊 3. Instrumentación y Medición de Core Web Vitals

* **Componente de Aislamiento:** Implementado en `app/_components/web-vitals.tsx` con directiva `'use client'`, garantizando que `RootLayout` se mantenga como Server Component.
* **Métricas Rastreadas:** TTFB, FCP, LCP (< 2.5s), CLS (< 0.1), INP (< 200ms).
* **Envío No Bloqueante:** Implementación mediante `navigator.sendBeacon('/api/analytics', payload)` o fallback a `fetch(..., { keepalive: true })`.

---

## 🛒 4. Gestión de Estado Global Cliente (Zustand Stores)

* **Store de Filtros de Facturas (`lib/stores/use-facturas-filtros-store.ts`):**
  - **Estado:** `busqueda: string`, `fechaInicio`, `fechaFin`, `proveedorFiltro`.
  - **Acciones:** `setBusqueda()`, `setFechaInicio()`, `setFechaFin()`, `setProveedorFiltro()`, `resetFiltros()`.
  - **Uso:** Filtrado reactivo en tiempo real en la lista de facturas sin recargar la página ni realizar llamadas redundantes al servidor.
