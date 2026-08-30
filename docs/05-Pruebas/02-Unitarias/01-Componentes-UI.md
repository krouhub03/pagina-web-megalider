# 🎨 01 - Pruebas Unitarias: Componentes de UI

Documentación de los archivos de prueba unitaria correspondientes a componentes de interfaz de usuario ubicados en `tests/unit/components/`.

---

## 🎨 1. Login Page (`tests/unit/components/auth/LoginPage.test.tsx`)

* **Entorno:** `@vitest-environment jsdom`
* **Mocks Aplicados:** `next/navigation` (`useRouter`, `useSearchParams`), `auth.service` (`loginWithCredentials`).
* **Total de Pruebas:** 5 escenarios (✅ Pasaron 5/5)
* **Escenarios Evaluados:**
  1. Renderizado de campos de entrada (email, password), botón de envío y botón de Google OAuth.
  2. Captura y renderizado de mensajes de error devueltos a través de parámetros URL (`?error=...`).
  3. Alternancia interactiva de visibilidad de contraseña (icono Eye / EyeOff).
  4. Presentación visual de alertas de error tras fallo en credenciales.
  5. Invocación de `router.push(from)` y `router.refresh()` tras login exitoso.

---

## 🎨 2. Register Page (`tests/unit/components/auth/RegisterPage.test.tsx`)

* **Entorno:** `@vitest-environment jsdom`
* **Mocks Aplicados:** `next/navigation` (`useRouter`), `registerUserAction`, Google reCAPTCHA.
* **Total de Pruebas:** 5 escenarios (✅ Pasaron 5/5)
* **Escenarios Evaluados:**
  1. Renderizado de formulario completo (nombre, email, password, confirmación, checkbox de política Ley 1581 y widget reCAPTCHA).
  2. Validación en cliente con alerta de error si se envía el formulario sin aceptar la política de privacidad.
  3. Alerta de validación al intentar registrarse sin resolver la verificación de reCAPTCHA.
  4. Invocación de `registerUserAction` y redirección a `/` tras respuesta exitosa del servidor.
  5. Presentación de errores de servidor (ej. correo duplicado).
