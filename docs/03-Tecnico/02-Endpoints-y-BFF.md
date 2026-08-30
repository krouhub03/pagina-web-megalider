# 🌐 02 - Endpoints de API y Backend for Frontend (BFF)

Este documento especifica las rutas API de autenticación, la arquitectura Backend for Frontend (BFF) y la resolución de parámetros asíncronos en Next.js 16+.

---

## 🌐 1. Catálogo de Endpoints de Autenticación API

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/api/auth/google` | `GET` | Genera el token criptográfico anti-CSRF (`state`), lo guarda en la cookie `oauth_state` y redirige a la pantalla de autorización de Google. |
| `/api/auth/google/callback` | `GET` | Recibe el código de autorización, lo canjea por el token de acceso, consulta el perfil de Google, sincroniza el usuario en MySQL (`usuarios`), emite la cookie JWT `auth_token` y redirige al usuario según su rol (Clientes a `/`, Staff a `/dashboard`). |

---

## 🌐 2. Manual Técnico de Backend for Frontend (BFF) & Route Handlers

* **Convención de Archivo:** Archivos `app/**/route.ts` manejando métodos `GET`, `POST`, `PUT`, `DELETE`, etc.
* **Resolución de Parámetros Asíncronos (Next.js 16+):**
  ```ts
  export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // ...
  }
  ```
* **Lectura de Payloads:** Métodos `request.json()`, `request.formData()` y clonación `request.clone()` para relecturas seguras.
* **Seguridad en Redirecciones:**
  - Prevención de *Open Redirects* mediante comprobación de origen: `destination.origin === request.nextUrl.origin`.
  - Validación de firmas/secretos en webhooks de revalidación (`revalidateTag`).
