# 🛠️ 03 - Pruebas Unitarias: Librerías y Utilidades

Documentación de los archivos de prueba unitaria correspondientes a módulos de seguridad y utilidades ubicados en `tests/unit/lib/`.

---

## 🛠️ 1. Tokens JWT (`tests/unit/lib/jwt.test.ts`)

* **Total de Pruebas:** 4 escenarios (✅ Pasaron 4/4)
* **Escenarios Evaluados:**
  1. Generación de token JWT firmado con algoritmo `HS256` y expiración válida.
  2. Verificación de firma y decodificación correcta del payload (ID, email, rol).
  3. Rechazo de tokens manipulados o firmas corruptas retornando `null`.
  4. Extracción de sesión desde cookies HttpOnly del servidor (`getSession`).

---

## 🛠️ 2. Google reCAPTCHA v2 (`tests/unit/lib/recaptcha.test.ts`)

* **Total de Pruebas:** 4 escenarios (✅ Pasaron 4/4)
* **Escenarios Evaluados:**
  1. Rechazo inmediato ante envío de token nulo o vacío.
  2. Validación exitosa ante respuesta `success: true` de la API de Google siteverify.
  3. Manejo de tokens exppirados o rechazados por la API.
  4. Manejo seguro de fallos de conexión o timeout de red durante la verificación.

---

## 🛠️ 3. Utilidades y Formateadores (`tests/unit/lib/utils.test.ts`)

* **Total de Pruebas:** 6 escenarios (✅ Pasaron 6/6)
* **Escenarios Evaluados:**
  1. Fusión de clases CSS con Tailwind Merge (`cn`).
  2. Formateo de moneda colombiana `COP` con separador de miles sin decimales (`$ 1.500.000`).
  3. Manejo seguro de entradas `null`, `undefined` o cadenas no numéricas en moneda.
  4. Formateo de fechas para Colombia (`es-CO`).
  5. Retorno de guion raya (`-`) ante fechas inválidas o nulas.
  6. Utilidades de cálculo auxiliar.
