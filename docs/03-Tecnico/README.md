# 03 - Manual Técnico e Instrucciones de Instalación

Este documento contiene las especificaciones técnicas del stack, la configuración de variables de entorno, la integración de Google OAuth 2.0 y los pasos de instalación y ejecución.

---

## 🛠️ 1. Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Framework Web** | Next.js (App Router) | `16.3.3` | Renderizado SSR, Server Actions y rutas API. |
| **Biblioteca UI** | React | `19.2.8` | Componentes interactivos. |
| **Estilos & CSS** | Tailwind CSS / PostCSS | `v4` | Sistema de diseño y utilidad responsive. |
| **ORM / Acceso a Datos** | Drizzle ORM | `^0.45.0` | Modelado tipado para múltiples motores de BD. |
| **Driver PostgreSQL** | `postgres` (postgres.js) | `^3.4.5` | Pool de conexiones a la BD de Hermes IA. |
| **Driver MySQL** | `mysql2` | `^3.14.0` | Pool de conexiones a la BD de usuarios y catálogo. |
| **Criptografía & Auth** | `jose` & `bcryptjs` | `^6.0.8` / `^3.0.2` | Firma de tokens JWT en Edge y hash de contraseñas. |
| **Proveedor OAuth** | Google OAuth 2.0 | API v3 | Autenticación federada segura sin contraseñas. |
| **Iconografía** | `lucide-react` | `^1.35.0` | Iconos vectoriales para toda la UI. |

---

## ⚙️ 2. Variables de Entorno (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto basándote en la plantilla `.env.example`:

```env
# 1. Base de datos PostgreSQL (Hermes IA / Contabilidad)
POSTGRES_DATABASE_URL="postgres://usuario:password@host:5432/cmegalider?sslmode=prefer"

# 2. Base de datos MySQL (Usuarios / Tienda / Catálogo)
MYSQL_DATABASE_URL="mysql://usuario:password@127.0.0.1:3306/u200862310_megalider"

# 3. Clave Secreta para Tokens JWT
NEXTAUTH_SECRET="tu_clave_secreta_jwt_muy_segura_aqui"
NEXTAUTH_URL="http://localhost:3000"

# 4. Google OAuth 2.0 (Para Inicio de Sesión con Google)
GOOGLE_CLIENT_ID="tu_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu_google_client_secret"
```

---

## 🔑 3. Configuración de Google Cloud Console

Para habilitar el login con Google en entornos locales y de producción:

1. **Crear Proyecto:** En [Google Cloud Console](https://console.cloud.google.com/), crea un proyecto llamado `Megalider Web`.
2. **Pantalla de Consentimiento OAuth:**
   * Tipo: **Externo** (o Interno si usas Google Workspace).
   * Nombre de la App: `Cigarrería Megalider`.
   * Permisos (Scopes): `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
3. **Credenciales de ID de Cliente OAuth 2.0:**
   * Tipo: **Aplicación web**.
   * **Orígenes de JavaScript autorizados:**
     * `http://localhost:3000` *(Desarrollo)*
     * `https://tudominio.com` *(Producción)*
   * **URIs de redireccionamiento autorizados:**
     * `http://localhost:3000/api/auth/google/callback` *(Desarrollo)*
     * `https://tudominio.com/api/auth/google/callback` *(Producción)*

---

## 🌐 4. Endpoints de Autenticación de la API

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/api/auth/google` | `GET` | Genera el token criptográfico anti-CSRF (`state`), lo guarda en la cookie `oauth_state` y redirige a la pantalla de autorización de Google. |
| `/api/auth/google/callback` | `GET` | Recibe el código de autorización, lo canjea por el token de acceso, consulta el perfil de Google, sincroniza el usuario en MySQL (`usuarios`), emite la cookie JWT `auth_token` y redirige al usuario según su rol (Clientes a `/`, Staff a `/dashboard`). |

---

## 🚀 5. Instrucciones de Instalación y Ejecución

### Prerrequisitos
* Node.js `>= 20.0.0`
* Servidor MySQL (127.0.0.1:3306 o remoto) con la tabla `usuarios` creada.
* Servidor PostgreSQL con la base de datos de Hermes IA (`cmegalider`).

### Pasos:
1. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

2. **Crear las tablas en MySQL (si no están creadas):**
   Ejecuta el script [`scripts/schema_mysql.sql`](../../scripts/schema_mysql.sql) en phpMyAdmin o MySQL Workbench.

3. **Iniciar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en:
   * Landing Pública: `http://localhost:3000`
   * Portal de Acceso (Login): `http://localhost:3000/login`
   * Dashboard Administrativo: `http://localhost:3000/dashboard`

4. **Compilar para producción:**
   ```bash
   npm run build
   npm run start
   ```

---

## 🔒 6. Seguridad y Flujo de Sesiones

1. **Tokens JWT:** Se firman utilizando el algoritmo `HS256` mediante la biblioteca estándar `jose` compatible con el runtime Edge de Next.js.
2. **Cookies Seguras:** La cookie `auth_token` tiene flags `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
3. **Control RBAC en Edge:** El [`middleware.ts`](../../middleware.ts) intercepta peticiones a rutas administrativas y valida el rol del token antes de renderizar la página. Si un usuario con rol `CLIENTE` intenta acceder al dashboard, es redirigido inmediatamente a `/`.
4. **Protección CSRF en OAuth:** Validación estricta del parámetro `state` almacenado en cookies temporales de 10 minutos de vida.
