# 🔴 02 - Dominio Usuario Interno (Staff y Administración)

Este documento detalla las funcionalidades, herramientas contables, interfaces de administración y controles de seguridad orientados al **Usuario Interno** (Superadministrador, Administrador y Cajero).

---

## 🏛️ Mapeo de Código e Interfaces (`app/(admin)`)

| Ruta URL | Componente / Código | Propósito para el Usuario Interno |
| :--- | :--- | :--- |
| `/dashboard` | `app/(admin)/dashboard/page.tsx` | **Resumen Ejecutivo (KPIs):** Indicadores clave de desempeño financiero ($670.178 en compras del mes, $158.800 en egresos operativos), gráfica de balance y accesos directos. |
| `/facturas` | `app/(admin)/facturas/page.tsx` | **Gestión Consolidada de Facturas:** Listado centralizado de facturas financieras guardadas en MySQL y vinculadas a proveedores. |
| `/facturas/[id]` | `app/(admin)/facturas/[id]/page.tsx` | **Detalle Financiero de Factura:** Vista completa de emisor/receptor, ítems, desglose de montos y totales acumulados. |
| `/facturas/scan` | `app/(admin)/facturas/scan/page.tsx` | **Escáner Web Directo de IA:** Captura de fotos en pantalla, censura de datos sensibles (privacidad) y extracción inmediata mediante IA. |
| `/facturas/audit` | `app/(admin)/facturas/audit/page.tsx` | **Bandeja de Auditoría Inteligente (PostgreSQL):** Revisión y corrección de facturas procesadas temporalmente por el escáner de IA. |
| `/contabilidad/gastos` | `app/(admin)/contabilidad/gastos/page.tsx` | **Egresos de Caja y Auditoría:** Supervisión de gastos menores de la tienda y registro de auditoría (`historial_correcciones`). |
| `/catalogo` | `app/(admin)/catalogo/page.tsx` | **Gestión de Productos:** Inventario interno, edición de precios de compra/venta y stock mínimo. |
| `/usuarios` | `app/(admin)/usuarios/page.tsx` | **Administración de Personal:** Creación de usuarios y asignación de roles (`SUPERADMIN`, `ADMIN`, `CAJERO`). |

---

## 🛠️ Herramientas de Corrección y Auditoría Contable

1. **Bandeja de Auditoría Inteligente (`facturas_auditoria`):** Validación cruzada para asegurar que el escaneo de IA no contenga errores matemáticos o tributarios antes de pasar a inventario.
2. **Edición de Facturas y Líneas de Producto (`components/facturas/`):** Herramientas para corregir los metadatos de las facturas ingresadas o ajustar manualmente los ítems y precios.
3. **Modal de Borrado en Cascada:** Confirmación modal para borrar facturas obsoletas e ítems dependientes.
4. **Historial de Correcciones Manuales (`historial_correcciones`):** Guardado automático del valor previo, valor nuevo, usuario responsable y justificación ante cualquier cambio en datos extraídos por la IA.

---

## 🛡️ Roles y Jerarquía del Personal (RBAC)

* **`SUPERADMIN`:** Acceso ilimitado, gestión de usuarios, eliminación de facturas y configuración del sistema.
* **`ADMIN`:** Gestión contable, edición de facturas/egresos, consulta de logs y control de catálogo.
* **`CAJERO`:** Consulta de métricas del día, registro de egresos menores de caja (sin permisos de eliminación masiva ni administración de usuarios).
