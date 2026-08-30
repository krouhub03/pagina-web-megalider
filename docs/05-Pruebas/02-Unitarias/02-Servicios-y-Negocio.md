# 💼 02 - Pruebas Unitarias: Servicios de Negocio

Documentación de los archivos de prueba unitaria correspondientes a la lógica de negocio y autenticación ubicados en `tests/unit/services/`.

---

## 💼 Servicio de Autenticación (`tests/unit/services/auth.service.test.ts`)

* **Entorno:** `node`
* **Mocks Aplicados:** `@/lib/db/mysql` (queries Drizzle ORM `findFirst`, `insert`), `bcryptjs`, `jose` JWT.
* **Total de Pruebas:** 14 escenarios (✅ Pasaron 14/14)
* **Escenarios Evaluados:**
  1. Rejection al enviar campos requeridos vacíos (email o password nulo).
  2. Retorno de error claro ante intentos de inicio de sesión con correo no registrado.
  3. Rechazo de login en cuentas marcadas como inactivas (`activo: false`).
  4. Manejo de cuentas registradas únicamente mediante Google (sin `password_hash`).
  5. Verificación de hash de contraseña incorrecta mediante `bcrypt.compare`.
  6. Login exitoso con emisión de token JWT firmado y cookie HttpOnly `auth_token`.
  7. Validación de longitud mínima de contraseña (>= 8 caracteres) y nombre en el registro.
  8. Validación sintáctica de formato de correo electrónico mediante expresiones regulares.
  9. Verificación de coincidencia exacta entre la contraseña y la confirmación.
  10. Aceptación obligatoria de políticas de tratamiento de datos personales (Ley 1581).
  11. Validación de respuesta del token reCAPTCHA con Google siteverify.
  12. Prevención de registro duplicado cuando el correo electrónico ya existe en MySQL.
  13. Registro exitoso con asignación automática del rol `CLIENTE` en MySQL.
  14. Manejo seguro de excepciones inesperadas en la base de datos.
