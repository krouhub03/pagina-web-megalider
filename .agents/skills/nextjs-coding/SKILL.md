---
name: nextjs-coding
description: Guía experta y directivas para codificar en Next.js (App Router y Next 16+) siguiendo los estándares oficiales de AI Coding Agents (documentación interna versionada, runtime visibility, dev loop, Server/Client components, caché y resolución guiada de errores).
---

# Guía de Codificación y Flujo de Trabajo para Next.js (AI Agent Standard)

Directivas oficiales y patrones de arquitectura para codificar eficientemente en Next.js (versión 16+ con App Router), optimizando la exactitud del código, el rendimiento y el ciclo de verificación según la guía oficial de Next.js para agentes de IA.

---

## 1. Documentación Local Versionada (`node_modules/next/dist/docs/`)

> **REGLA DE ORO:** Nunca adivinar APIs ni confiar en conocimiento de entrenamiento desactualizado. Next.js incluye su documentación completa y sincronizada con la versión instalada dentro del proyecto.

### Rutas de Consulta Local
- **Ruta base**: `node_modules/next/dist/docs/`
  - `01-app/01-getting-started/`: Enrutamiento, layouts, páginas y componentes.
  - `01-app/02-guides/`: Caching, optimización, Server Actions, autenticación, etc.
  - `01-app/03-api-reference/`: Directivas, funciones (`cookies`, `headers`, `revalidatePath`, etc.), componentes (`Image`, `Link`, etc.) y `next.config.ts`.
  - `03-architecture/`: Fast Refresh, compilador y optimizaciones.

### Fallback de Red y Errores Específicos
- **Markdown en red**: Cualquier página oficial puede consultarse en formato Markdown añadiendo `.md` al final:
  - `https://nextjs.org/docs/app/building-your-application/routing.md`
  - `https://nextjs.org/docs/messages/<error-code>.md` (para mensajes de error específicos y patrones canónicos de solución).
- **Índice de documentación**: `https://nextjs.org/docs/llms.txt` y `https://nextjs.org/docs/llms-full.txt`.

---

## 2. Convenciones Críticas de Next.js 16+ (App Router)

### A. Asincronía Obligatoria (`params`, `searchParams`, `cookies`, `headers`)
En Next.js 15 y 16+, `params`, `searchParams`, `cookies()` y `headers()` son **Promesas asíncronas**:

```tsx
// ✅ Correcto en Page Components (Server Component)
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  return <div>Producto: {slug}</div>;
}
```

```tsx
// ✅ Correcto al acceder a cookies o headers en Server Components / Server Actions
import { cookies, headers } from 'next/headers';

export async function checkSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;

  const headerList = await headers();
  const userAgent = headerList.get('user-agent');
  return { token, userAgent };
}
```

### B. Server Components vs Client Components
1. **Server Components por Defecto**: Todos los archivos en `app/` son Server Components a menos que especifiquen `'use client'`.
   - Utilizar Server Components para: fetching directo a base de datos, lectura de archivos, secretos/tokens, reducción de bundle de JavaScript en el cliente.
2. **`'use client'` Quirúrgico**:
   - Ubicar la directiva `'use client'` únicamente en las "hojas" del árbol de componentes que requieran interactividad (hooks de React como `useState`, `useEffect`, `useCallback`, eventos de DOM `onClick`, `onChange`, o APIs del navegador).
   - Nunca colocar `'use client'` en una página o layout completo si solo un botón o formulario necesita interactividad. Extraer el componente interactivo a su propio archivo.

### C. Server Actions y Mutaciones Seguras (`'use server'`)
- Colocar `'use server'` en la parte superior del archivo o dentro de la función asíncrona.
- Siempre validar la entrada (ej. con Zod o esquemas tipados) y verificar permisos/sesión.
- Retornar respuestas estructuradas `{ success: boolean, data?: T, error?: string }` en lugar de lanzar excepciones no controladas.

```tsx
'use server';

import { revalidatePath } from 'next/cache';

export async function updateProductAction(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    // Validaciones y mutación en DB...
    revalidatePath('/admin/products');
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Error al actualizar el producto' };
  }
}
```

### D. Streaming y Manejo de Suspense Boundaries
- Envolver accesos a datos asíncronos o componentes lentos con `<Suspense fallback={<Skeleton />}>` para permitir que el resto de la página se renderice de forma instantánea y evitar bloqueos en el servidor.
- Mantener la navegación instantánea separando el cascarón (App Shell) de los datos dinámicos.

---

## 3. Runtime Visibility & Loop de Desarrollo (`next-dev-loop`)

Sigue un ciclo cerrado de 3 etapas en cada tarea de código:

```
[1. Inspeccionar / Contexto] ──> [2. Edición Quirúrgica] ──> [3. Verificación Runtime]
```

### 1. Inspeccionar
- Identificar la ruta en el App Router (`app/(routes)/...`).
- Verificar si el servidor de desarrollo ya está corriendo revisando `.next/dev/lock` o la salida de la terminal.

### 2. Edición Quirúrgica
- Aplicar cambios respetando tipado estricto de TypeScript.
- Respetar la paleta de colores y componentes de la marca (ver skill `megalider-brand`).
- Mantener optimización de tokens y código limpio (ver skill `token-optimization`).

### 3. Verificación Runtime
- Comprobar que no se generen advertencias ni errores en la compilación de TypeScript / ESLint.
- Ejecutar verificación de build cuando se modifiquen rutas críticas:
  ```bash
  npm run build
  ```
- Si hay errores de prerenderizado en compilación, usar el flag de depuración:
  ```bash
  npx next build --debug-prerender
  ```

---

## 4. Diagnóstico y Corrección Guiada por Errores

Cuando Next.js arroje errores durante la compilación o el renderizado, analiza las opciones estructuradas que el framework provee:

1. **`[stream]`**: El acceso a datos dinámicos bloquea el prerenderizado.
   - *Solución*: Envolver la lectura o el componente dinámico dentro de `<Suspense fallback={...}>`.
2. **`[cache]`**: El acceso a datos puede ser cacheado.
   - *Solución*: Usar la directiva `"use cache"` o estrategias de caché compatibles.
3. **`[block]`**: La ruta requiere necesariamente ejecución bajo demanda por solicitud.
   - *Solución*: Definir explícitamente `export const dynamic = 'force-dynamic'` o `export const instant = false`.

### Consulta Rápida de Errores
- Buscar el código o mensaje en `https://nextjs.org/docs/messages/<nombre-del-error>.md` para aplicar el patrón canónico exacto.

---

## 5. Checklist de Calidad antes de Finalizar Código

- [ ] ¿Los `params` y `searchParams` en componentes de página tienen `await`?
- [ ] ¿Los accesos a `cookies()` y `headers()` son asíncronos (`await cookies()`)?
- [ ] ¿Se separaron correctamente los componentes Server y Client (`'use client'`)?
- [ ] ¿Las imágenes utilizan `next/image` con dimensiones (`width`/`height` o `fill`) y optimización adecuada?
- [ ] ¿Las navegaciones internas usan `next/link` en lugar de etiquetas `<a>`?
- [ ] ¿Las mutaciones y formularios manejan validación y estado de carga (`useActionState`, `useFormStatus` o `isPending`)?
- [ ] ¿El código pasa el chequeo de tipos TypeScript y no tiene errores de compilación?
