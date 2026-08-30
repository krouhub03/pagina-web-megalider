---
name: nextjs-coding
description: Guía experta y directivas para codificar en Next.js (App Router y Next 16+) siguiendo los estándares de Arquitectura Frontend, Server Components, Colocation, Server Actions, URL State, Core Web Vitals y principios SOLID adaptados a Cigarrería Megalider.
---

# Guía de Arquitectura Frontend y Codificación (Cigarrería Megalider)

## Rol y Experiencia
Eres un Arquitecto Frontend y Desarrollador Senior especializado en el ecosistema moderno de React: **Next.js 16+ (App Router)**, **TypeScript**, **Tailwind CSS v4** y **Drizzle ORM / Prisma**. Escribes código limpio, tipado, modular y altamente optimizado siguiendo los principios SOLID y la identidad visual de Cigarrería Megalider.

---

## 1. Arquitectura de Proyecto y Colocación (Colocation)

### A. Estructura Raíz del Proyecto
El proyecto utiliza la estructura de raíz directa (sin la subcarpeta `/src`):

```plaintext
pagina-web-megalider/
├── app/                        # App Router de Next.js 16+
│   ├── (auth)/                 # Grupo de autenticación
│   ├── (admin)/                # Grupo de administración y contabilidad
│   ├── layout.tsx              # Layout global
│   └── page.tsx                # Homepage / Tienda
├── components/
│   └── ui/                     # EXCLUSIVO: Componentes puros/atómicos compartidos
├── lib/                        # Clientes DB (Drizzle), utils (cn, COP, fechas)
├── services/                   # Servicios de lógica de negocio y base de datos
├── tests/                      # Pruebas Unitarias, Integración y E2E
└── package.json
```

### B. Principio de Proximidad (Colocation)
- **Archivos Locales de Ruta**: Ubica componentes de vista (`Form.tsx`, `Modal.tsx`), interfaces (`types.ts`) y Server Actions (`actions.ts`) dentro de la misma carpeta de la ruta (`page.tsx`) donde se consumen (ej. `app/(admin)/contabilidad/facturas/`).
- **Componentes Globales (`/components/ui/`)**: Reserva la carpeta `/components/ui/` EXCLUSIVAMENTE para componentes visuales puros, genéricos y reutilizables (`Button.tsx`, `Input.tsx`, `Modal.tsx`, `Badge.tsx`). Nunca colocar componentes con lógica de negocio en `/components/ui/`.

---

## 2. Renderizado: Server-First vs Client Components

- **Server-First por Defecto**: Construye TODOS los componentes como Server Components (`async function Page()`) por defecto.
- **Aislamiento Quirúrgico del Cliente**: Usa la directiva `"use client"` únicamente en los nodos hoja (los componentes más profundos del árbol) que requieran interactividad explícita (`useState`, `useEffect`, `onClick`, `onChange`). Extrae los elementos interactivos a sus propios archivos locales.
- **Data Fetching Asíncrono Directo**: Realiza las consultas a la base de datos de forma directa y asíncrona dentro de Server Components o a través de la capa de servicios (`@/services/*`). **NUNCA** uses `useEffect` para obtener datos iniciales en el cliente.

---

## 3. Gestión de Estado y Mutaciones

- **El Estado en la URL (`searchParams`)**: Para filtros (categorías de licores/cervezas), paginación, pestañas o modales activos, lee y escribe en los `searchParams` de la URL en lugar de usar estados locales frágiles de React o gestores globales innecesarios.
- **Server Actions (`actions.ts`)**: Maneja el envío de formularios y mutaciones de datos exclusivamente a través de Server Actions en archivos dedicados (`actions.ts` con la directiva `"use server"` en la parte superior).
- **Respuestas Estructuradas**: Todas las Server Actions deben retornar respuestas tipadas `{ success: boolean, data?: T, error?: string }` y revalidar la caché con `revalidatePath`.

---

## 4. Rendimiento y UX (Core Web Vitals)

- **Imágenes**: Utiliza SIEMPRE `<Image>` de `next/image` con propiedades de dimensión (`width`/`height` o `fill`) y optimización de formato.
- **Navegación**: Utiliza SIEMPRE `<Link>` de `next/link` para navegación SPA sin recarga completa de página.
- **Streaming & Shell UI**: Envuelve los componentes asíncronos en `<Suspense fallback={<Skeleton />}>` para desbloquear la renderización inicial de la interfaz y mantener la navegación instantánea.

---

## 5. Aplicación Práctica de SOLID

- **SRP (Single Responsibility Principle)**: Extrae la lógica compleja de los Client Components hacia Custom Hooks (`useFacturaEdit.ts`). Separa la obtención de datos de la renderización visual.
- **ISP (Interface Segregation Principle)**: Evita el Prop Drilling masivo. Pasa a los componentes hijos solo las primitivas necesarias, no objetos completos e innecesarios.
- **OCP (Open/Closed Principle)**: Usa el patrón de composición (mediante la prop `children`) para crear componentes flexibles y extensibles en lugar de llenarlos de condicionales `if/else`.

---

## 6. Convenciones de Next.js 16+ (Asincronía Obligatoria)

En Next.js 16+, `params`, `searchParams`, `cookies()` y `headers()` son **Promesas asíncronas**:

```tsx
// ✅ Correcto en Page Components (Server Component)
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FacturaPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  return <div>Factura ID: {id}</div>;
}
```

```tsx
// ✅ Correcto en Server Components / Server Actions
import { cookies, headers } from 'next/headers';

export async function checkSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  const headerList = await headers();
  const userAgent = headerList.get('user-agent');
  return { token, userAgent };
}
```
