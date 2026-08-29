<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project Agent Guidelines & Skills
- **Next.js AI Coding Standard**: Consultar la skill `.agents/skills/nextjs-coding/SKILL.md` para patrones de App Router, asincronía obligatoria (`params`, `cookies`, `headers`), Server/Client Components y ciclo de verificación.
- **Brand Guidelines**: Seguir `.agents/skills/megalider-brand/SKILL.md` para colores, tipografías y estética de Cigarrería Megalider.
- **Token Efficiency**: Seguir `.agents/skills/token-optimization/SKILL.md` para respuestas concisas y optimización de contexto.
- **Analytics & Web Vitals**: Seguir `.agents/skills/nextjs-analytics/SKILL.md` para implementación de Core Web Vitals, instrumentación de cliente (`instrumentation-client.ts`), reportes no bloqueantes y telemetría de eventos.
