# 🌐 02 - Estándar de API y Backend for Frontend (BFF) - Versión 3.0

Este documento especifica la **arquitectura técnica estandarizada y securizada** de la capa API y Backend for Frontend (BFF) en el proyecto **Cigarrería Megalider** (Next.js 16+ App Router).

---

## 🌐 1. Catálogo Completo de Endpoints API

| Endpoint | Método | Autenticación / Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `/api/auth/google` | `GET` | Pública / CSRF State | Genera token criptográfico anti-CSRF (`state`), setea cookie `oauth_state` y redirige a Google OAuth 2.0. |
| `/api/auth/google/callback` | `GET` | Cookie `oauth_state` + Whitelist | Canjea el código de autorización, consulta perfil Google, sincroniza en MySQL (`usuarios`), emite JWT `auth_token` y redirige según rol con validación anti Open Redirect. |
| `/api/facturas/consolidated` | `GET` | Staff JWT | Consulta paginada y filtrado reactivo de facturas consolidadas por texto, tipo de operación, estado contable y medio de pago. |
| `/api/facturas/[id]` | `GET`, `PUT`, `DELETE` | Staff JWT | Consulta detallada, modificación completa con recálculo y eliminación transaccional en cascada. |
| `/api/facturas/audit/[id]/approve` | `POST` | Staff JWT | Aprobación de auditoría, sincronización de proveedor/items y migración de imágenes a MariaDB. |
| `/api/contabilidad/asientos` | `GET`, `POST` | Staff JWT | Consulta de libro diario y ejecución de conciliación contable de partida doble NIIF. |
| `/api/contabilidad/tesoreria` | `GET`, `POST` | Staff JWT | Consulta y creación de cuentas de tesorería y catálogo de medios de pago (`?tipo=medios`). |
| `/api/contabilidad/retenciones` | `GET` | Staff JWT | Consulta de catálogo de retenciones en la fuente tributarias. |
| `/api/contabilidad/tipos-operacion` | `GET` | Staff JWT | Catálogo de tipos de operación económica y destinos contables. |
| `/api/analytics` | `POST` | Pública / Zod Validated | Recibe telemetría no bloqueante de Core Web Vitals (`sendBeacon`). |
| `/api/webhooks/revalidate` | `POST` | Bearer Secret (`timingSafeEqual`) | Revalida la caché bajo demanda (`revalidateTag` / `revalidatePath`) y registra el evento en auditoría. |
| `/api/openapi` | `GET` | Dev Mode / API Key | Retorna la especificación técnica OpenAPI 3.0 en formato JSON. |

---

## 📐 2. Estructura de Respuesta Estandarizada (`ApiResponse<T>`)

Todos los Route Handlers (`app/api/**/route.ts`) deben utilizar los helpers de `lib/api/response.ts` para garantizar el contrato JSON unificado:

### A. Respuesta de Éxito (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-08-29T23:58:00.000Z"
  }
}
```

### B. Respuesta de Error (`400`, `401`, `403`, `404`, `429`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados en la petición no son válidos.",
    "details": [
      {
        "field": "email",
        "message": "Formato de correo electrónico inválido"
      }
    ]
  }
}
```

---

## 🛡️ 3. Reglas de Validación, Seguridad y Hardening

### 3.1 Validación Estricta con Zod y Content-Type (`lib/api/validation.ts`)
* Todo endpoint que acepte peticiones `POST`, `PUT` o `PATCH` debe validar previamente que la cabecera `Content-Type` incluya `application/json` usando `parseJSONBody(request)`.
* Los datos deben ser parseados con `validateSchema(schema, body)`. En caso de fallo, se retorna un HTTP 400 estandarizado con el detalle de campos.

### 3.2 Verificación de Tokens a Prueba de Timing Attacks (`lib/api/security.ts`)
* Para endpoints protegidos por secreto (webhooks), la comprobación del Bearer Token DEBE usar `crypto.timingSafeEqual` con `Buffer.from()` en tiempo constante, evitando ataques de medición de tiempo.

### 3.3 Mitigación de Redirecciones Abiertas (*Open Redirects*)
* La función `validateRedirectUri(path)` valida que la ruta de retorno sea relativa, comience por `/` y pertenezca a la lista blanca de rutas de la aplicación (`/`, `/dashboard`, `/catalogo`, `/contabilidad`, `/usuarios`, `/admin`).

### 3.4 Encabezados de Seguridad HTTP (`middleware.ts`)
El middleware global inyecta automáticamente en todas las respuestas las siguientes cabeceras de seguridad OWASP:
* `X-Frame-Options: DENY`
* `X-Content-Type-Options: nosniff`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
* `Strict-Transport-Security: max-age=31536000; includeSubDomains` (en producción)

---

## 🌐 4. Convenciones Next.js 16+ para BFF

1. **Parámetros Asíncronos:** Todo acceso a `context.params` debe ser resuelto mediante `await params`.
2. **Revalidación de Caché:** `revalidateTag(tag, "default")` requiere 2 argumentos en Next.js 16+.
3. **Anti-Patrón de Fetching Interno:** Los Server Components (`app/**/page.tsx`) NUNCA realizan `fetch()` a rutas `/api` propias. Consumen directamente los servicios o capas de acceso a datos (`lib/db/mysql`, `lib/db/postgres`).

---

## 📋 5. Catálogo de Endpoints de Facturación, Auditoría y Documento Soporte

| Método | Endpoint | Descripción | Formato / Esquema |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/facturas/consolidated` | Lista facturas consolidadas con filtros (`search`, `tipoOperacionId`, `estadoContable`, `medioPagoId`). | Retorna `ApiResponse<FacturaHistorial[]>` |
| `GET` | `/api/facturas/[id]` | Obtiene el detalle completo de una factura con items, retenciones, archivos y libro diario. | Retorna `ApiResponse<Factura>` |
| `PATCH` | `/api/facturas/[id]` | Modifica datos contables, items, retenciones y recalcula el asiento contable balanceado. | Body JSON Zod `facturaUpdateSchema` |
| `DELETE` | `/api/facturas/[id]` | Elimina en cascada la factura, sus items, archivos y asientos del libro diario. | Retorna `ApiResponse<{ message }>` |
| `POST` | `/api/facturas/audit/[id]/approve` | Aprueba la factura auditada en PostgreSQL, la consolida en MariaDB y genera el asiento contable inicial. | Body JSON `{ tipoOperacionId, medioPagoId, observaciones }` |
| `GET` | `/api/facturas/documento-soporte` | Obtiene el siguiente consecutivo interno sugerido (`DS-XXXX`) para compras sin factura electrónica. | Retorna `ApiResponse<{ consecutivoSugerido }>` |
| `POST` | `/api/facturas/documento-soporte` | Registra compras a no obligados a facturar, crea/asocia proveedor informal, actualiza stock y genera asiento contable directo. | Body JSON Zod `documentoSoporteSchema` |

