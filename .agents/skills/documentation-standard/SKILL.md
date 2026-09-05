---
name: documentation-standard
description: Guía experta y directivas obligatorias para estructurar, actualizar y mantener la documentación técnica y de gestión del proyecto Cigarrería Megalider.
---

# Estándar de Documentación — Cigarrería Megalider

Esta skill define las reglas obligatorias que **TODO agente o desarrollador DEBE SEGUIR** al momento de crear, actualizar o modificar la documentación del proyecto (carpeta `docs/` y archivo `README.md`).

---

## 🚨 1. Reglas de Oro Documentales

1. **Sincronización Inmediata:** Cualquier cambio arquitectónico, de módulos, de base de datos o de despliegue DEBE quedar registrado inmediatamente en los archivos de la carpeta `docs/` relevantes.
2. **Uso de Mermaid:** Los diagramas de arquitectura, modelos entidad-relación (ER) y flujos de proceso deben estar representados en bloques de código `mermaid` integrados nativamente en Markdown.
3. **Markdown Limpio (GitHub Flavored):** Usa sintaxis estándar, tablas bien formateadas e incluye "callouts" (Alerts de GitHub: `> [!IMPORTANT]`, `> [!WARNING]`, `> [!NOTE]`) para advertencias o notas importantes.
4. **Links Relativos y Archivos Indexados:**
   - Todo módulo dentro de `docs/` debe tener su propio `README.md` que funcione como índice local (ej. `docs/03-Tecnico/README.md`).
   - Los enlaces internos en la documentación deben ser **siempre relativos** al archivo actual (`./05-Modulo-Contabilidad.md`).
5. **Idioma Oficial:** Toda la documentación debe ser escrita en Español, utilizando terminología técnica precisa pero accesible.

---

## 📁 2. Estructura Oficial de la Carpeta `docs/`

El centro de documentación está rígidamente estructurado. No se permite crear carpetas en la raíz de `docs/` fuera de este esquema numerado sin aprobación previa.

* **01-Requerimientos:** Casos de uso, historias de usuario y requerimientos no funcionales.
* **02-Disenio:** Diagramas de arquitectura, modelos de datos ER Multi-Base de Datos y flujos de autenticación.
* **03-Tecnico:** Detalles de implementación, manuales de endpoints, variables de entorno y guías de módulos específicos.
* **04-Gestion:** Cronograma (Gantt), entregables y estado de avances (Roadmap).
* **05-Pruebas:** Estrategias de testing (Unitario, E2E, Sistema), métricas y matrices de aceptación.
* **06-Dominios-de-Usuario:** Descripción de las interfaces por actores (Externo, Interno, Capa BFF).

---

## ✍️ 3. Mantenimiento del README.md Principal

El `README.md` en la raíz del proyecto es la puerta de entrada para los desarrolladores.
Debe contener SIEMPRE de forma concisa:
- Breve descripción del negocio (Cigarrería Megalider).
- El Diagrama de Arquitectura por Dominios (en bloque de texto o Mermaid).
- Requisitos de entorno (`.env.local` sin exponer secretos reales, solo `.env.example`).
- Comandos de inicio rápido (ej. `npm run dev`, `npm test`).
- Enlaces al Centro de Documentación `docs/`.

---

## 🛠️ 4. Actualización del Estado de Entregables

Al completar un hito del proyecto, debes actualizar la tabla en `docs/04-Gestion/02-Estado-de-Entregables.md` para reflejar el progreso de "📅 Planificado" o "🚧 En progreso" a "✅ Completado".
