---
name: nextjs-system-testing
description: Guía experta y directivas para pruebas de sistema, verificación de matrices de aceptación (CP-01 a CP-22), auditorías de compilación Turbopack, benchmark de Core Web Vitals y cumplimiento de identidad de marca para el proyecto Cigarrería Megalider.
---

# Guía de Pruebas de Sistema y Calidad Global para Next.js 16+ y Cigarrería Megalider

Directivas de ingeniería y criterios de aceptación para verificar la calidad integral, seguridad, rendimiento y adherencia a la marca de **Cigarrería Megalider**.

---

## 1. Alcance de las Pruebas de Sistema

Las pruebas de sistema evalúan el comportamiento global de la aplicación empaquetada en un entorno similar a producción:

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                    VERIFICACIÓN DE SISTEMA                  │
 ├──────────────────────────────┬──────────────────────────────┤
 │ 🧪 Matriz CP-01 a CP-22      │ ⚡ Core Web Vitals & LCP     │
 │ 🛠️ Compilación Turbopack     │ 🎨 Paleta & Marca Megalider  │
 │ 🔒 Seguridad & Open Redirect │ 📊 Cobertura de Código (>80%)│
 └──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Criterios de Aceptación por Área

### A. Auditoría de Compilación de Producción
- **Comando:** `npm run build` o `npx tsc --noEmit`.
- **Criterio:** 0 errores de TypeScript, 0 advertencias de rutas asíncronas no resueltas (`params: Promise`) y compilación exitosa de todas las rutas estáticas y dinámicas.

### B. Matriz de Casos de Prueba del Sistema (CP-01 a CP-22)
- Verificación periódica de la matriz documentada en [`docs/05-Pruebas/01-Sistema/01-Matriz-Casos-de-Prueba.md`](../../docs/05-Pruebas/01-Sistema/01-Matriz-Casos-de-Prueba.md).
- Todos los 22 casos de prueba deben reportar estado **`✅ PASÓ`**.

### C. Rendimiento y Core Web Vitals (RNF-01)
- **Largest Contentful Paint (LCP):** `< 2.5s` en conexión 4G móvil.
- **Cumulative Layout Shift (CLS):** `< 0.1` garantizado mediante `next/image` con dimensiones explícitas y esqueletos de carga en `next/dynamic`.
- **Interaction to Next Paint (INP):** `< 200ms`.

### D. Identidad de Marca y Tokens CSS (RNF-04)
- Verificación de uso de los 5 colores Hex oficiales:
  - Verde Esmeralda: `#067335`
  - Verde Acción CTA: `#038C3E`
  - Verde Medio: `#53A677`
  - Menta Suave: `#A7D9BD`
  - Fondo Claro: `#F2F2F2`
- Tipografías: Títulos en `Playfair Display`, cuerpo en `Plus Jakarta Sans`.

---

## 3. Checklist de Auditoría de Salida (Release Readiness)

- [ ] ¿`npm test` ejecuta los 64/64 tests unitarios de Vitest sin fallos?
- [ ] ¿`npm run build` genera un bundle optimizado sin errores de tipos?
- [ ] ¿El middleware Edge valida y restringe correctamente el acceso a `/dashboard` y `/contabilidad/*` para roles `CLIENTE`?
- [ ] ¿Los endpoints de OAuth 2.0 previenen ataques CSRF mediante verificación del parámetro `state`?
- [ ] ¿Las mutaciones de facturas e ítems ejecutan el recálculo automático de totales en PostgreSQL (`recalcularTotalesFactura`)?
