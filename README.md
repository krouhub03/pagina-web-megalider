# 🛒 Cigarrería Megalider — Plataforma Web Integral & Sistema de Gestión

Bienvenido a la plataforma web oficial de **Cigarrería Megalider**, un negocio comercial de consumo masivo ubicado en la localidad de Engativá, Bogotá.

Este proyecto abarca una solución tecnológica de extremo a extremo construida sobre **Next.js 16+ (App Router)**, **React 19**, **Tailwind CSS v4**, y una arquitectura **Multi-Base de Datos con Drizzle ORM** (PostgreSQL + MySQL).

---

## 🎯 ¿Qué es el Proyecto Cigarrería Megalider?

La plataforma está diseñada para resolver tres necesidades clave del negocio:

1. **Presencia Digital y Geolocalización (Landing Pública):** Informar a los clientes en Engativá sobre la ubicación del local comercial, horarios de atención, canales de contacto, catálogo de marcas destacadas y navegación asistida vía Google Maps.
2. **Portal Unificado de Autenticación & Seguridad (OAuth 2.0 + RBAC):** Proporcionar un inicio de sesión seguro tanto para el equipo interno (Superadministrador, Administrador, Cajero) como para clientes externos mediante credenciales locales o Google OAuth 2.0, aplicando enrutamiento de acceso por roles (*Role-Based Access Control*).
3. **Dashboard Administrativo & Auditoría de Hermes IA (Contabilidad):** Supervisar, auditar y corregir en tiempo real los registros financieros automáticos creados por **Hermes IA** (bot extractor de facturas de compra en PDF/XML), almacenando un historial completo de correcciones en PostgreSQL.
4. **Infraestructura lista para E-commerce:** Estructura modular del catálogo de productos (Licores, Cigarrillos y Vapeo, Confitería y Snacks, Bebidas) con gestión de estado interactivo en el cliente mediante **Zustand** y persistencia transparente.

---

## 🏛️ Arquitectura por Dominios de Usuario

```text
                                PLATAFORMA MEGALIDER
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
  🟢 USUARIO EXTERNO               🔴 USUARIO INTERNO             ⚡ CAPA DE SERVICIOS BFF
(Landing & E-commerce)          (Dashboard & Operaciones)               (APIs & Auth)
   app/(public)/                     app/(admin)/                       app/api/
   app/(auth)/                                                          middleware.ts
        │                                │                                │
        ▼                                ▼                                ▼
MySQL (Catálogo/Facturas)        PostgreSQL (Hermes IA Auditoría)  JWT / Edge RBAC / OAuth
```

---

## 🚀 Inicio Rápido (Desarrollo)

### Prerrequisitos
* **Node.js:** `>= 20.0.0`
* **MySQL:** Servidor activo con la base de datos `u200862310_megalider` y esquema ejecutado (`scripts/schema_mysql.sql`).
* **PostgreSQL:** Servidor activo con la base de datos de contabilidad de Hermes IA (`cmegalider`).

### Pasos de Instalación

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env.local` en la raíz basándote en la plantilla `.env.example`:
   ```env
   POSTGRES_DATABASE_URL="postgres://usuario:password@host:5432/cmegalider?sslmode=prefer"
   MYSQL_DATABASE_URL="mysql://usuario:password@127.0.0.1:3306/u200862310_megalider"
   NEXTAUTH_SECRET="tu_clave_secreta_jwt_muy_segura_aqui"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="tu_google_client_id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="tu_google_client_secret"
   ```

3. **Ejecutar en entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   Accede a la aplicación en [http://localhost:3000](http://localhost:3000).

4. **Ejecutar Pruebas Unitarias:**
   ```bash
   npm test
   ```

---

## 📚 Centro de Documentación

La documentación detallada del proyecto se encuentra organizada en la carpeta [`docs/`](./docs/README.md):

* 📋 [**01 - Requerimientos**](./docs/01-Requerimientos/README.md): Objetivos del negocio, historias de usuario (HU-01 a HU-14), matriz de casos de uso (CU-01 a CU-13) y requerimientos no funcionales (Web Vitals, rendimiento, seguridad).
* 🏛️ [**02 - Diseño & Arquitectura**](./docs/02-Disenio/README.md): Arquitectura Multi-BD, modelo de datos ER, diagramas de secuencia Google OAuth 2.0 + RBAC, patrones BFF, Cache Components y guía visual de marca.
* 🛠️ [**03 - Manual Técnico**](./docs/03-Tecnico/README.md): Especificación del stack Next.js 16+, configuración de Google Cloud Console, guía de API Route Handlers, seguridad de sesiones JWT, lazy loading y módulo de contabilidad.
* 📅 [**04 - Gestión & Roadmap**](./docs/04-Gestion/README.md): Diagrama de Gantt por fases, matriz de estado de entregables y registro de decisiones de arquitectura (ADRs).
* 🧪 [**05 - Pruebas & Calidad**](./docs/05-Pruebas/README.md): Centro de pruebas por carpetas (Sistema, Unitarias 64 tests, Integración, E2E Playwright, Setup/Mocks y Resultados).
* 👥 [**06 - Dominios de Usuario**](./docs/06-Dominios-de-Usuario/README.md): Arquitectura orientada por actor: Usuario Externo (`app/(public)`), Usuario Interno (`app/(admin)`) y Capa BFF (`app/api`).

---

## 🤖 Skills de Agentes IA Indexadas

El proyecto cuenta con directivas estándar para agentes de codificación en `.agents/skills/`:
* [`nextjs-coding`](./.agents/skills/nextjs-coding/SKILL.md): Estándares de Next.js 16+ App Router.
* [`megalider-brand`](./.agents/skills/megalider-brand/SKILL.md): Guía de diseño e identidad visual de Cigarrería Megalider.
* [`token-optimization`](./.agents/skills/token-optimization/SKILL.md): Eficiencia de contexto y tokens.
* [`nextjs-analytics`](./.agents/skills/nextjs-analytics/SKILL.md): Instrumentación de Core Web Vitals.
* [`nextjs-lazy-loading`](./.agents/skills/nextjs-lazy-loading/SKILL.md): Carga diferida con `next/dynamic`.
* [`nextjs-bff`](./.agents/skills/nextjs-bff/SKILL.md): Arquitectura Backend for Frontend y Route Handlers.
* [`nextjs-unit-testing`](./.agents/skills/nextjs-unit-testing/SKILL.md): Pruebas unitarias con Vitest y mocks de Next.js 16.
* [`nextjs-integration-testing`](./.agents/skills/nextjs-integration-testing/SKILL.md): Pruebas de integración para Route Handlers BFF y Drizzle ORM.
* [`nextjs-e2e-testing`](./.agents/skills/nextjs-e2e-testing/SKILL.md): Pruebas End-to-End con Playwright y control RBAC.
* [`nextjs-system-testing`](./.agents/skills/nextjs-system-testing/SKILL.md): Pruebas de sistema, matriz CP-01 a CP-22 y Core Web Vitals.
* [`nextjs-zustand`](./.agents/skills/nextjs-zustand/SKILL.md): Estado cliente inmutable con Zustand.

---
© 2026 **Cigarrería Megalider** — Todos los derechos reservados.
