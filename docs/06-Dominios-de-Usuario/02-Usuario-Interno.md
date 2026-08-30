# 🔴 02 - Dominio Usuario Interno (Staff y Administración)

Este documento detalla las funcionalidades, herramientas contables, interfaces de administración y controles de seguridad orientados al **Usuario Interno** (Superadministrador, Administrador y Cajero).

---

## 🏛️ Mapeo de Código e Interfaces (`app/(admin)`)

| Ruta URL | Componente / Código | Propósito para el Usuario Interno |
| :--- | :--- | :--- |
| `/dashboard` | `app/(admin)/dashboard/page.tsx` | **Resumen Ejecutivo (KPIs):** Indicadores clave de desempeño financiero ($670.178 en compras del mes, $158.800 en egresos operativos), gráfica de balance y accesos directos. |
| `/contabilidad/facturas` | `app/(admin)/contabilidad/facturas/page.tsx` | **Gestión de Compras (Hermes IA):** Listado interactivo de facturas registradas automáticamente por el bot o cargadas manualmente desde PostgreSQL. |
| `/contabilidad/facturas/[id]` | `app/(admin)/contabilidad/facturas/[id]/page.tsx` | **Detalle e Inspección Tributaria:** Vista completa de emisor/receptor, CUFE compacto con botón de copia, ítems y tabla con `tfoot` pegajoso (*sticky*). |
| `/contabilidad/gastos` | `app/(admin)/contabilidad/gastos/page.tsx` | **Egresos de Caja y Auditoría:** Supervisión de gastos menores de la tienda y registro de auditoría (`historial_correcciones`). |
| `/catalogo` | `app/(admin)/catalogo/page.tsx` | **Gestión de Productos:** Inventario interno, edición de precios de compra/venta y stock mínimo. |
| `/usuarios` | `app/(admin)/usuarios/page.tsx` | **Administración de Personal:** Creación de usuarios y asignación de roles (`SUPERADMIN`, `ADMIN`, `CAJERO`). |
| `/hermes-logs` | `app/(admin)/hermes-logs/page.tsx` | **Auditoría de IA:** Registro de logs de procesamiento de facturas PDF/XML por Hermes Bot. |

---

## 🛠️ Herramientas de Corrección y Auditoría Contable

1. **Modal de Edición de Facturas (`ModalEditarFactura.tsx`):** Corrección de metadatos (N° de factura, fecha, proveedor, CUFE).
2. **Modal de Edición de Ítems (`ModalEditarFacturaItem.tsx`):** Creación, modificación o borrado de líneas de producto con **recálculo en tiempo real en PostgreSQL** (`recalcularTotalesFactura`).
3. **Modal de Borrado en Cascada (`BotonEliminarFactura.tsx`):** Confirmación modal para borrar facturas obsoletas e ítems dependientes.
4. **Historial de Correcciones Manuales (`historial_correcciones`):** Guardado automático del valor previo, valor nuevo, usuario responsable y justificación ante cualquier cambio en datos de Hermes IA.

---

## 🛡️ Roles y Jerarquía del Personal (RBAC)

* **`SUPERADMIN`:** Acceso ilimitado, gestión de usuarios, eliminación de facturas y configuración del sistema.
* **`ADMIN`:** Gestión contable, edición de facturas/egresos, consulta de logs y control de catálogo.
* **`CAJERO`:** Consulta de métricas del día, registro de egresos menores de caja (sin permisos de eliminación masiva ni administración de usuarios).
