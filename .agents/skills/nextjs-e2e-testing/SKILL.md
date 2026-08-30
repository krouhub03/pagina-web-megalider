---
name: nextjs-e2e-testing
description: Guía experta y directivas para diseño, implementación y ejecución de pruebas End-to-End (E2E) con Playwright en Next.js 16+ (App Router), simulando navegación de navegador, flujos de autenticación, control de acceso RBAC e interacciones UI para el proyecto Cigarrería Megalider.
---

# Guía de Pruebas End-to-End (E2E) para Next.js 16+ y Cigarrería Megalider

Directivas de ingeniería y patrones canónicos para automatizar y ejecutar pruebas de extremo a extremo (*End-to-End*) utilizando **Playwright** sobre el proyecto **Cigarrería Megalider**.

---

## 1. Propósito y Alcance de las Pruebas E2E

Las pruebas E2E evalúan la aplicación completa ejecutándose en un navegador web real (Chromium, Firefox, WebKit), validando que todos los componentes (UI, Middleware, Server Actions, Route Handlers y Bases de Datos) funcionen armónicamente desde la perspectiva del usuario final.

```text
[Navegador Playwright] ──(HTTP/DOM)──> [Next.js App Server (Node.js/Edge)] ──> [Bases de Datos PostgreSQL & MySQL]
```

---

## 2. Escenarios Críticos a Evaluar

1. **Flujo de Onboarding de Cliente Externo (`app/(public)` & `app/(auth)`):**
   - Navegación a `/register`.
   - Diligenciamiento de campos de formulario.
   - Activación de checkbox de privacidad (Ley 1581).
   - Resolución de Google reCAPTCHA.
   - Creación de usuario y redirección inmediata a la página de inicio (`/`).
2. **Flujo de Acceso Administrativo (`app/(auth)` & `app/(admin)`):**
   - Inicio de sesión con credenciales de Administrador en `/login`.
   - Generación de cookie `auth_token`.
   - Redirección automática a `/dashboard`.
   - Navegación e interacción en `/contabilidad/facturas`.
3. **Validación de Seguridad RBAC:**
   - Inicio de sesión con cuenta de rol `CLIENTE`.
   - Intento directo de navegación a `/dashboard` o `/contabilidad/facturas`.
   - Verificación del bloqueo por **Edge Middleware** y redirección forzada a `/`.
4. **Interacción con Modales de Contabilidad:**
   - Apertura de modal de edición de ítems de factura (`ModalEditarFacturaItem.tsx`).
   - Modificación de cantidades y costos unitarios.
   - Verificación de actualización reactiva en la tabla de totales `tfoot`.

---

## 3. Configuración Estándar de Playwright (`playwright.config.ts`)

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 4. Ejemplos Canónicos de Pruebas E2E

### A. Prueba de Control de Acceso RBAC
```ts
// tests/e2e/rbac-protection.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Protección de Rutas RBAC', () => {
  test('debe bloquear el acceso a /dashboard para usuarios no autenticados', async ({ page }) => {
    await page.goto('/dashboard');
    // Debe redirigir al portal de login con parámetro from
    await expect(page).toHaveURL(/\/login\?from=%2Fdashboard/);
  });

  test('debe restringir el acceso a /dashboard a un usuario con rol CLIENTE', async ({ page }) => {
    // Simular inyección de cookie de usuario CLIENTE
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'mock_jwt_token_cliente_role',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/dashboard');
    // Middleware debe redirigir a la landing pública
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});
```

---

## 5. Reglas de Oro para Pruebas E2E

1. **Locators Accesibles:** Priorizar selectores basados en el rol accesible y texto (`page.getByRole('button', { name: /guardar/i })`) sobre selectores CSS frágiles.
2. **Independencia de Estado:** Limpiar cookies y `localStorage` entre pruebas mediante `test.beforeEach`.
3. **Captura de Evidencias:** Grabar trazas, capturas de pantalla y videos únicamente en caso de fallo para optimizar la velocidad en CI/CD.
