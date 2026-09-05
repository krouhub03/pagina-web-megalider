# 🔴 02 - Dominio Usuario Interno (Staff y Administración)

Este documento detalla las funcionalidades, herramientas contables, interfaces de administración y controles de seguridad orientados al **Usuario Interno** (Superadministrador, Administrador y Cajero).

---

## 🏛️ Mapeo de Código e Interfaces (`app/(admin)`)

| Ruta URL | Componente / Código | Propósito para el Usuario Interno |
| :--- | :--- | :--- |
| `/dashboard` | `app/(admin)/dashboard/page.tsx` | **Resumen Ejecutivo (KPIs):** Indicadores clave de desempeño financiero ($670.178 en compras del mes, $158.800 en egresos operativos), gráfica de balance y accesos directos. |
| `/facturas` | `app/(admin)/facturas/page.tsx` | **Gestión Consolidada de Facturas:** Listado centralizado de facturas financieras guardadas en MySQL y vinculadas a proveedores. |
| `/facturas/history` | `app/(admin)/facturas/history/page.tsx` | **Historial Consolidado de Facturas y Compras:** Listado inmutable de compras con KPIs contables, filtros reactivos (por Estado Contable, Tipo de Operación y Medio de Pago) y 4 acciones dedicadas: Ver, Conciliar, Editar y Eliminar. |
| `/facturas/[id]` | `app/(admin)/facturas/[id]/page.tsx` | **Detalle Financiero de Factura:** Vista completa de emisor/receptor, ítems, desglose de montos y totales acumulados. |
| `/facturas/scan` | `app/(admin)/facturas/scan/page.tsx` | **Escáner Web Directo de IA:** Captura de fotos en pantalla, censura de datos sensibles (privacidad) y extracción inmediata mediante IA. |
| `/facturas/audit` | `app/(admin)/facturas/audit/page.tsx` | **Bandeja de Auditoría Inteligente (PostgreSQL):** Revisión y corrección de facturas procesadas temporalmente por el escáner de IA. |
| `/contabilidad/puc` | `app/(admin)/contabilidad/puc/page.tsx` | **Plan Único de Cuentas (PUC):** Catálogo contable jerárquico NIIF (Clases 1 a 6) con buscador en tiempo real. |
| `/contabilidad/tesoreria` | `app/(admin)/contabilidad/tesoreria/page.tsx` | **Cuentas de Tesorería:** Administración de Cajas registradoras, Cuentas Bancarias y Billeteras Digitales asociadas al PUC. |
| `/contabilidad/tipos-operacion` | `app/(admin)/contabilidad/tipos-operacion/page.tsx` | **Tipos de Operación Contable:** Configuración de destinos de gasto, compras de mercancía y activos fijos. |
| `/contabilidad/retenciones` | `app/(admin)/contabilidad/retenciones/page.tsx` | **Retenciones en la Fuente:** Configuración de tarifas fiscales (RteFte, ReteIVA, ReteICA). |
| `/contabilidad/gastos` | `app/(admin)/contabilidad/gastos/page.tsx` | **Egresos de Caja y Auditoría:** Supervisión de gastos menores de la tienda y registro de auditoría (`historial_correcciones`). |
| `/catalogo` | `app/(admin)/catalogo/page.tsx` | **Gestión de Productos:** Inventario interno, edición de precios de compra/venta y stock mínimo. |
| `/usuarios` | `app/(admin)/usuarios/page.tsx` | **Administración de Personal:** Creación de usuarios y asignación de roles (`SUPERADMIN`, `ADMIN`, `CAJERO`). |

---

## 🛠️ Herramientas de Corrección, Auditoría y Conciliación Contable

1. **Bandeja de Auditoría Inteligente (`facturas_auditoria`):** Validación cruzada para asegurar que el escaneo de IA no contenga errores matemáticos o tributarios antes de pasar a inventario y migración a MariaDB.
2. **Visor Interactivo de Inspección (`HistoryModal`):** Inspección de documentos digitalizados con soporte multi-página, zoom focalizado en cursor (`onWheel`), arrastre/pan, rotación de 90° y detalle contable de partida doble NIIF.
3. **Modal de Conciliación de Tesorería (`ModalConciliacionFactura`):** Filtrado reactivo por medio de pago macro para asignación ágil de caja/banco (`110505`/`111005`), aplicación de retenciones fiscales y cálculo determinístico balanceado. Permite saldar facturas a crédito registradas previamente en cuenta por pagar (`220505`).
4. **Registro de Compras sin Factura (`ModalDocumentoSoporte`):** Formulario modal accesible desde el historial para registrar adquisiciones directas a comerciantes informales con consecutivo `DS-XXXX`, afectación de inventario y asiento contable directo.
5. **Edición Integral de Facturas (`ModalEditarFacturaHistorial`):** Corrección de metadatos fiscales, proveedor, ítems y recálculo dinámico de IVA (5%, 19%), Impoconsumo y subtotales.
6. **Modal de Borrado en Cascada (`ModalEliminarFactura`):** Confirmación modal para borrar transaccionalmente asientos contables, retenciones, ítems, archivos e invoice en MariaDB.

---

## 🛡️ Roles y Jerarquía del Personal (RBAC)

* **`SUPERADMIN`:** Acceso ilimitado, gestión de usuarios, eliminación de facturas y configuración del sistema.
* **`ADMIN`:** Gestión contable, edición de facturas/egresos, consulta de logs y control de catálogo.
* **`CAJERO`:** Consulta de métricas del día, registro de egresos menores de caja (sin permisos de eliminación masiva ni administración de usuarios).
