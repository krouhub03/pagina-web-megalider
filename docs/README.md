# Centro de Documentación — Cigarrería Megalider

Bienvenido a la documentación oficial del proyecto **Cigarrería Megalider** (Landing Pública, Dashboard Administrativo, Integración Multi-BD con Hermes IA y E-commerce).

---

## 📁 Estructura del Repositorio de Documentación

```text
docs/
├── 01-Requerimientos/   # Casos de uso, historias de usuario y objetivos
├── 02-Disenio/          # Arquitectura, diagramas de flujo y lineamientos de diseño
├── 03-Tecnico/          # Manual técnico, stack, variables de entorno e instalación
├── 04-Gestion/          # Cronograma, fases del proyecto y reportes de progreso
└── 05-Pruebas/          # Casos de prueba, resultados y matriz de validación
```

---

## 📌 Guía Rápida por Carpetas

| Carpeta | Descripción | Enlace |
| :--- | :--- | :--- |
| **01-Requerimientos** | Casos de uso, historias de usuario, alcance funcional y requerimientos no funcionales (rendimiento, seguridad, Web Vitals). | [Ver Requerimientos](./01-Requerimientos/README.md) |
| **02-Disenio** | Arquitectura Multi-BD, modelo ER, flujo OAuth 2.0 con RBAC, arquitectura BFF, Lazy Loading y guía de marca. | [Ver Diseño](./02-Disenio/README.md) |
| **03-Tecnico** | Stack Next.js 16+ Turbopack, manual de Route Handlers (BFF), Lazy Loading, Web Vitals, variables `.env.local` e instalación. | [Ver Técnico](./03-Tecnico/README.md) |
| **04-Gestion** | Roadmap de fases, estado de entregables, actas de decisiones y estandarización de skills de agentes. | [Ver Gestión](./04-Gestion/README.md) |
| **05-Pruebas** | Matriz de casos de prueba (CP-01 a CP-15), validación de seguridad OAuth, integridad PostgreSQL/MySQL y build. | [Ver Pruebas](./05-Pruebas/README.md) |

---

## 🤖 Skills de Agentes de IA Indexadas

El proyecto cuenta con un conjunto de skills especializadas ubicadas en `.agents/skills/`:

* [`nextjs-coding`](../.agents/skills/nextjs-coding/SKILL.md): Estándar de codificación para Next.js 16+ (App Router).
* [`megalider-brand`](../.agents/skills/megalider-brand/SKILL.md): Guía de marca, diseño, paleta de colores y recursos visuales.
* [`token-optimization`](../.agents/skills/token-optimization/SKILL.md): Directivas de eficiencia de contexto y consumo de tokens.
* [`nextjs-analytics`](../.agents/skills/nextjs-analytics/SKILL.md): Instrumentación de Core Web Vitals y telemetría no bloqueante.
* [`nextjs-lazy-loading`](../.agents/skills/nextjs-lazy-loading/SKILL.md): Patrones de carga diferida con `next/dynamic`, `import()` y magic comments.
* [`nextjs-bff`](../.agents/skills/nextjs-bff/SKILL.md): Arquitectura Backend for Frontend, Route Handlers y negociación de contenido.
