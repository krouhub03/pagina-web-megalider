---
name: megalider-brand
description: Guía de marca, diseño, paleta de colores y lineamientos visuales para el proyecto Cigarrería Megalider. Usar al crear o modificar UI, componentes o páginas.
---

# Guía de Marca y Diseño — Cigarrería Megalider

Esta skill contiene la guía oficial de marca, paleta de colores y principios visuales para todo el proyecto **Cigarrería Megalider**.

## Paleta de Colores Oficial

| Tono / Rol | Código Hex | Uso y Aplicación |
| :--- | :--- | :--- |
| **Fondo Claro / Neutro** | `#F2F2F2` | Fondos limpios, tarjetas secundarias y áreas de reposo visual. |
| **Menta Suave** | `#A7D9BD` | Fondos de íconos, badges, bordes sutiles y acentos secundarios. |
| **Verde Medio** | `#53A677` | Acentos visuales, líneas de separación y estados hover secundarios. |
| **Verde Esmeralda Oscuro** | `#067335` | Color primario institucional, logos, encabezados y barras principales. |
| **Verde Acción (CTA)** | `#038C3E` | Botones primarios de llamada a la acción (CTA), destacados e interacción principal. |

---

## Identidad Visual y Recursos

1. **Logo Oficial**:
   - Ruta: `/logo_megalider.webp`
   - Uso: Header, Hero Section, badges y Footer.

2. **Tipografía Oficial**:
   - **Títulos y Encabezados**: `Playfair Display` (serif)
   - **Textos de Cuerpo e Interfaz**: `Plus Jakarta Sans` (sans-serif)

3. **Categorías de Productos Oficiales**:
   - **Licores y Cervezas**: Cervezas nacionales e importadas, aguardiente, ron, whisky.
   - **Snacks y Cigarrillos**: Papas, pasabocas empaquetados, chocolates, cigarrillos.
   - **Artículos de Necesidad (Abarrotes)**: Estrictamente abarrotes empacados (arroz, atún/enlatados, aceites, salsas, pastas, granos secos). **NO son verduras ni frutas**.
   - **Medicamentos Básicos**: Botiquín de primeros auxilios, analgésicos, antiácidos.

4. **Datos de Contacto y Ubicación**:
   - **Dirección**: Cl. 86 #95F-72, Ciudad Bachué I Etapa, Engativá, Bogotá, Colombia.
   - **Horario**: Lunes a Domingo de 11:00 AM a 11:00 PM.

5. **Estándar de Redacción de Interfaz (UX Copywriting — Sin Jerga Técnica)**:
   - **PROHIBICIÓN STRICTA:** NUNCA mostrar nombres de motores de bases de datos, librerías o jerga de desarrollo (`PostgreSQL`, `MySQL`, `Drizzle`, `ORM`, `BFF`, `API`, `JSON`, etc.) en elementos visuales de la interfaz de usuario (UI), páginas, modales, badges, tarjetas o mensajes del sistema.
   - **LENGUAJE DE NEGOCIO:** Reemplazar por expresiones funcionales orientadas al usuario (ej. *"Sistema Contable"*, *"Catálogo Sincronizado en Vivo"*, *"Sistema de Inventario"*, *"Registro de Operaciones"*).

6. **Estándar Obligatorio para Cabeceras de Tablas (Tooltip con Puntero de Ayuda)**:
   - **REGLA OBLIGATORIA:** TODA celda de encabezado de tabla (`<th className="... cursor-help" title="...">`) DEBE incluir la clase CSS `cursor-help` (puntero con signo de interrogación `?`) y un atributo `title="..."` explicativo con lenguaje claro para el usuario.
   - **PROPÓSITO:** Brindar auto-explicación contextual inmediata en cada columna sin saturar la pantalla.


