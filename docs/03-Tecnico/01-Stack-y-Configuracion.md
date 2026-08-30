# 🛠️ 01 - Stack Tecnológico y Configuración

Este documento detalla las versiones exactas del stack de software, la configuración de variables de entorno, la integración con Google Cloud Console y los pasos para instalar y ejecutar el proyecto.

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
| **Aislamiento Servidor** | `server-only` | `^0.0.1` | Garantiza que funciones criptográficas y DAL nunca se ejecuten en el cliente. |
| **Proveedor OAuth** | Google OAuth 2.0 | API v3 | Autenticación federada segura sin contraseñas. |
| **Estado Cliente** | `zustand` | `^5.0.3` | Estado inmutable, libre de `<Provider>` globales y persistencia en `localStorage`. |
| **Iconografía** | `lucide-react` | `^1.35.0` | Iconos vectoriales para toda la UI. |
| **Test Runner & Asserts** | `vitest` | `^4.1.11` | Ejecución de pruebas unitarias ultrarrápidas con soporte ESM. |
| **DOM & UI Testing** | `@testing-library/react` & `jsdom` | `^16.3` / `^28.1` | Simulación de DOM para pruebas de componentes y eventos de usuario. |

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

## 🚀 4. Instrucciones de Instalación y Ejecución

### Prerrequisitos
* Node.js `>= 20.0.0`
* Servidor MySQL (127.0.0.1:3306 o remoto) con la tabla `usuarios` creada.
* Servidor PostgreSQL con la base de datos de Hermes IA (`cmegalider`).

### Pasos:
1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Crear las tablas en MySQL (si no están creadas):**
   Ejecuta el script `scripts/schema_mysql.sql` en phpMyAdmin o MySQL Workbench.

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
