# 📊 02 - Estado de los Entregables

La siguiente tabla resume el estado actual de avance de cada característica y entregable del proyecto.

---

## 📊 Matriz de Entregables

| Entregable | Módulo / Área | Estado | Observaciones |
| :--- | :--- | :--- | :--- |
| **Landing Pública** | Frontend Público | ✅ Completado | Separado en Navbar, Footer y 4 secciones independientes con botón de acceso activo. |
| **Integración Hermes IA** | Backend Postgres | ✅ Completado | Conexión en tiempo real con facturas, ítems y egresos. |
| **Portal Unificado de Auth** | Seguridad / Auth | ✅ Completado | Login unificado con credenciales y Google OAuth 2.0 integrado con MySQL. |
| **Control de Acceso RBAC** | Seguridad / Edge | ✅ Completado | Separación de roles: Staff (`SUPERADMIN`, `ADMIN`, `CAJERO`) al Dashboard, `CLIENTE` a Inicio (`/`). |
| **Registro de Clientes & reCAPTCHA** | Seguridad / Auth | ✅ Completado | Página `/register` independiente, modal de políticas Ley 1581 y verificación Google reCAPTCHA v2. |
| **Design System UI** | Frontend UI | ✅ Completado | Componentes `Button`, `Input`, `Card`, `Badge` estandarizados. |
| **Skills de IA & Coding Standards** | Ecosistema / Agentes | ✅ Completado | 8 skills implementadas (`nextjs-coding`, `megalider-brand`, `token-optimization`, `nextjs-analytics`, `nextjs-lazy-loading`, `nextjs-bff`, `nextjs-unit-testing`, `nextjs-zustand`). |
| **Auditoría Next.js 16+** | Calidad / Build | ✅ Completado | Compilación Turbopack exitosa (12/12 rutas) y cero errores TypeScript. |
| **Módulo de Contabilidad y Auditoría** | Contabilidad | ✅ Completado | Auditoría de cuadre de factura, consistencia aritmética, desgloses unitarios, filtros por fecha de registro responsivos y modales de edición de ítems. |
| **Historial Consolidado & Visor Multi-modal** | Contabilidad / Facturas | ✅ Completado | 4 acciones dedicadas: Ver (visor con zoom al cursor, pan y rotación), Conciliar (con filtro por medio de pago), Editar y Eliminar en cascada. |
| **Motor de Conciliación & Tesorería NIIF** | Contabilidad / Backend | ✅ Completado | Partida doble estricta con sumas iguales, cálculo de retenciones y sincronización de `estadoPago` (`PAGADA` vs `PENDIENTE`). |
| **Documento Soporte (Compras sin Factura)** | Contabilidad / Compras | ✅ Completado | Registro ágil de compras a no obligados con consecutivo oficial `DS-XXXX`, afectación de inventario y asiento directo a caja o CxP. |
| **Catálogo PUC & Estructura NIIF** | Contabilidad / PUC | ✅ Completado | Gestión interactiva del Plan Único de Cuentas (Clases 1 a 9), autocalculador jerárquico de niveles, validación Zod y protección de integridad referencial. |
| **Catálogo E-commerce** | Catálogo / Tienda | 📅 Planificado | CRUD de productos y sincronización de stock. |
