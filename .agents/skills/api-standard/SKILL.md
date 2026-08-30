---
name: api-standard
description: Guía experta y directivas obligatorias de estandarización, seguridad (OWASP) y tipado estricto para desarrollar, modificar y mantener endpoints HTTP y capas BFF en Next.js 16+ para el proyecto Cigarrería Megalider.
---

# Estándar de API y BFF v3.0 (Security Hardened) — Cigarrería Megalider

Esta skill define las reglas obligatorias, firmas de código, patrones de validación Zod, respuestas unificadas `ApiResponse<T>`, encabezados de seguridad HTTP y baterías de pruebas unitarias que **TODO agente o desarrollador DEBE SEGUIR SIN EXCEPCIÓN** al crear o modificar endpoints en `app/api/`.

---

## 🚨 1. Reglas de Oro Obligatorias (Checklist de Cumplimiento)

1. **Envolvente Único `ApiResponse<T>`**:
   - NUNCA retornar objetos JSON planos como `{ error: "msg" }` o `{ data: ... }`.
   - SIEMPRE importar y usar `apiSuccess(data, status, meta)` y `apiError(message, status, code, details)` desde `@/lib/api/response`.
2. **Validación de `Content-Type: application/json`**:
   - En peticiones `POST`, `PUT` o `PATCH`, SIEMPRE parsear el cuerpo con `await parseJSONBody(request)` desde `@/lib/api/validation`.
3. **Validación de Esquema Zod (Zod First)**:
   - Todo payload de entrada (body JSON o query params) DEBE definirse con un esquema Zod.
   - Parsear usando `validateSchema(schema, body)`. Si falla, la función retorna la respuesta HTTP 400 formateada automáticamente (`VALIDATION_ERROR`).
4. **Protección Timing-Safe en Tokens**:
   - Todo webhook o endpoint autenticado por token secreto Bearer DEBE validarse usando `validateRevalidateToken(request)` desde `@/lib/api/security` (que implementa `crypto.timingSafeEqual` con `Buffer.from()`).
5. **Mitigación de Redirecciones Abiertas (*Open Redirects*)**:
   - Toda URL o path de destino en redirecciones (OAuth callbacks, login) DEBE ser validado con `validateRedirectUri(targetPath)` de `@/lib/api/security`.
6. **Firma Asíncrona Next.js 16+**:
   - `context.params` DEBE resolverse con `const { id } = await params`.
   - `revalidateTag(tag, "default")` DEBE recibir 2 argumentos en Next.js 16+.
7. **Prohibición del Anti-Patrón de Fetch Interno**:
   - Los Server Components (`app/**/page.tsx`) NUNCA realizan `fetch()` a rutas `/api` propias. Consumen directamente `lib/db` o la capa de servicios.

---

## 📐 2. Estructura de Respuesta Estandarizada (`ApiResponse<T>`)

### A. Respuesta de Éxito (`200 OK`, `201 Created`)
```ts
return apiSuccess(data, 200, { timestamp: new Date().toISOString() });
```
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-08-29T23:59:00.000Z"
  }
}
```

### B. Respuesta de Error (`400`, `401`, `403`, `404`, `429`, `500`)
```ts
return apiError("Descripción del error", 400, "VALIDATION_ERROR", details);
```
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados en la petición no son válidos.",
    "details": [
      { "field": "email", "message": "Formato de correo inválido" }
    ]
  }
}
```

---

## 🏗️ 3. Plantilla Estándar para un Nuevo Route Handler (`app/api/.../route.ts`)

```ts
import { z } from "zod";
import { apiSuccess, apiError, handleCORSPreflight } from "@/lib/api/response";
import { parseJSONBody, validateSchema } from "@/lib/api/validation";

// Manejar solicitudes preflight CORS
export function OPTIONS() {
  return handleCORSPreflight();
}

// 1. Definir esquema de validación Zod
const miPayloadSchema = z.object({
  nombre: z.string().min(2).max(100),
  precio: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    // 2. Parsear JSON garantizando Content-Type application/json
    let body: unknown;
    try {
      body = await parseJSONBody(request);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cuerpo JSON inválido";
      return apiError(msg, 400, "BAD_REQUEST");
    }

    // 3. Validar esquema con Zod
    const validation = validateSchema(miPayloadSchema, body);
    if (!validation.success) {
      return validation.errorResponse; // Retorna 400 VALIDATION_ERROR automático
    }

    const data = validation.data;

    // 4. Lógica de negocio / Servicio / Base de Datos
    // ...

    // 5. Retornar respuesta exitosa estandarizada
    return apiSuccess({ registrado: true, data }, 201);
  } catch (error) {
    console.error("Error en Route Handler:", error);
    return apiError("Fallo interno al procesar la petición", 500, "INTERNAL_SERVER_ERROR");
  }
}
```

---

## 🧪 4. Ciclo de Verificación y Calidad

Todo cambio en las APIs del proyecto debe validarse con:

```bash
# 1. Pruebas unitarias
npm run test

# 2. Compilación de producción y verificación de tipos TypeScript
npm run build
```
