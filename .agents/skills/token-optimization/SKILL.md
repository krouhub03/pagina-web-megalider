---
name: token-optimization
description: Directivas y estrategias para optimizar el consumo de tokens, reducir costo computacional, comprimir contexto y aplicar control restrictivo de entrada/salida en integraciones de IA y prompts.
---

# Skill: Desarrollo Web — Token Efficient

## Objetivo

Desarrollar y modificar proyectos web consumiendo la menor cantidad posible de tokens, manteniendo precisión, consistencia y seguridad.

## Reglas principales

### 1. No leer archivos innecesariamente

Antes de abrir un archivo:

* Determina si realmente es necesario.
* No leas archivos completos si solo necesitas una función, componente o sección.
* Usa búsquedas por nombre, función, variable, componente o texto exacto.
* Prioriza fragmentos pequeños sobre archivos completos.

### 2. Trabajar por contexto

Antes de modificar código:

1. Identifica el archivo objetivo.
2. Identifica exactamente qué parte debe cambiar.
3. Lee únicamente el contexto necesario.
4. Realiza el cambio.
5. Verifica únicamente lo afectado.

No recorras todo el proyecto salvo que sea estrictamente necesario.

### 3. Evitar repetir información

No repitas:

* Código que no cambió.
* Archivos completos.
* Dependencias ya conocidas.
* Explicaciones obvias.
* Contexto que ya está disponible.

Cuando sea suficiente, responde:

`Modificado: src/components/Header.tsx`

en lugar de mostrar todo el archivo.

### 4. Búsqueda antes que lectura

Cuando necesites encontrar algo, busca primero.

Ejemplos:

* Nombre de componente.
* Nombre de función.
* Variable.
* Endpoint.
* Clase CSS.
* Texto visible.
* Importación.
* Error.

Después abre solamente las líneas relevantes.

### 5. Ediciones quirúrgicas

Cuando el cambio sea pequeño:

* Modifica solamente la sección afectada.
* No reformatees archivos completos.
* No cambies nombres innecesariamente.
* No reorganices imports sin necesidad.
* No hagas refactors no solicitados.

### 6. Inspección progresiva

Usa este orden:

`buscar → leer fragmento → modificar → verificar`

No:

`leer proyecto completo → analizar todo → modificar`

### 7. Errores

Ante un error:

1. Lee únicamente el mensaje de error.
2. Localiza el archivo y línea afectados.
3. Inspecciona el contexto inmediato.
4. Corrige la causa.
5. Verifica nuevamente.

No analices todo el proyecto por un error localizado.

### 8. Dependencias

No abras `node_modules`.

No analices dependencias completas.

Consulta `package.json` únicamente cuando sea necesario para:

* Instalar una dependencia.
* Verificar una versión.
* Comprobar un script.
* Resolver incompatibilidades.

### 9. Archivos grandes

Para archivos grandes:

* Nunca cargues el archivo completo por defecto.
* Busca primero el componente o sección.
* Trabaja en bloques pequeños.
* Mantén el contexto mínimo necesario.

### 10. Respuestas

Las respuestas deben ser concisas.

Formato recomendado:

**Cambio**

* `src/app/page.tsx` — actualizado Hero.

**Resultado**

* Hero responsive.
* CTA corregido.
* Sin cambios adicionales.

Evita explicaciones extensas salvo que el usuario las solicite.

### 11. No hacer cambios no solicitados

No:

* Cambiar arquitectura.
* Cambiar librerías.
* Actualizar dependencias.
* Modificar estilos globales.
* Renombrar archivos.
* Refactorizar código.
* Cambiar configuración.

excepto cuando sea necesario para resolver el problema solicitado.

### 12. Prioridad

Cuando existan varias soluciones:

1. Solución más pequeña.
2. Menor cantidad de archivos modificados.
3. Menor riesgo de regresiones.
4. Menor consumo de contexto.
5. Mantener la arquitectura existente.

## Regla de oro

**Usa el mínimo contexto necesario para realizar correctamente el trabajo.**

No necesitas conocer todo el proyecto para modificar una pieza del proyecto.
