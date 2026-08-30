# ⚡ 03 - Capa Integradora BFF y Seguridad API (Versión 3.0)

Este documento especifica la **Capa Backend for Frontend (BFF)**, la estandarización de respuestas HTTP y los mecanismos de seguridad que interconectan al Usuario Externo y al Usuario Interno con los servicios y bases de datos relacionales.

---

## 🏛️ Mapeo de Código (`app/api`, `lib/api` & `middleware.ts`)

```text
               ┌──────────────────────────────────────────────────┐
               │    Next.js Edge Middleware (`middleware.ts`)     │
               │  - Security Headers (CSP, HSTS, X-Frame-Options)  │
               │  - RBAC Check (jose JWT)                         │
               └────────────────────────┬─────────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌─────────────────────────┐                               ┌─────────────────────────┐
│ Endpoints Públicos / BFF│                               │ Endpoints Autenticados  │
│ - /api/auth/google      │                               │ - /api/auth/google/cb   │
│ - /api/analytics        │                               │ - /api/webhooks/revalid.│
│ - /api/openapi          │                               │ - Server Actions        │
└────────────┬────────────┘                               └────────────┬────────────┘
             │                                                         │
             ▼                                                         ▼
   MySQL (Catálogo / Users)                                  PostgreSQL (cmegalider)
```

---

## 🌐 1. Autenticación Federada Google OAuth 2.0 (`/api/auth/google/*`)

1. **`GET /api/auth/google`:**
   - Genera un token criptográfico anti-CSRF (`state`).
   - Setea la cookie temporal `oauth_state` (TTL: 10 min).
   - Sanitiza el parámetro de retorno (`from`) usando `validateRedirectUri`.
   - Redirige al consent screen de Google.
2. **`GET /api/auth/google/callback`:**
   - Comprueba el parámetro `state` recibido contra la cookie `oauth_state`.
   - Canjea el `code` por el `access_token` de Google.
   - Sincroniza la información del perfil en MySQL (`usuarios`).
   - Asigna el rol `CLIENTE` a usuarios nuevos.
   - Firma el token JWT (`jose` HS256) y setea la cookie HttpOnly `auth_token`.
   - Redirige según el rol (Clientes a `/`, Staff a `/dashboard`) con protección anti Open Redirect.

---

## 🛡️ 2. Control RBAC en Edge Middleware (`middleware.ts`)

- **Rutas Protegidas:** Rutas pertenecientes al dominio interno (`/dashboard`, `/admin`, `/contabilidad/*`, `/hermes-logs/*`, `/catalogo/*`, `/usuarios/*`).
- **Verificación en Edge:** Decodifica y verifica la firma del token JWT en la cookie `auth_token`.
- **Regla de Bloqueo:** Si el token no existe, está manipulado o su rol es `CLIENTE`, aborta la navegación administrativa y redirige al inicio (`/` o `/login`).
- **Inyección de Security Headers:** Aplica `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` y `HSTS` en producción.

---

## 🔒 3. Seguridad en Handlers y Prevención de Vulnerabilidades (API v3.0)

- **Contrato Unificado `ApiResponse<T>` (`lib/api/response.ts`):** Estructura normalizada con `apiSuccess` y `apiError` para evitar fugas de información.
- **Validación de Payloads Zod (`lib/api/validation.ts`):** `parseJSONBody` para garantizar `Content-Type: application/json` y validación de esquemas Zod con errores `VALIDATION_ERROR` (HTTP 400).
- **Protección Timing Attack (`lib/api/security.ts`):** `validateRevalidateToken` con `crypto.timingSafeEqual` para tokens de revalidación.
- **Auditoría de Eventos (`lib/api/audit.ts`):** `logWebhookEvent` para trazabilidad de revalidación e intentos de acceso.
- **Data Access Layer (DAL):** Encapsulación de secretos y funciones criptográficas con la directiva `import 'server-only'` en `lib/auth/jwt.ts`.
