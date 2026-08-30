# 📄 05 - Módulo de Contabilidad y Facturas de Compra

Este documento detalla la arquitectura técnica del módulo de facturas de compra y contabilidad para la gestión y auditoría de los datos capturados por Hermes IA.

---

## 📄 Especificaciones Técnicas del Módulo

* **Propósito:** Gestión, auditoría, corrección y control tributario de las facturas de compra procesadas por Hermes IA y cargadas manualmente al sistema.
* **Componentes y Rutas:**
  - `app/(admin)/contabilidad/facturas/page.tsx`: Server Component de entrada que consulta PostgreSQL (`getFacturas()`) y pasa las facturas a `FacturasTablaInteractive`.
  - `app/(admin)/contabilidad/facturas/FacturasTablaInteractive.tsx`: Client Component con consumo granular de `useFacturasFiltrosStore` de Zustand para filtrado reactivo por N° de factura, CUFE, proveedor o NIT.
  - `app/(admin)/contabilidad/facturas/[id]/page.tsx`: Server Component de detalle dinámico (`await params`) con resumen de proveedor/adquiriente, CUFE compacto, recálculo automático de ítems y tabla con `tfoot` pegajoso (*sticky*).
  - `ModalEditarFactura.tsx`: Modal para corrección de datos identificativos de la factura.
  - `ModalEditarFacturaItem.tsx`: Modal para crear, editar o eliminar líneas de producto recalculando el total en tiempo real.
  - `BotonEliminarFactura.tsx`: Confirmación de borrado en cascada.
  - `BotonCopiarCufe.tsx`: Copiado interactivo de código CUFE al portapapeles.

---

## ⚙️ Servicios y Sincronización en BD (`services/contabilidad.service.ts`)

- `getFacturas()` & `getFacturaDetalle(facturaId)`: Consultas ORM con relaciones (`proveedor`, `items`).
- `actualizarFactura(facturaId, datos)`: Edición de metadatos de la factura.
- `eliminarFactura(facturaId)`: Eliminación de factura con borrado en cascada en PostgreSQL.
- `recalcularTotalesFactura(facturaId)`: Función auxiliar ejecutada tras cada mutación de ítems para recalcular y actualizar en tiempo real los campos `subtotal`, `iva`, `impoconsumo`, `otros_impuestos_total` y `total_factura` en PostgreSQL.
- `actualizarFacturaItem()`, `crearFacturaItem()`, `eliminarFacturaItem()`: Gestión de líneas de producto sincronizadas.
