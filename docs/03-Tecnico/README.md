# 03 - Manual Técnico e Instrucciones de Instalación

Este documento contiene las especificaciones técnicas del stack, la configuración de variables de entorno, la integración de Google OAuth 2.0, la compatibilidad con **Cache Components** y los pasos de instalación y ejecución.

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

---

## ⚡ 7. Alineación con Estándares Next.js (Authentication & Cache Components)

El sistema cumple rigurosamente con las dos guías oficiales de autenticación de Next.js:

1. **[Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication):**
   * **Server Actions & Route Handlers:** Procesamiento 100% en el servidor sin exponer credenciales.
   * **Asincronía en Next.js 16:** Invocación asíncrona de `await cookies()`.
   * **Optimistic Checks en Middleware:** Comprobaciones rápidas del JWT en Edge sin llamadas a bases de datos para no degradar el prefetching.
   * **Data Access Layer (DAL) & DTOs:** Centralización del usuario en [`lib/auth/jwt.ts`](../../lib/auth/jwt.ts) protegido con `import 'server-only'` y emisión de datos públicos limpios sin contraseñas.

2. **[Authentication with Cache Components Guide](https://nextjs.org/docs/app/guides/authentication-with-cache-components):**
   * **Límites de Suspense:** Los accesos a parámetros dinámicos (`searchParams` o cookies) están encapsulados en componentes bajo `<Suspense>`, preservando el shell estático.
   * **Push Dynamic Access Down:** Los layouts principales (ej. [`app/(admin)/layout.tsx`](../../app/(admin)/layout.tsx)) no realizan llamadas bloqueantes a `cookies()` en su raíz, permitiendo el streaming inmediato de la UI.
   * **Reglas de Caché Segura:** Las directivas de caché nunca leen cookies directamente en `use cache` plano; para sesiones privadas se emplea el scope del cliente (`use cache: private`) y para caché del servidor se extrae exclusivamente el `userId` en `cacheTag`.

---

## 🌐 8. Manual Técnico de Backend for Frontend (BFF) & Route Handlers

* **Convención de Archivo:** `app/**/route.ts` manejando métodos `GET`, `POST`, `PUT`, `DELETE`, etc.
* **Resolución de Parámetros Asíncronos (Next.js 16+):**
  ```ts
  export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // ...
  }
  ```
* **Lectura de Payloads:** Métodos `request.json()`, `request.formData()` y clonación `request.clone()` para relecturas seguras.
* **Seguridad:**
  - Prevención de *Open Redirects* mediante comprobación de origen `destination.origin === request.nextUrl.origin`.
  - Validación de firmas/secretos en webhooks de revalidación (`revalidateTag`).

---

## ⚡ 9. Guía Técnica de Lazy Loading & Code Splitting

* **Componentes Dinámicos:** Utilización de `next/dynamic` para componentes pesados y modales condicionales:
  ```tsx
  const CartDrawer = dynamic(() => import('@/components/cart/cart-drawer'), {
    loading: () => <SkeletonLoader />,
  });
  ```
* **Desactivación de SSR:** La opción `{ ssr: false }` está estrictamente reservada para Client Components (`'use client'`). Prohibido su uso en Server Components.
* **Importación de Módulos Bajo Demanda:** Librerías de procesamiento como `fuse.js` se cargan dentro del handler de evento con `const Fuse = (await import('fuse.js')).default`.
* **Magic Comments:** Compatibilidad con `/* webpackIgnore: true */`, `/* turbopackIgnore: true */` y `/* turbopackOptional: true */`.

---

## 📊 10. Instrumentación y Medición de Core Web Vitals

* **Componente de Aislamiento:** Implementado en `app/_components/web-vitals.tsx` con directiva `'use client'`, garantizando que `RootLayout` se mantenga como Server Component.
* **Métricas Rastreadas:** TTFB, FCP, LCP (< 2.5s), CLS (< 0.1), INP (< 200ms).
* **Envío No Bloqueante:** Implementación mediante `navigator.sendBeacon('/api/analytics', payload)` o fallback a `fetch(..., { keepalive: true })`.

---

## 🤖 11. Estándares de Agentes IA y Optimización de Tokens

* **Directivas de Contexto:** Código modular, reducción de ruido sintáctico, tipado estricto con TypeScript 5+.
* **Skills Indexadas en el Proyecto:**
  - [`nextjs-coding`](../../.agents/skills/nextjs-coding/SKILL.md)
  - [`megalider-brand`](../../.agents/skills/megalider-brand/SKILL.md)
  - [`token-optimization`](../../.agents/skills/token-optimization/SKILL.md)
  - [`nextjs-analytics`](../../.agents/skills/nextjs-analytics/SKILL.md)
  - [`nextjs-lazy-loading`](../../.agents/skills/nextjs-lazy-loading/SKILL.md)
  - [`nextjs-bff`](../../.agents/skills/nextjs-bff/SKILL.md)
  - [`nextjs-unit-testing`](../../.agents/skills/nextjs-unit-testing/SKILL.md)

---

## 🧪 12. Arquitectura de Pruebas Unitarias (Vitest + Testing Library)

* **Entorno y Ejecución:**
  - Configuración centralizada en [`vitest.config.mts`](../../vitest.config.mts) con aliases para `@/*`, `server-only` y `client-only`.
  - Entorno de ejecución dual: `node` por defecto para servicios/criptografía y `// @vitest-environment jsdom` para componentes UI de React.
  - Setup global en [`tests/setup.ts`](../../tests/setup.ts) con `@testing-library/jest-dom` y variables de entorno seguras para tests.
* **Comandos Disponibles:**
  ```bash
  npm test              # Ejecución completa en lote (CI/CD)
  npm run test:watch    # Modo interactivo para desarrollo
  npm run test:coverage # Análisis y reporte de cobertura de código
  ```
* **Mocks Canónicos para Next.js 16 (App Router):**
  - `next/navigation`: `useRouter` (`push`, `refresh`), `useSearchParams` (`get`).
  - `next/headers`: `cookies()` asíncrono (`get`, `set`, `delete`).
  - `next/cache`: `revalidatePath`, `revalidateTag`.
  - `@/lib/db/mysql`: Mocking tipado de Drizzle ORM queries (`findFirst`, `insert`).

---

## 🛒 13. Gestión de Estado Global Cliente (Zustand Stores)

* **Store de Filtros de Facturas (`lib/stores/use-facturas-filtros-store.ts`):**
  - **Estado:** `busqueda: string`, `fechaInicio`, `fechaFin`, `proveedorFiltro`.
  - **Acciones:** `setBusqueda()`, `setFechaInicio()`, `setFechaFin()`, `setProveedorFiltro()`, `resetFiltros()`.
  - **Uso:** Filtrado reactivo en tiempo real en la lista de facturas sin recargar la página ni realizar llamadas redundantes al servidor.

---

## 📄 14. Módulo de Contabilidad y Facturas de Compra de Mercancía

* **Propósito:** Gestión, auditoría, corrección y control tributario de las facturas de compra procesadas por Hermes IA y cargadas manualmente al sistema.
* **Componentes y Rutas:**
  - `app/(admin)/contabilidad/facturas/page.tsx`: Server Component de entrada que consulta PostgreSQL (`getFacturas()`) y pasa las facturas a `FacturasTablaInteractive`.
  - `app/(admin)/contabilidad/facturas/FacturasTablaInteractive.tsx`: Client Component con consumo granular de `useFacturasFiltrosStore` de Zustand para filtrado reactivo por N° de factura, CUFE, proveedor o NIT.
  - `app/(admin)/contabilidad/facturas/[id]/page.tsx`: Server Component de detalle dinámico (`await params`) con resumen de proveedor/adquiriente, CUFE compacto, recálculo automático de ítems y tabla con `tfoot` pegajoso (*sticky*).
  - `ModalEditarFactura.tsx`: Modal para corrección de datos identificativos de la factura.
  - `ModalEditarFacturaItem.tsx`: Modal para crear, editar o eliminar líneas de producto recalculando el total en tiempo real.
  - `BotonEliminarFactura.tsx`: Confirmación de borrado en cascada.
  - `BotonCopiarCufe.tsx`: Copiado interactivo de código CUFE al portapapeles.
* **Servicios y Sincronización en BD (`services/contabilidad.service.ts`):**
  - `getFacturas()` & `getFacturaDetalle(facturaId)`: Consultas ORM con relaciones (`proveedor`, `items`).
  - `actualizarFactura(facturaId, datos)`: Edición de metadatos de la factura.
  - `eliminarFactura(facturaId)`: Eliminación de factura con borrado en cascada en PostgreSQL.
  - `recalcularTotalesFactura(facturaId)`: Función auxiliar ejecutada tras cada mutación de ítems para recalcular y actualizar en tiempo real los campos `subtotal`, `iva`, `impoconsumo`, `otros_impuestos_total` y `total_factura` en PostgreSQL.
  - `actualizarFacturaItem()`, `crearFacturaItem()`, `eliminarFacturaItem()`: Gestión de líneas de producto sincronizadas.


