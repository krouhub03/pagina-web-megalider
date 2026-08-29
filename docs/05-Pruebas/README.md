# 05 - Registro de Casos de Prueba y Resultados

Este directorio contiene los planes de prueba, matrices de validación y los resultados de las pruebas realizadas sobre el sistema de **Cigarrería Megalider**.

---

## 🧪 1. Matriz de Casos de Prueba

| ID | Caso de Prueba | Módulo | Procedimiento | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-01** | Conexión a PostgreSQL (Hermes) | Base de Datos | Ejecutar consulta a `cmegalider`. | Respuesta exitosa con conteo de facturas y egresos. | ✅ PASÓ |
| **CP-02** | Conexión a MySQL (Usuarios) | Base de Datos | Ejecutar consulta a `u200862310_megalider`. | Validación de tabla `usuarios` y roles (`SUPERADMIN`, `ADMIN`, `CAJERO`, `CLIENTE`). | ✅ PASÓ |
| **CP-03** | Login con Credenciales Válidas | Autenticación | Enviar `admin@megalider.com` y clave correcta. | Emisión de cookie `auth_token` y redirección a `/dashboard`. | ✅ PASÓ |
| **CP-04** | Login con Contraseña Inválida | Autenticación | Enviar contraseña incorrecta. | Mensaje de error "Credenciales inválidas" sin generar cookie. | ✅ PASÓ |
| **CP-05** | Protección de Rutas (Middleware) | Seguridad | Acceder a `/dashboard` sin cookie de sesión. | Redirección inmediata a `/login?from=/dashboard`. | ✅ PASÓ |
| **CP-06** | Acceso a /login estando autenticado | Seguridad | Acceder a `/login` con cookie válida. | Redirección automática según rol (`/dashboard` para Staff, `/` para Clientes). | ✅ PASÓ |
| **CP-07** | Cierre de Sesión (Logout) | Autenticación | Clic en el botón Logout del Header. | Eliminación de cookie `auth_token` y redirección a `/login`. | ✅ PASÓ |
| **CP-08** | Inicio de Sesión con Google OAuth 2.0 | Autenticación | Clic en "Continuar con Google". | Generación de cookie anti-CSRF `oauth_state` y redirección a `accounts.google.com`. | ✅ PASÓ |
| **CP-09** | Auto-registro y Enrutamiento de Clientes Google | Seguridad / RBAC | Usuario nuevo de Google completa autenticación. | Inserción en MySQL con rol `CLIENTE` y redirección forzada a `/`. | ✅ PASÓ |
| **CP-10** | Restricción RBAC para Rol CLIENTE | Seguridad / Edge | Usuario con rol `CLIENTE` intenta acceder a `/dashboard` o `/contabilidad`. | Middleware bloquea acceso y redirige a `/`. | ✅ PASÓ |
| **CP-11** | Consulta de Métricas y Facturas | Contabilidad | Cargar la vista `/dashboard` y `/contabilidad/facturas`. | Muestra datos reales ($670.178 en compras, $158.800 en egresos). | ✅ PASÓ |
| **CP-12** | Compilación de Producción & Tipos | Build | Ejecutar `npm run build` o `tsc --noEmit`. | Compilación limpia de Next.js 16 con 0 errores TypeScript. | ✅ PASÓ |
| **CP-13** | Seguridad en Handlers BFF | BFF / API | Enviar petición con redirección externa maliciosa a `/api/auth/google/callback`. | Bloqueo por validación de origen (`destination.origin !== origin`) retornando HTTP 400. | ✅ PASÓ |
| **CP-14** | Lazy Loading de Recursos Pesados | Rendimiento | Inspeccionar carga de iframe en `LocationSection` y recursos gráficos. | Carga diferida con atributo `loading="lazy"` sin penalizar el FCP inicial. | ✅ PASÓ |
| **CP-15** | Validación de Paleta e Identidad | Diseño / UI | Inspeccionar tokens CSS y clases Tailwind en `app/globals.css`. | Cumplimiento del 100% de los códigos hex oficiales (`#067335`, `#038C3E`, `#53A677`, `#A7D9BD`, `#F2F2F2`). | ✅ PASÓ |
| **CP-16** | Registro de Cliente y Políticas de Datos | Autenticación | Enviar formulario en `/register` con políticas aceptadas y contraseñas válidas. | Inserción en MySQL con rol `CLIENTE`, emisión de JWT y redirección a `/`. | ✅ PASÓ |
| **CP-17** | Verificación de Google reCAPTCHA v2 | Seguridad | Enviar formulario de registro con token de reCAPTCHA. | Validación del token con Google siteverify y bloqueo si el token es nulo o inválido. | ✅ PASÓ |
| **CP-18** | Prevención de Correo Duplicado | Autenticación | Intentar registrar un correo electrónico ya existente en la base de datos. | Mensaje de error claro "Ya existe una cuenta registrada con este correo" sin duplicar filas. | ✅ PASÓ |

---

## 📊 2. Evidencias de Resultados de Pruebas

### Prueba CP-08, CP-09 y CP-10 (Google OAuth 2.0 y Control RBAC):
```text
✓ Endpoint /api/auth/google genera cookie HttpOnly oauth_state con TTL 10m
✓ Endpoint /api/auth/google/callback valida state anti-CSRF con éxito
✓ Sincronización en MySQL asigna rol "CLIENTE" a usuarios nuevos por defecto
✓ Middleware en Edge valida payload.rol del JWT:
  - Si rol === "CLIENTE" en ruta protegida -> Redirección inmediata a "/"
  - Si rol in ["SUPERADMIN", "ADMIN", "CAJERO"] -> Acceso permitido a "/dashboard"
```

### Prueba CP-01 y CP-11 (Lectura en vivo de PostgreSQL Hermes):
```text
✓ Base de datos: cmegalider
✓ Total Compras: $670.178 COP (1 factura con 30 items)
✓ Total Egresos: $158.800 COP (4 egresos registrados por Hermes Bot)
✓ Historial de correcciones: 2 modificaciones previas detectadas
```

### Prueba CP-03 (Autenticación MySQL + JWT):
```text
✓ Usuario verificado: admin@megalider.com (Rol: SUPERADMIN)
✓ Hash bcrypt validado correctamente
✓ Token JWT generado y guardado en cookie HttpOnly "auth_token"
```

### Prueba CP-12 (Next.js TypeScript Validation):
```text
▲ Next.js 16.3.3
✓ TypeScript validation passed (0 errors)
✓ 100% routes generated (Static / Dynamic)
```
