<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Mandatory Skill Verification Rule
- **Mandatory Skill Checking**: En CADA prompt o tarea recibida en cualquier conversación, DEBES verificar explícitamente la lista de `skills` disponibles y leer el `SKILL.md` de aquellas relevantes antes de generar respuestas o escribir código.

## Project Agent Guidelines & Skills
- **Next.js AI Coding Standard**: Consultar la skill `.agents/skills/nextjs-coding/SKILL.md` para patrones de App Router, asincronía obligatoria (`params`, `cookies`, `headers`), Server/Client Components y ciclo de verificación.
- **API Standardization & Security Standard**: Consultar la skill `.agents/skills/api-standard/SKILL.md` para reglas obligatorias de estandarización de API, contrato `ApiResponse<T>`, validación Zod, respuestas unificadas, comprobaciones timing-safe, cabeceras de seguridad y OpenAPI.
- **Brand Guidelines**: Seguir `.agents/skills/megalider-brand/SKILL.md` para colores, tipografías y estética de Cigarrería Megalider.
- **Token Efficiency**: Seguir `.agents/skills/token-optimization/SKILL.md` para respuestas concisas y optimización de contexto.
- **Analytics & Web Vitals**: Seguir `.agents/skills/nextjs-analytics/SKILL.md` para implementación de Core Web Vitals, instrumentación de cliente (`instrumentation-client.ts`), reportes no bloqueantes y telemetría de eventos.
- **Lazy Loading & Dynamic Imports**: Consultar la skill `.agents/skills/nextjs-lazy-loading/SKILL.md` para patrones de carga diferida con `next/dynamic`, `React.lazy`, deshabilitación segura de SSR (`ssr: false`), importación de librerías bajo demanda y magic comments.
- **Backend for Frontend (BFF) & APIs**: Consultar la skill `.agents/skills/nextjs-bff/SKILL.md` para arquitectura BFF, Route Handlers (`route.ts`), webhooks, negociación de contenido, proxying seguro y reglas de fetching interno.
- **Unit Testing**: Consultar la skill `.agents/skills/nextjs-unit-testing/SKILL.md` para patrones de pruebas unitarias con Vitest, React Testing Library, mocks de Next.js 16 (App Router, async params, cookies, headers), utilidades, componentes de UI, autenticación (JWT/jose) y Route Handlers.
- **Integration Testing**: Consultar la skill `.agents/skills/nextjs-integration-testing/SKILL.md` para patrones de pruebas de integración con Route Handlers BFF, Drizzle ORM Multi-BD (PostgreSQL + MySQL), autenticación JWT/OAuth 2.0 y Server Actions.
- **End-to-End Testing (E2E)**: Consultar la skill `.agents/skills/nextjs-e2e-testing/SKILL.md` para pruebas E2E con Playwright, simulación de navegador, flujos de autenticación, control de acceso RBAC e interacciones UI.
- **System Testing & Quality**: Consultar la skill `.agents/skills/nextjs-system-testing/SKILL.md` para verificación de matrices de aceptación CP-01 a CP-22, compilación de producción con Turbopack, Core Web Vitals e identidad de marca.
- **State Management (Zustand)**: Consultar la skill `.agents/skills/nextjs-zustand/SKILL.md` para reglas de diseño, estado cliente inmutable, stores (`lib/stores/`), persistencia transparente (`safeStorage`), consumo en Client Components con selectores y testing con Vitest.
- **SOLID Architecture Standards**: Consultar la skill `.agents/skills/nextjs-solid/SKILL.md` para la aplicación estricta de los principios SOLID (SRP, OCP, LSP, ISP, DIP) en componentes, hooks, Server/Client components y servicios en Next.js 16+.
- **Contabilidad Básica & Estándar Financiero**: Consultar la skill `.agents/skills/contabilidad-basica/SKILL.md` para fundamentos de contabilidad, partida doble ($\sum \text{Débito} = \sum \text{Crédito}$), dinámica de cuentas PUC/NIIF (Clases 1 a 9), ciclo contable, estados financieros, liquidación de impuestos (IVA, Retefuente, Impoconsumo) y validaciones de software contable.

