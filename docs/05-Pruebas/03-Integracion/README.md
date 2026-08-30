# 🌐 03 - Pruebas de Integración

Este directorio define la arquitectura y los lineamientos para ejecutar **pruebas de integración** en el sistema Cigarrería Megalider.

---

## 🌐 Enfoque de Pruebas de Integración

Las pruebas de integración evalúan el funcionamiento coordinado entre múltiples capas de software:

1. **Route Handlers BFF (`app/api/**/route.ts`):**
   - Verificación de respuestas HTTP (status 200, 400, 401, 403, 500).
   - Negociación de contenido (`Vary: Accept`).
   - Validación de esquema de payloads en peticiones `POST` / `PUT`.

2. **Integración Multi-Base de Datos:**
   - Consultas sincrónicas entre PostgreSQL (Hermes IA / Contabilidad) y MySQL (Usuarios y Catálogo) con Drizzle ORM.
   - Verificación de transacciones y operaciones en cascada (ej. borrado de facturas e ítems).

3. **Flujos de Autenticación Federada:**
   - Intercepción de callback OAuth 2.0 de Google (`/api/auth/google/callback`).
   - Verificación del parámetro `state` anti-CSRF y emisión de cookies `auth_token`.

---

## 📁 Directorio Físico
* **Ubicación en el Repositorio:** `tests/integration/`
