# 🎯 01 - Objetivos del Proyecto

Este documento detalla los objetivos estratégicos y específicos establecidos para la plataforma digital de **Cigarrería Megalider**.

---

## 📌 Objetivo General

Desarrollar una plataforma web integral para **Cigarrería Megalider** compuesta por:
1. Una **Landing Page pública** moderna, responsive e informativa.
2. Un **Portal Unificado de Autenticación** con soporte para credenciales locales y Google OAuth 2.0 con control de acceso basado en roles (*RBAC*).
3. Un **Panel de Administración Interno (Dashboard)** conectado a múltiples bases de datos para auditar, corregir y gestionar las operaciones contables generadas por el bot extractor **Hermes IA**.
4. Una infraestructura flexible y modular preparada para el futuro lanzamiento del módulo **E-commerce**.

---

## 🔍 Objetivos Específicos

1. **Presencia Digital y Geolocalización:**
   Proveer a los clientes de Engativá y zonas aledañas información clara sobre horarios de atención, canales de contacto, catálogo de marcas destacadas y navegación asistida vía Google Maps.

2. **Autenticación Unificada y Segura (OAuth 2.0 + RBAC):**
   Permitir el acceso tanto al personal interno como a clientes externos mediante credenciales de usuario o cuenta de Google en un único portal (`/login`), enrutando automáticamente a cada usuario según su rol asignado (`SUPERADMIN`, `ADMIN`, `CAJERO`, `CLIENTE`).

3. **Supervisión y Corrección de Hermes IA:**
   Permitir a los administradores revisar, corregir y auditar en tiempo real las facturas de compras (con desglose de IVA, Impoconsumo y CUFE) y los egresos de caja registrados automáticamente por el bot en PostgreSQL.

4. **Trazabilidad y Auditoría Contable:**
   Guardar en la tabla `historial_correcciones` cualquier modificación manual realizada sobre registros generados por la IA, registrando el valor original, el corregido, el usuario responsable y el motivo.

5. **Control de Acceso Basado en Roles (RBAC):**
   Garantizar la seguridad mediante verificación de tokens JWT en Edge Middleware, cookies HttpOnly seguras y delimitación estricta de rutas administrativas.

6. **Catálogo Estructurado para E-commerce:**
   Clasificar los productos en las 4 categorías oficiales de la marca (Licores, Cigarrillos y Vapeo, Confitería y Snacks, Bebidas) con gestión de estado reactivo cliente usando Zustand.
