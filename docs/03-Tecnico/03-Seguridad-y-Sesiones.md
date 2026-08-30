# 🔒 03 - Seguridad, Sesiones y Middleware Edge

Este documento detalla la infraestructura de seguridad del sistema, la firma criptográfica de tokens JWT, la protección de cookies HttpOnly y el control de acceso en Edge Middleware.

---

## 🔒 Especificaciones de Seguridad y Sesiones

1. **Tokens JWT:** Se firman utilizando el algoritmo `HS256` mediante la biblioteca estándar `jose` compatible con el runtime Edge de Next.js.
2. **Cookies Seguras:** La cookie `auth_token` se configura con las siguientes banderas de protección:
   - `HttpOnly`: Impide el acceso a la cookie desde scripts del lado del cliente (prevención XSS).
   - `SameSite=Lax`: Previene ataques CSRF en solicitudes entre sitios.
   - `Secure`: Forzada en entornos de producción (HTTPS).
3. **Control RBAC en Edge Middleware:**
   El archivo `middleware.ts` intercepta peticiones a rutas administrativas (`/dashboard`, `/contabilidad/*`) y valida la firma y el rol dentro del token antes de renderizar la página. Si un usuario con rol `CLIENTE` intenta acceder al panel administrativo, es redirigido inmediatamente a `/`.
4. **Protección CSRF en OAuth:**
   Validación estricta del parámetro criptográfico `state` almacenado en la cookie temporal `oauth_state` con un tiempo de vida (*TTL*) de 10 minutos.
