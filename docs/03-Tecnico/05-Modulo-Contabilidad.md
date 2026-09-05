# 📄 05 - Módulo de Contabilidad y Facturas de Compra

Este documento detalla la arquitectura técnica, modelo de datos, desgloses unitarios, módulo de auditoría tributaria y filtros reactivos del módulo de facturas de compra para la gestión y control tributario de los datos capturados mediante el escáner web de Inteligencia Artificial.

---

## 📄 Especificaciones Técnicas del Módulo

* **Propósito:** Gestión, auditoría de cuadre tributario, corrección y control de facturas de compra procesadas por la IA (desde `/facturas/scan`) y cargadas al sistema.
* **Componentes y Rutas:**
  - `app/(admin)/facturas/page.tsx`: Server Component de entrada que consulta la base de datos (`getFacturas()`) y pasa las facturas iniciales a `FacturasTablaInteractive`.
  - `app/(admin)/facturas/FacturasTablaInteractive.tsx`: Client Component con consumo granular del store Zustand (`useFacturasFiltrosStore`). Incluye resumen KPI, filtro de búsqueda por N° factura/CUFE/NIT, selector rápido de fecha y tabla responsiva.
  - `app/(admin)/facturas/[id]/page.tsx`: Server Component de detalle dinámico (`await params`) con tarjetas KPI de resumen, copiado de CUFE, tabla de productos desglosadas y el **Módulo de Auditoría de Cuadre de Factura**.
  - `components/facturas/ModalEditarFactura.tsx`: Modal para corrección de datos identificativos de la factura.
  - `components/facturas/ModalEditarFacturaItem.tsx`: Modal para crear, editar o eliminar líneas de producto recalculando totales.
  - `components/facturas/BotonEliminarFactura.tsx`: Confirmación de borrado en cascada.
  - `components/facturas/BotonCopiarCufe.tsx`: Copiado interactivo de código CUFE al portapapeles.

---

## 🔍 Módulo de Auditoría de Cuadre de Factura

El módulo de detalle de factura incluye una sección dedicada a la **Auditoría de Cuadre de Factura**, actuando como herramienta de control para identificar automáticamente inconsistencias o discrepancias entre la factura extraída por el escáner de IA y el desglose de sus productos:

| Concepto Auditable | Definición y Verificación |
| :--- | :--- |
| **Unidades Físicas Ingresadas** | Sumatoria total de unidades físicas de mercancía que ingresaron al inventario. |
| **Descuentos Comerciales** | Comparativa entre `descuento_total_factura` (soporta valores negativos en BD) y suma de `descuento_por_producto`. |
| **Subtotal (Sin Impuestos)** | Comparativa de base imponible comercial entre cabecera y suma de líneas. |
| **IVA Descontable** | Comparativa entre `facturas.iva` de cabecera y suma de `factura_items.iva_total`. |
| **Impuesto al Consumo (Impoconsumo)** | Comparativa entre `facturas.impoconsumo` y suma de `factura_items.impuesto_consumo`. |
| **IBUA / Otros Impuestos** | Comparativa de impuestos a bebidas azucaradas, ultraprocesados y otros tributos. |
| **Consistencia Aritmética por Fila** | Verificación producto por producto: `(Cantidad * Costo Base) - Descuento + IVA + Impoconsumo + Otros Imp. == Total Línea`. |
| **TOTAL FACTURA (CON IMPUESTOS)** | Auditoría final del costo total neto entre cabecera oficial y suma de ítems. |

> [!IMPORTANT]
> Si una fila presenta una inconsistencia aritmética ($\ge \$1$), la tabla la resalta automáticamente con **fondo rosa, borde izquierdo rojo, insignia 'Error en Fila'** y muestra el valor matemático esperado junto a un indicador de advertencia `⚠️ Esperado $X`.

---

## 📊 Estructura de Columnas de Productos (Detalle de Factura)

1. **`#`**: Consecutivo de posición de la línea.
2. **`Código Barras`**: Columna dedicada exclusivamente al código EAN/PLU con icono de código de barras (`Barcode`).
3. **`Ref. Proveedor`**: Columna dedicada a la referencia interna del proveedor.
4. **`Descripción Producto`**: Nombre comercial del producto.
5. **`Cantidad`**: Unidades ingresadas y unidad de medida (ej. `24 cjs`).
6. **`Costo Unit. Base`**: Precio de compra unitario antes de impuestos y descuentos.
7. **`Desc. Unit.`**: Descuento promocional otorgado por unidad individual.
8. **`Impuesto Unit. (IVA+Impo)`**: Suma total de impuestos cargados por unidad individual.
9. **`Total Unit. (c/Imp)`**: Costo neto final por unidad con impuestos y descuentos incluidos (base para fijar precio de venta al público).
10. **`Desc. Total`**: Descuento total del lote.
11. **`Subtotal (Sin Impuestos)`**: Base imponible del lote (`Cantidad * Costo Base - Descuento`).
12. **`IVA (%)`**: Valor en pesos y porcentaje tarifario (`19%`, `5%` o `0% Exento`).
13. **`Impoconsumo`**: Impuesto al consumo en pesos por producto.
14. **`Otros Imp.`**: Impuestos adicionales (IBUA/IPCU).
15. **`Total Línea`**: Costo total final de la línea.

---

## ⚙️ Servicios y Sincronización en BD (`services/contabilidad.service.ts`)

- `getFacturas()` & `getFacturaDetalle(facturaId)`: Consultas ORM con relaciones (`proveedor`, `items`).
- `actualizarFactura(facturaId, datos)`: Edición de metadatos de la factura.
- `eliminarFactura(facturaId)`: Eliminación de factura con borrado en cascada en PostgreSQL.
- `recalcularTotalesFactura(facturaId)`: Función ejecutada tras cada mutación para actualizar en tiempo real los campos `subtotal`, `iva`, `impoconsumo`, `otros_impuestos_total`, `descuento_total_factura` y `total_factura` en PostgreSQL.
- `actualizarFacturaItem()`, `crearFacturaItem()`, `eliminarFacturaItem()`: Gestión de líneas de producto sincronizadas.

---

## 📱 Adaptabilidad y Estado Global (Zustand)

* **Store de Filtros (`lib/stores/use-facturas-filtros-store.ts`)**: Mantiene en estado global la búsqueda por texto (`busqueda`), el tipo de filtro de fecha (`fechaFiltro`: `todas`, `hoy`, `ayer`, `7dias`, `este_mes`, `personalizado`) y el rango de fechas (`fechaInicio`, `fechaFin`).
* **Filtrado por Fecha de Registro**: El filtrado por fecha opera sobre el campo de registro en el sistema (`creado_en`).
* **Responsividad UI**: La tabla interactiva implementa `whitespace-nowrap` en fechas y `min-w-[1000px]` con scroll horizontal interno para garantizar excelente legibilidad en dispositivos móviles, tablets y monitores de escritorio.
