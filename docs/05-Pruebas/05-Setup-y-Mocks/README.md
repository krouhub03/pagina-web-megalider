# 🛠️ 05 - Infraestructura de Pruebas: Setup y Mocks

Este documento describe la configuración global del entorno de pruebas, los stubs de red y datos, y las utilidades de renderizado en `tests/setup/` y `tests/mocks/`.

---

## 🛠️ 1. Archivos de Configuración (`tests/setup/`)

* **`vitest.setup.ts`:**
  - Importación de extensiones DOM: `@testing-library/jest-dom`.
  - Configuración de variables de entorno seguras para pruebas (`NEXTAUTH_SECRET`, `MYSQL_DATABASE_URL`, `POSTGRES_DATABASE_URL`).
  - Limpieza automática de mocks entre pruebas (`afterEach(() => { vi.clearAllMocks(); })`).
* **`test-utils.tsx`:**
  - Wrappers personalizados para renderizar componentes React con proveedores o contextos si es necesario.

---

## 📦 2. Datos Estáticos y Mocks (`tests/mocks/`)

* **`invoice-mock-data.json`:** Payload JSON estático que simula la respuesta de facturas emitidas por Hermes IA (detalles de proveedor, CUFE, IVA, Impoconsumo e ítems).
* **`empty.ts`:** Stub utilitario para reemplazo de archivos de recursos estáticos (imágenes, fuentes, CSS) durante la ejecución de pruebas.
