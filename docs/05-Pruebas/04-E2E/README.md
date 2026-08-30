# 🎭 04 - Pruebas End-to-End (E2E)

Este directorio especifica la arquitectura, herramientas y escenarios de prueba de extremo a extremo (*End-to-End*) para la plataforma **Cigarrería Megalider**.

---

## 🎭 Herramientas y Framework

* **Framework E2E:** **Playwright**
* **Ubicación en el Repositorio:** `tests/e2e/`
* **Navegadores Soportados:** Chromium, Firefox, WebKit, Mobile Chrome.

---

## 📋 Escenarios E2E Principales

1. **Flujo Completo de Onboarding de Cliente:**
   - Navegación a `/register` -> Diligenciamiento de datos -> Aceptación de Políticas (Ley 1581) -> Verificación de reCAPTCHA -> Creación de usuario -> Redirección automática a la tienda pública (`/`).

2. **Flujo de Acceso Administrativo (Staff):**
   - Acceso a `/login` -> Ingreso de credenciales de Administrador -> Emisión de cookie HttpOnly `auth_token` -> Redirección a `/dashboard` -> Navegación por `/contabilidad/facturas`.

3. **Restricción de Acceso por Roles (RBAC):**
   - Autenticación como usuario `CLIENTE` -> Intento directo de navegación a `/dashboard` -> Intercepción por Middleware Edge -> Redirección forzada a `/`.

4. **Operación en Módulo de Facturas:**
   - Navegación a `/contabilidad/facturas/[id]` -> Apertura de modal de edición de ítem -> Modificación de cantidad -> Recálculo automático en PostgreSQL -> Actualización de tabla `tfoot` -> Confirmación visual.
