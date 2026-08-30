# 🚀 06 - Ejecución de Pruebas y Evidencias de Cobertura

Este documento detalla los comandos oficiales para ejecutar la suite de pruebas automatizadas y presenta los reportes y evidencias de ejecución.

---

## 🚀 1. Comandos de NPM

```bash
# Ejecutar todas las pruebas unitarias una sola vez (CI/CD)
npm test

# Ejecutar pruebas en modo observador interactivo (Watch Mode)
npm run test:watch

# Ejecutar pruebas y generar reporte de cobertura de código
npm run test:coverage
```

---

## 📊 2. Evidencia de Ejecución Real (Vitest)

```text
> pagina-web-megalider@0.1.0 test
> vitest run

 RUN  v4.1.11 C:/Users/BrianKrou/OneDrive/Documentos/PROYECTOS - JBone/Megalider/pagina-web-megalider

 ✓ tests/unit/stores/use-age-verification-store.test.ts
 ✓ tests/unit/stores/use-audit-modal-store.test.ts
 ✓ tests/unit/stores/use-cart-store.test.ts
 ✓ tests/unit/stores/use-filter-store.test.ts
 ✓ tests/unit/stores/use-quickview-store.test.ts
 ✓ tests/unit/stores/use-toast-store.test.ts
 ✓ tests/unit/lib/utils.test.ts
 ✓ tests/unit/lib/jwt.test.ts
 ✓ tests/unit/lib/recaptcha.test.ts
 ✓ tests/unit/services/auth.service.test.ts
 ✓ tests/unit/components/auth/LoginPage.test.tsx
 ✓ tests/unit/components/auth/RegisterPage.test.tsx

 Test Files  12 passed (12)
      Tests  64 passed (64)
   Start at  23:01:41
   Duration  74.28s
```

* **Resumen General:** 12 archivos de prueba procesados, **64/64 pruebas pasadas exitosamente (100% efectividad)**.
