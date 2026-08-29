# 01 - Requerimientos del Sistema

Este directorio contiene los objetivos del proyecto, casos de uso del sistema e historias de usuario para el portal público, el portal de acceso unificado y el dashboard administrativo de **Cigarrería Megalider**.

---

## 🎯 Definición de Objetivos

### Objetivo General
Desarrollar una plataforma integral para Cigarrería Megalider compuesta por una **Landing Page pública** moderna e informativa, un **Portal Unificado de Autenticación con Google OAuth 2.0 y RBAC**, un **Panel de Administración Interno (Dashboard)** conectado a múltiples bases de datos para auditar y gestionar las operaciones contables de **Hermes IA**, y preparar la infraestructura para el futuro **E-commerce**.

### Objetivos Específicos
1. **Presencia Digital y Geolocalización:** Proveer a los clientes en Engativá información sobre horarios, contacto, categorías de productos y cómo llegar vía Google Maps.
2. **Autenticación Unificada y Segura (OAuth 2.0 + RBAC):** Permitir el acceso tanto a personal interno como a clientes externos mediante credenciales o cuenta de Google, enrutando a cada usuario según su rol (`SUPERADMIN`, `ADMIN`, `CAJERO`, `CLIENTE`).
3. **Supervisión de Hermes IA:** Permitir a los administradores revisar, corregir y auditar en tiempo real las facturas de proveedores y los egresos de caja registrados por el bot en PostgreSQL.
4. **Trazabilidad y Auditoría:** Guardar en `historial_correcciones` cualquier modificación manual sobre registros generados automáticamente por la IA.
5. **Control de Acceso Basado en Roles (RBAC):** Garantizar la seguridad mediante middleware Edge, tokens JWT con cookies HttpOnly y delimitación estricta de rutas administrativas.
6. **Catálogo Preparado para E-commerce:** Estructurar los productos en las 4 categorías oficiales de Megalider.

---

## 👤 Historias de Usuario (User Stories)

### Módulo de Autenticación y Seguridad
* **HU-01:** *Como administrador*, quiero iniciar sesión con mi correo y contraseña para acceder de forma segura al panel de gestión interna.
* **HU-02:** *Como usuario (personal o cliente)*, quiero iniciar sesión con mi cuenta de Google mediante un solo clic para acceder de forma ágil y segura.
* **HU-03:** *Como cliente externo*, quiero que al autenticarme con Google se me cree una cuenta con rol `CLIENTE` y se me redirija a la página principal de la tienda.
* **HU-04:** *Como superadministrador*, quiero gestionar usuarios y asignar roles (`SUPERADMIN`, `ADMIN`, `CAJERO`, `CLIENTE`) para delimitar las acciones del personal y proteger datos financieros confidenciales.

### Módulo de Contabilidad y Hermes IA
* **HU-05:** *Como administrador*, quiero visualizar el listado de facturas de compras con su desglose de impuestos (IVA, Impoconsumo, CUFE) para controlar el abastecimiento de mercancía.
* **HU-06:** *Como administrador*, quiero revisar los egresos de caja registrados por Hermes Bot y modificarlos si contienen errores de extracción, dejando constancia del motivo de corrección.
* **HU-07:** *Como auditor*, quiero consultar un registro cronológico de todas las correcciones manuales hechas a los egresos de Hermes para mantener la transparencia contable.

### Módulo de Métricas e Inventario
* **HU-08:** *Como administrador*, quiero ver un resumen ejecutivo (KPIs) del total de compras, egresos del mes y balance operativo para tomar decisiones financieras rápidas.
* **HU-09:** *Como usuario*, quiero navegar por la landing pública y ver el horario de atención, marcas destacadas y la ubicación exacta del local en Engativá.

---

## 📋 Matriz de Casos de Uso

| ID | Caso de Uso | Actor Principal | Precondición | Resultado |
| :--- | :--- | :--- | :--- | :--- |
| **CU-01** | Iniciar Sesión con Credenciales | Staff / Admin | Usuario activo en MySQL con password | Generación de cookie JWT y redirección según rol. |
| **CU-02** | Iniciar Sesión con Google OAuth | Cualquier Usuario | Cuenta de Google activa | Sincronización en MySQL, emisión de JWT y enrutamiento RBAC (`/` para clientes, `/dashboard` para staff). |
| **CU-03** | Control de Acceso RBAC | Cliente Externo | Sesión activa con rol `CLIENTE` | Bloqueo en middleware ante rutas `/dashboard` o `/contabilidad` y redirección forzada a `/`. |
| **CU-04** | Consultar Facturas | Admin / Superadmin | Sesión activa con rol Staff | Lectura de facturas e items en PostgreSQL. |
| **CU-05** | Modificar Egreso | Admin / Superadmin | Sesión activa con rol Staff | Actualización en `egresos_tienda` + inserción en `historial_correcciones`. |
| **CU-06** | Consultar Catálogo | Todos los roles | Acceso libre o autenticado | Listado de productos clasificados por categoría. |
| **CU-07** | Cerrar Sesión | Usuario autenticado | Sesión activa | Eliminación de cookie `auth_token` y redirección a `/login`. |
