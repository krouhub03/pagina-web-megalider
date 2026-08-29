---
name: token-optimization
description: Directivas y estrategias para optimizar el consumo de tokens, reducir costo computacional, comprimir contexto y aplicar control restrictivo de entrada/salida en integraciones de IA y prompts.
---

# Optimización de Tokens y Eficiencia de Contexto

Guía y directivas estrictas para maximizar la eficiencia, reducir costos computacionales y acelerar la latencia en interacciones e integraciones con modelos de lenguaje (LLMs / Agentes).

---

## 1. Reducción de Ruido en el Input

### Eliminación de Cortesía y Relleno
- **Suprimir cortesías**: Eliminar saludos (*"Hola"*, *"Por favor"*), agradecimientos (*"Muchas gracias"*), despedidas y justificaciones emocionales.
- **Enfoque puramente lógico**: Las APIs procesan instrucciones lógicas; cualquier texto empático o conversacional incrementa el recuento de tokens sin aportar valor semántico.

### Formatos de Alta Densidad (YAML vs JSON/Prosa)
- **Priorizar YAML**: Para inyectar datos, esquemas, configuraciones y variables, usar YAML en lugar de JSON o párrafos en lenguaje natural.
- **Ahorro estructural**: YAML prescinde de llaves (`{}`), corchetes (`[]`), comillas excesivas y comas, reduciendo drásticamente los tokens por cada clave/valor.

### Lenguaje Imperativo y Directo
- **Verbos de acción al inicio**: Empezar instrucciones directamente con verbos operativos claros (*"Genera"*, *"Extrae"*, *"Formatea"*, *"Refactoriza"*, *"Valida"*).
- **Evitar voz pasiva o rodeos**: Reemplazar construcciones como *"Me gustaría que por favor pudieras generar..."* por *"Genera..."*.

### Poda y Minificación de Código
- **Limpieza previa a la inyección**:
  - Eliminar espacios en blanco y saltos de línea redundantes.
  - Quitar comentarios no esenciales, `console.log`, `print` de depuración y código muerto.
  - Enviar únicamente las firmas o las funciones pertinentes en lugar de archivos completos cuando solo se evalúa una porción.

---

## 2. Control Restrictivo de Salida (Output)

### Bloqueo de Preámbulos y Epílogos
- **Instrucción Maestra (System Prompt)**:
  > *"Devuelve únicamente la respuesta solicitada. Cero texto introductorio, disculpas, explicaciones no pedidas o conclusiones finales."*
- **Evitar frases conversacionales**: Prohibir expresiones como *"¡Claro! Aquí tienes el código:"* o *"Espero que esto te sea de ayuda"*.

### Estructuras Predefinidas
- **Formatos concretos**: Exigir al modelo devolver la información en formatos estructurados específicos:
  - Tablas Markdown compactas.
  - Listas de viñetas directas.
  - Bloques de código puros (raw code blocks).
- **Evitar divagaciones**: Cuando el formato está estrictamente delimitado, el modelo no genera texto explicativo intentando justificar su respuesta.

### Restricción de Longitud y Límites Numéricos
- **Límites exactos en el prompt**:
  - *"Resume en máximo 3 viñetas de 20 palabras cada una."*
  - *"Genera una lista de máximo 5 ítems clave."*
- **Ajuste de parámetros API**: Configurar `max_output_tokens` acorde a la respuesta esperada para prevenir desbordes costosos.

---

## 3. Gestión de Memoria del Agente y Contexto

### Ventana de Contexto Deslizante (Sliding Window)
- **Historial acotado**: Para flujos conversacionales, inyectar únicamente los últimos **3 a 5 intercambios relevantes** en lugar de todo el historial acumulado desde el inicio de la sesión.

### Resúmenes en Cascada (Hierarchical Summarization)
- **Compresión periódica**: Cuando se requiera retener memoria de interacciones previas:
  1. Ejecutar un paso previo con un modelo ligero/rápido para resumir la conversación anterior en un único párrafo comprimido o formato YAML clave.
  2. Inyectar únicamente dicho resumen consolidado junto con el turno actual.

### Extracción Quirúrgica (RAG Preciso)
- **Inyección granular**: No enviar documentos completos ni capítulos enteros al prompt.
- **Búsqueda vectorial / filtrado previo**: Usar embeddings, búsqueda híbrida o scripts de particionamiento (chunking) para inyectar exclusivamente los fragmentos exactos que contienen la respuesta requerida.

---

## 4. Plantilla Rápida de Prompt de Alta Eficiencia

```yaml
# Directivas de Sistema
rol: Optimizador de Datos
modo: Estricto
reglas_salida:
  - Solo_contenido_solicitado: true
  - Preambulo_y_epilogo: false
  - Formato: YAML | Codigo_Puro | Tabla

# Tarea
accion: Extrae entidades clave y clasifícalas
limite: Max 5 items
```
