# ⚡ 03 - Capa Integradora BFF y Seguridad API

Este documento especifica la **Capa Backend for Frontend (BFF)** y los mecanismos de seguridad que interconectan al Usuario Externo y al Usuario Interno con los servicios y bases de datos relacionales.

---

## 🏛️ Mapeo de Código (`app/api` & `middleware.ts`)

```text
               ┌──────────────────────────────────────────────────┐
               │    Next.js Edge Middleware (`middleware.ts`)     │
               └────────────────────────┬─────────────────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
┌─────────────────────────┐                               ┌─────────────────────────┐
│ Endpoints Publics / BFF │                               │ Endpoints Autenticados  │
│ - /api/auth/google      │                               │ - /api/auth/google/cb   │
│ - /api/analytics        │                               │ - Server Actions        │
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
   - Redirige al consent screen de Google.
2. **`GET /api/auth/google/callback`:**
   - Comprueba el parámetro `state` recibido contra la cookie `oauth_state`.
   - Canjea el `code` por el `access_token` de Google.
   - Sincroniza la información del perfil en MySQL (`usuarios`).
   - Asigna el rol `CLIENTE` a usuarios nuevos.
   - Firma el token JWT (`jose` HS256) y setea la cookie HttpOnly `auth_token`.
   - Redirige según el rol (Clientes a `/`, Staff a `/dashboard`).

---

## 🛡️ 2. Control RBAC en Edge Middleware (`middleware.ts`)

- **Rutas Protegidas:** Rutas pertenecientes al dominio interno (`/dashboard`, `/contabilidad/*`, `/usuarios`, `/catalogo`).
- **Verificación en Edge:** Decodifica y verifica la firma del token JWT en la cookie `auth_token`.
- **Regla de Bloqueo:** Si el token no existe, está manipulado o su rol es `CLIENTE`, aborta la navegación administrativa y redirige al inicio (`/` o `/login`).

---

## 🔒 3. Seguridad en Handlers y Prevención de Vulnerabilidades

- **Open Redirect Protection:** Verificación estricta de dominios de destino (`destination.origin === request.nextUrl.origin`).
- **Data Access Layer (DAL):** Encapsulación de secretos y funciones criptográficas con la directiva `import 'server-only'` en `lib/auth/jwt.ts`.
- **Negociación de Contenido:** Encabezados HTTP `Vary: Accept` y respuestas JSON/XML tipadas.
