---
name: nextjs-analytics
description: Guía experta y directivas para implementar analítica web, medición de Core Web Vitals, instrumentación de cliente y rastreo de eventos en Next.js (App Router y Next 16+).
---

# Analítica y Medición de Rendimiento en Next.js (Web Vitals & Instrumentation)

Directivas de arquitectura y mejores prácticas para capturar, medir y enviar métricas de rendimiento (Core Web Vitals), telemetría e interacciones de usuario en aplicaciones Next.js (App Router y Next 16+).

---

## 1. Fundamentos y Arquitectura de Medición

Next.js proporciona soporte integrado para recopilar métricas de rendimiento sin penalizar la velocidad de carga ni comprometer la arquitectura de Server Components.

### Estrategia de Aislamiento del Cliente (`Client Boundary`)
- El hook `useReportWebVitals` requiere la directiva `'use client'`.
- **Regla de Oro**: Nunca convertir el `RootLayout` o una página en Client Component solo para reportar analíticas.
- **Patrón Canónico**: Crear un componente dedicado (ej. `WebVitals`) que retorne `null` e importarlo directamente en el layout raíz.

```tsx
// app/_components/web-vitals.tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

const handleWebVitals = (metric: Parameters<Parameters<typeof useReportWebVitals>[0]>[0]) => {
  // Manejo de métricas
};

export function WebVitals() {
  useReportWebVitals(handleWebVitals);
  return null;
}
```

```tsx
// app/layout.tsx (Server Component)
import { WebVitals } from './_components/web-vitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
```

> **Importante**: Las funciones pasadas a `useReportWebVitals` se ejecutan con todas las métricas acumuladas hasta ese punto. Para evitar reportes duplicados, asegúrate de mantener la referencia de la función estable (declarada a nivel de módulo o memorizada).

---

## 2. Métricas de Rendimiento (Core Web Vitals)

El objeto `metric` entregado por `useReportWebVitals` contiene la siguiente estructura:

| Propiedad | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único de la métrica para la carga actual de la página. |
| `name` | `string` | Nombre de la métrica (`TTFB`, `FCP`, `LCP`, `FID`, `CLS`, `INP`). |
| `value` | `number` | Valor cuantitativo de la métrica (generalmente en milisegundos). |
| `delta` | `number` | Diferencia entre el valor actual y el valor previo registrado. |
| `rating` | `'good' \| 'needs-improvement' \| 'poor'` | Calificación cualitativa según los umbrales estándar de Google. |
| `navigationType` | `string` | Tipo de navegación (`navigate`, `reload`, `prerender`, `back-forward`, `back-forward-cache`, `restore`). |
| `entries` | `PerformanceEntry[]` | Entradas detalladas del Performance API asociadas al evento. |

### Métricas Clave Soportadas:
- **TTFB (Time to First Byte)**: Latencia de respuesta del servidor web.
- **FCP (First Contentful Paint)**: Tiempo hasta el primer renderizado de texto/imagen.
- **LCP (Largest Contentful Paint)**: Tiempo hasta el renderizado del bloque de contenido principal.
- **CLS (Cumulative Layout Shift)**: Estabilidad visual y cambios acumulados de diseño.
- **INP (Interaction to Next Paint)**: Capacidad de respuesta a interacciones de usuario en toda la sesión.

---

## 3. Envío de Métricas a Sistemas Externos

### A. Endpoint Propio / API de Analítica (No Bloqueante)
Usa `navigator.sendBeacon()` para garantizar la entrega de telemetría incluso cuando el usuario cierra la pestaña o navega fuera del sitio, con fallback a `fetch(..., { keepalive: true })`:

```tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

function sendAnalytics(metric: Parameters<Parameters<typeof useReportWebVitals>[0]>[0]) {
  const body = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigationType: metric.navigationType,
    page: window.location.pathname,
  });

  const url = '/api/analytics';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      body,
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export function WebVitals() {
  useReportWebVitals(sendAnalytics);
  return null;
}
```

### B. Google Analytics 4 (`gtag`)
Para enviar Web Vitals a GA4 respetando las convenciones oficiales de Google:

```tsx
'use client';

import { useReportWebVitals } from 'next/web-vitals';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), // Valores enteros requeridos
      event_label: metric.id, // ID único de la carga de página
      metric_rating: metric.rating,
      metric_value: metric.value,
      metric_delta: metric.delta,
      non_interaction: true, // Evita distorsionar la tasa de rebote
    });
  });

  return null;
}
```

---

## 4. Instrumentación Temprana del Cliente (`instrumentation-client.ts`)

Para inicializaciones globales que deben ejecutarse **antes** de que el código de la UI comience a hidratarse (monitoreo de errores no controlados, configuración de SDKs globales, trackers de rendimiento temprano):

Crear `instrumentation-client.ts` o `instrumentation-client.js` en la raíz del proyecto:

```typescript
// instrumentation-client.ts (raíz del proyecto)
export function register() {
  // Inicialización de herramientas de tracking globales
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      // Enviar reporte de errores críticos a servicio de observabilidad
      const errorPayload = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      };
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/errors', JSON.stringify(errorPayload));
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      // Capturar promesas rechazadas no manejadas
      console.warn('Unhandled promise rejection:', event.reason);
    });
  }
}
```

---

## 5. Integración con Librerías Oficiales y de Terceros

### A. Vercel Analytics y Speed Insights
Para despliegues en Vercel con recolección automática zero-config:

```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### B. Google Tag Manager y Google Analytics (`@next/third-parties`)
Utilizar el paquete oficial `@next/third-parties` para carga diferida optimizada:

```tsx
// app/layout.tsx
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      <GoogleTagManager gtmId="GTM-XXXXXXX" />
    </html>
  );
}
```

---

## 6. Tracking de Eventos Personalizados e Interacciones

Para registrar eventos de conversión clave en el negocio (ej. agregar al carrito, clic en WhatsApp de atención al cliente, filtros de catálogo):

```tsx
// lib/analytics.ts
export function trackCustomEvent(eventName: string, params: Record<string, any> = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...params,
      timestamp: new Date().toISOString(),
    });
  }
}
```

```tsx
// Ejemplo de uso en componente interactivo de cliente
'use client';

import { trackCustomEvent } from '@/lib/analytics';

export function ContactWhatsAppButton({ phone, productName }: { phone: string; productName?: string }) {
  const handleClick = () => {
    trackCustomEvent('contact_whatsapp_click', {
      product: productName || 'general',
      channel: 'whatsapp_direct',
    });
  };

  return (
    <a
      href={`https://wa.me/${phone}`}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
    >
      Contactar por WhatsApp
    </a>
  );
}
```

---

## 7. Checklist de Calidad para Analítica

- [ ] ¿El componente de Web Vitals está aislado en `'use client'` y no convierte el `layout` completo a cliente?
- [ ] ¿La función de callback de `useReportWebVitals` tiene referencia estable para evitar reportes duplicados?
- [ ] ¿Los envíos de telemetría utilizan `navigator.sendBeacon` o `fetch(..., { keepalive: true })` para no bloquear el hilo principal ni perder datos al navegar?
- [ ] ¿En Google Analytics, la métrica `CLS` se escala con `* 1000` y se marca con `non_interaction: true`?
- [ ] ¿Se protegen los accesos a objetos de navegador (`window`, `navigator`) con verificaciones `typeof window !== 'undefined'`?
- [ ] ¿Se evitan datos personales identificables (PII) no anonimizados en los payloads de eventos?
