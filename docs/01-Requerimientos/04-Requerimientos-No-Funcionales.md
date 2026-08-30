# ⚡ 04 - Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales definen los criterios de calidad, rendimiento, seguridad y experiencia del sistema.

---

## ⚡ Especificación de Requerimientos No Funcionales

1. **RNF-01 (Rendimiento y Web Vitals):**
   El portal debe mantener un **Largest Contentful Paint (LCP)** inferior a **2.5s** y un **Cumulative Layout Shift (CLS)** inferior a **0.1**, mediante lazy loading de recursos pesados e imágenes optimizadas con el componente `next/image`.

2. **RNF-02 (Carga Diferida - Lazy Loading):**
   Los componentes debajo del pliegue (como mapas interactivos de Google Maps, modales y drawers) y librerías externas pesadas deben diferir su carga utilizando `next/dynamic` o `import()` bajo demanda para minimizar el tamaño del bundle inicial de JavaScript enviado al cliente.

3. **RNF-03 (Seguridad en Endpoints BFF):**
   Los Route Handlers públicos deben implementar protección contra redirecciones abiertas (*Open Redirects*), validación estricta de esquemas de entrada y evitar llamadas circulares de `fetch()` desde Server Components.

4. **RNF-04 (Identidad Institucional de Marca):**
   Todo el diseño debe apegarse rigurosamente a la guía de marca de Cigarrería Megalider:
   - Paleta de verdes: `#067335` (Verde Esmeralda), `#038C3E` (Verde Acción CTA), `#53A677` (Verde Medio), `#A7D9BD` (Menta Suave) y `#F2F2F2` (Fondo Neutro).
   - Tipografías: `Playfair Display` para títulos y `Plus Jakarta Sans` para texto del cuerpo e interfaz.

5. **RNF-05 (Eficiencia de Tokens para IA):**
   El código, la documentación y las configuraciones de agentes deben optimizar el contexto, evitando redundancias y aplicando directivas de alta densidad informativa.
