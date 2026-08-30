# 📋 03 - Matriz de Casos de Uso

La siguiente matriz documenta los casos de uso principales del sistema (CU-01 a CU-13), especificando los actores principales, las precondiciones necesarias y los resultados esperados.

---

## 📋 Matriz de Casos de Uso (CU-01 a CU-13)

| ID | Caso de Uso | Actor Principal | Precondición | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **CU-01** | Iniciar Sesión con Credenciales | Staff / Admin | Usuario activo en MySQL con contraseña configurada | Generación de cookie `auth_token` (JWT) y redirección a `/dashboard`. |
| **CU-02** | Iniciar Sesión con Google OAuth | Cualquier Usuario | Cuenta de Google activa | Sincronización en MySQL, emisión de JWT y enrutamiento RBAC (`/` para clientes, `/dashboard` para staff). |
| **CU-03** | Control de Acceso RBAC | Cliente Externo | Sesión activa con rol `CLIENTE` | Bloqueo en middleware ante rutas `/dashboard` o `/contabilidad` y redirección forzada a `/`. |
| **CU-04** | Consultar Facturas | Admin / Superadmin | Sesión activa con rol Staff | Lectura de facturas e ítems desde PostgreSQL (`cmegalider`). |
| **CU-05** | Modificar Egreso | Admin / Superadmin | Sesión activa con rol Staff | Actualización en `egresos_tienda` e inserción de registro auditado en `historial_correcciones`. |
| **CU-06** | Consultar Catálogo | Todos los roles | Acceso libre o autenticado | Listado de productos clasificados por categoría y búsqueda reactiva. |
| **CU-07** | Cerrar Sesión | Usuario autenticado | Sesión activa | Eliminación de la cookie `auth_token` y redirección a `/login`. |
| **CU-08** | Consumo de Endpoints BFF / APIs | Clientes API / Frontend | Petición HTTP a Route Handler | Respuesta estructurada (JSON, XML o MD) con cabeceras de seguridad. |
| **CU-09** | Registro de Nuevo Cliente con reCAPTCHA | Cliente no registrado | Formulario diligenciado, políticas aceptadas y reCAPTCHA resuelto | Creación en MySQL (`rol: CLIENTE`), emisión de JWT y redirección a `/`. |
| **CU-10** | Ver Detalle de Factura | Admin / Superadmin | Factura registrada en PostgreSQL | Vista completa `/contabilidad/facturas/[id]` con tarjetas de emisor/receptor, CUFE compacto y tabla de ítems con `tfoot`. |
| **CU-11** | Editar Factura e Ítems | Admin / Superadmin | Sesión activa Staff | Modificación de metadatos o ítems con recálculo automático y sincronización en BD (`recalcularTotalesFactura`). |
| **CU-12** | Eliminar Factura de Compra | Admin / Superadmin | Confirmación en modal | Borrado en cascada en PostgreSQL y redirección a la lista. |
| **CU-13** | Filtrado Reactivo en Cliente | Admin / Staff | Lista de facturas cargada | Filtrado en tiempo real en memoria usando `useFacturasFiltrosStore` de Zustand. |
