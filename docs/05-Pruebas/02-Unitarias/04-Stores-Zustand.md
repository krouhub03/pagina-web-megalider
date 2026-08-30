# 🛒 04 - Pruebas Unitarias: Stores de Zustand

Documentación de los 6 archivos de prueba unitaria correspondientes a la gestión de estado global cliente ubicados en `tests/unit/stores/`.

---

## 🛒 Matriz de Pruebas de Stores Zustand

| Archivo de Prueba | Store Evaluado | Escenarios Evaluados | Tests | Estado |
| :--- | :--- | :--- | :---: | :---: |
| `use-age-verification-store.test.ts` | Verificación de Edad | Estado inicial, confirmación de mayoría de edad y persistencia. | 4 | ✅ PASÓ |
| `use-audit-modal-store.test.ts` | Modal de Auditoría | Apertura, cierre y transferencia de payload de facturación. | 4 | ✅ PASÓ |
| `use-cart-store.test.ts` | Carrito de Compras | Adición, eliminación, actualización de cantidades y recálculo de total. | 6 | ✅ PASÓ |
| `use-filter-store.test.ts` | Filtros de Productos | Categorías, rango de precios, ordenamiento y búsqueda reactiva. | 6 | ✅ PASÓ |
| `use-quickview-store.test.ts` | Vista Rápida | Selección de producto y visibilidad del modal de vista previa. | 4 | ✅ PASÓ |
| `use-toast-store.test.ts` | Notificaciones Toast | Emisión de alertas (éxito, error, info) con temporizador de auto-cierre. | 4 | ✅ PASÓ |

* **Total de Pruebas en Stores:** **28 tests (100% pasados en 6 archivos)**
