# 05 - Registro de Casos de Prueba y Resultados

Este directorio contiene los planes de prueba, matrices de validación automatizadas y los resultados de las pruebas unitarias y de integración realizadas sobre el sistema de **Cigarrería Megalider**.

---

## 🧪 1. Matriz General de Casos de Prueba (Integración y Sistema)

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

## ⚡ 2. Matriz de Pruebas Unitarias Automatizadas (Vitest + Testing Library)

Las pruebas unitarias automatizadas se ejecutan con el runner **Vitest** y **React Testing Library** en entornos aislados (`node` y `jsdom`).

| Suite de Prueba | Archivo de Prueba | Escenarios Evaluados | Total Tests | Estado |
| :--- | :--- | :--- | :---: | :---: |
| **Servicio de Autenticación** | `tests/unit/services/auth.service.test.ts` | • Validación de campos requeridos vacíos en login y registro.<br>• Usuario inexistente / no registrado.<br>• Cuenta inactiva.<br>• Cuenta registrada únicamente con Google (sin hash de contraseña).<br>• Validación de contraseña incorrecta con `bcrypt`.<br>• Login exitoso con emisión de JWT y cookie HttpOnly `auth_token`.<br>• Longitud mínima de nombre y contraseña (>= 8 caracteres).<br>• Validación de formato de correo electrónico.<br>• Coincidencia entre contraseña y confirmación.<br>• Aceptación obligatoria de políticas de tratamiento de datos (Ley 1581).<br>• Validación de token reCAPTCHA.<br>• Prevención de registro con correo duplicado.<br>• Registro exitoso con inserción de rol `CLIENTE` en MySQL. | 14 | ✅ PASÓ |
| **Componente de UI: Login** | `tests/unit/components/auth/LoginPage.test.tsx` | • Renderizado de campos (email, password), botones y Google OAuth.<br>• Captura y renderizado de errores provenientes de parámetros URL (`google_access_denied`, etc.).<br>• Alternancia de visibilidad de contraseña (Eye / EyeOff).<br>• Renderizado de alertas de error devueltas por `loginWithCredentials`.<br>• Redirección a la URL de origen (`from`) y refresco de ruta (`router.push`, `router.refresh`). | 5 | ✅ PASÓ |
| **Componente de UI: Registro** | `tests/unit/components/auth/RegisterPage.test.tsx` | • Renderizado de campos completos y widget de seguridad.<br>• Alerta de validación al enviar formulario sin aceptar políticas de privacidad.<br>• Alerta de validación al enviar sin resolver reCAPTCHA.<br>• Invocación de `registerUserAction` y redirección a `/` tras éxito.<br>• Presentación de mensajes de error devueltos por el servidor. | 5 | ✅ PASÓ |
| **Tokens JWT y Sesiones** | `tests/unit/lib/jwt.test.ts` | • Firma de JWT con algoritmo `HS256` y expiración.<br>• Verificación de firma y decodificación de payload con roles.<br>• Rechazo y retorno `null` ante tokens corruptos o manipulados.<br>• Extracción de sesión activa desde cookies del servidor (`getSession`). | 4 | ✅ PASÓ |
| **Google reCAPTCHA v2** | `tests/unit/lib/recaptcha.test.ts` | • Rechazo ante token vacío con clave configurada.<br>• Validación exitosa ante respuesta `success: true` de Google siteverify.<br>• Manejo de tokens expirados o con error devuelto por la API.<br>• Manejo seguro de fallos de conexión o timeout de red. | 4 | ✅ PASÓ |
| **Utilidades y Formateadores** | `tests/unit/lib/utils.test.ts` | • Fusión de clases Tailwind con resolución de conflictos (`cn`).<br>• Formateo de moneda colombiana `COP` con separador de miles sin decimales.<br>• Manejo de valores `null`, `undefined` y cadenas no numéricas en moneda.<br>• Formateo de fechas para Colombia (`es-CO`) y retorno de raya ante entradas vacías. | 6 | ✅ PASÓ |

**Total de Pruebas Unitarias:** **38 tests (100% pasados en 6 archivos)**

---

## 🚀 3. Ejecución de Pruebas Automatizadas

```bash
# Ejecutar todas las pruebas unitarias una sola vez
npm test

# Ejecutar pruebas en modo observador (Watch Mode)
npm run test:watch

# Ejecutar pruebas y generar reporte de cobertura de código
npm run test:coverage
```

---

## 📊 4. Evidencias de Resultados de Pruebas Unitarias

```text
> pagina-web-megalider@0.1.0 test
> vitest run

 RUN  v4.1.11 C:/Users/BrianKrou/OneDrive/Documentos/PROYECTOS - JBone/Megalider/pagina-web-megalider

 ✓ tests/unit/lib/utils.test.ts (6 tests)
 ✓ tests/unit/lib/jwt.test.ts (4 tests)
 ✓ tests/unit/lib/recaptcha.test.ts (4 tests)
 ✓ tests/unit/services/auth.service.test.ts (14 tests)
 ✓ tests/unit/components/auth/LoginPage.test.tsx (5 tests)
 ✓ tests/unit/components/auth/RegisterPage.test.tsx (5 tests)

 Test Files  6 passed (6)
      Tests  38 passed (38)
   Start at  20:02:20
   Duration  42.47s
```
