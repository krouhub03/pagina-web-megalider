# 📁 Centro de Documentación Central — Cigarrería Megalider

Bienvenido al centro de documentación oficial de **Cigarrería Megalider**. Este repositorio contiene la especificación funcional, de diseño, técnica, de gestión, de aseguramiento de calidad y de dominios de usuario del proyecto.

---

## 🗂️ Estructura General de Documentación

La documentación se encuentra dividida en 6 módulos especializados organizados en archivos independientes por tema:

```text
docs/
├── 01-Requerimientos/             # Objetivos del negocio, User Stories, Casos de Uso y RNFs
│   ├── README.md                  # Índice del módulo de requerimientos
│   ├── 01-Objetivos.md            # Objetivos generales y específicos
│   ├── 02-Historias-de-Usuario.md # Historias de usuario (HU-01 a HU-14)
│   ├── 03-Casos-de-Uso.md         # Matriz de casos de uso (CU-01 a CU-13)
│   └── 04-Requerimientos-No-Funcionales.md # Especificaciones RNF (Web Vitals, Seguridad, Token Opt)
│
├── 02-Disenio/                    # Diagramas de arquitectura, ER, flujos y guía visual
│   ├── README.md                  # Índice del módulo de diseño y arquitectura
│   ├── 01-Arquitectura-General.md # Diagrama de capas y Multi-BD (PostgreSQL + MySQL)
│   ├── 02-Modelo-de-Datos.md      # Modelo Entidad-Relación y tablas
│   ├── 03-Flujos-de-Autenticacion.md # Diagrama de secuencia OAuth 2.0 + RBAC
│   ├── 04-Guia-de-Marca.md        # Paleta de colores Hex y tipografía oficial
│   └── 05-Patrones-de-Arquitectura.md # DAL, Cache Components, BFF, Lazy Loading y Zustand
│
├── 03-Tecnico/                    # Manual técnico, setup, endpoints, sesiones y contabilidad
│   ├── README.md                  # Índice del manual técnico
│   ├── 01-Stack-y-Configuracion.md # Stack de tecnologías, .env.local y Google Cloud setup
│   ├── 02-Endpoints-y-BFF.md      # Endpoints de API, OAuth y manual Route Handlers
│   ├── 03-Seguridad-y-Sesiones.md # Firma JWT (jose), cookies HttpOnly y Middleware RBAC
│   ├── 04-Estandares-Nextjs-y-Rendimiento.md # Cache Components, Suspense, Web Vitals y Zustand
│   ├── 05-Modulo-Contabilidad.md # Arquitectura del módulo de facturas y recálculos PostgreSQL
│   └── 06-Agentes-y-Skills.md    # Estándares de desarrollo para IA y skills indexadas
│
├── 04-Gestion/                    # Roadmap de fases, estado de entregables y actas
│   ├── README.md                  # Índice del módulo de gestión
│   ├── 01-Roadmap-y-Cronograma.md # Diagrama de Gantt por fases de desarrollo
│   ├── 02-Estado-de-Entregables.md# Matriz de entregables y estado de características
│   └── 03-Actas-y-Decisiones.md  # Registro de decisiones de arquitectura (ADRs)
│
├── 05-Pruebas/                    # Matrices de prueba, Vitest suite y evidencias por carpetas
│   ├── README.md                  # Índice del centro de pruebas
│   ├── 01-Sistema/                # Matriz general de casos de prueba del sistema (CP-01 a CP-22)
│   ├── 02-Unitarias/              # Suite de 64 pruebas unitarias (UI, Servicios, Libs, Stores)
│   ├── 03-Integracion/            # Guía de pruebas de integración de APIs y Drizzle ORM
│   ├── 04-E2E/                    # Escenarios de pruebas End-to-End con Playwright
│   ├── 05-Setup-y-Mocks/          # Configuración de Vitest, wrappers y datos estáticos
│   └── 06-Ejecucion-y-Resultados/ # Scripts de ejecución, cobertura y evidencias Vitest
│
└── 06-Dominios-de-Usuario/        # Arquitectura orientada por actor (Externo, Interno, BFF)
    ├── README.md                  # Índice del módulo por dominios de usuario
    ├── 01-Usuario-Externo.md      # Flujos app/(public) y app/(auth) para clientes
    ├── 02-Usuario-Interno.md      # Flujos app/(admin) y módulo contable Hermes IA para staff
    └── 03-Capa-BFF-y-APIs.md      # APIs app/api/, enrutamiento RBAC Edge y Google OAuth 2.0
```

---

## 📌 Guía Rápida por Módulos

| Módulo | Descripción Principal | Documento Principal |
| :--- | :--- | :--- |
| **01-Requerimientos** | Casos de uso, historias de usuario, alcance funcional y requerimientos no funcionales. | [Ver Requerimientos](./01-Requerimientos/README.md) |
| **02-Disenio** | Arquitectura Multi-BD, modelo ER, flujo OAuth 2.0 con RBAC, arquitectura BFF y guía de marca. | [Ver Diseño](./02-Disenio/README.md) |
| **03-Tecnico** | Stack Next.js 16+ Turbopack, Route Handlers (BFF), Lazy Loading, Web Vitals y `.env.local`. | [Ver Manual Técnico](./03-Tecnico/README.md) |
| **04-Gestion** | Roadmap de fases, estado de entregables, actas de decisiones y estandarización de skills. | [Ver Gestión](./04-Gestion/README.md) |
| **05-Pruebas** | Matrices de prueba por carpetas (Sistema, Unitarias, Integración, E2E, Setup/Mocks, Resultados). | [Ver Pruebas](./05-Pruebas/README.md) |
| **06-Dominios-de-Usuario** | Especificación orientada por actor: Usuario Externo (`public`), Usuario Interno (`admin`) y BFF (`api`). | [Ver Dominios](./06-Dominios-de-Usuario/README.md) |
