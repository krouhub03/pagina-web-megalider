# 🛡️ 05 - Patrones de Arquitectura y Estado

Este documento especifica las decisiones de diseño técnico y patrones de arquitectura aplicados en Next.js 16+ App Router.

---

## 🛡️ 1. Patrón Data Access Layer (DAL) & Cache Components

1. **Aislamiento Seguro (`server-only`):** La lógica de validación criptográfica y tokens en `lib/auth/jwt.ts` está encapsulada para evitar que cualquier secreto o helper llegue al bundle del navegador.
2. **Push Dynamic Access Down (Streaming no bloqueante):** Los layouts no ejecutan llamadas bloqueantes a `cookies()` en su raíz. Las lecturas dinámicas se delegan a componentes específicos envueltos en `<Suspense>`, permitiendo que el shell estático se transmita de forma instantánea al cliente.
3. **Data Transfer Objects (DTO):** Las respuestas y sesiones solo exponen campos públicos (`id`, `nombre`, `email`, `rol`, `avatarUrl`), garantizando que datos sensibles como `password_hash` nunca sean transferidos al cliente.

---

## 🔌 2. Arquitectura Backend for Frontend (BFF)

El patrón BFF en Next.js desacopla la UI de los servicios y bases de datos internos:

```text
[Cliente Web / Móvil / Agentes IA]
              │
    (HTTPS / REST / OAuth)
              ▼
┌──────────────────────────────────────────────┐
│       Next.js App Router (BFF Layer)         │
│  - Route Handlers (`app/api/**/route.ts`)    │
│  - Middleware / Proxy (`middleware.ts`)      │
│  - Negociación de Contenido (`Vary: Accept`) │
│  - Sanitización & Validación de Esquema      │
└──────┬───────────────────────────────┬───────┘
       │                               │
       ▼                               ▼
 [PostgreSQL: Hermes IA]      [MySQL: Tienda & Usuarios]
```

* **Regla de Separación:** Los Server Components leen directamente de las capas de base de datos (`lib/db/`), mientras que los Route Handlers atienden peticiones externas, OAuth, webhooks y clientes que requieren formatos específicos (JSON, XML, Markdown).

---

## ⚡ 3. Estrategia de Lazy Loading & Optimización de Bundle

1. **Server Components por Defecto:** Se dividen automáticamente en fragmentos (*code-splitting*) en el servidor y se transmiten mediante *streaming*.
2. **Client Components Bajo Demanda (`next/dynamic`):**
   - Modales (verificación de edad, filtros avanzados, drawers de carrito).
   - Componentes interactivos dependientes de APIs de navegador con `{ ssr: false }` exclusivo en Client Components.
   - Placeholders visuales (`loading: () => <Skeleton />`) para garantizar estabilidad visual (CLS = 0).
3. **Librerías Externas (`import()` dinámico):** Carga en diferido de herramientas pesadas (búsqueda difusa `fuse.js`, generadores de recibos PDF, exportadores Excel) solo al desencadenar la acción.

---

## 📈 4. Medición de Rendimiento y Core Web Vitals

* **Límites de Cliente Aislados:** Telemetría instrumentada en componentes cliente dedicados (`useReportWebVitals`) sin convertir páginas o layouts en Client Components.
* **Envío No Bloqueante:** Uso prioritario de `navigator.sendBeacon()` o `fetch(..., { keepalive: true })` para garantizar la entrega de métricas sin impactar el hilo principal de renderizado.

---

## 🛒 5. Arquitectura de Estado Cliente (Zustand)

El estado interactivo del cliente (como el carrito de compras e interacciones de UI) se gestiona mediante **Zustand** siguiendo tres principios de diseño:

1. **Aislamiento de Client Components:** El estado global no requiere envolver la aplicación en un `<Provider>`. Esto permite que los `layout.tsx` y `page.tsx` se mantengan como Server Components de alto rendimiento.
2. **Suscripción por Selectores:** Los componentes solo se re-renderizan cuando cambia la porción de estado que están escuchando expresamente (`useCartStore((state) => state.getTotalItems())`).
3. **Persistencia Transparente:** La sincronización con `localStorage` está aislada mediante un adaptador `safeStorage` que evita errores de desincronización (*hydration mismatch*) y fallos en entornos sin DOM (SSR y pruebas de servidor).
